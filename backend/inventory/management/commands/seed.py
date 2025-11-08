# inventory/management/commands/seed_data.py (updated line for bill_number)
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from faker import Faker
from faker.providers import lorem
from decimal import Decimal
import random
from datetime import timedelta
from ...models import (
    Category, Product, Customer, Order, OrderItem,
    Bill, PurchaseOrder, WorkflowRule, Alert
)
from django.utils import timezone

fake = Faker('en_IN')
fake.add_provider(lorem)


class Command(BaseCommand):
    help = 'Seed dummy data for inventory app'

    @transaction.atomic
    def handle(self, *args, **options):
        # Clear existing data (reverse dependencies first)
        Alert.objects.all().delete()
        WorkflowRule.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        Bill.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Customer.objects.all().delete()

        # Create admin user if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'password')

        # Seed categories
        categories = []
        category_names = ['Electronics', 'Office Supplies', 'Furniture', 'Books', 'Clothing']
        for name in category_names:
            cat = Category.objects.create(
                name=name,
                description=fake.paragraph(nb_sentences=2)
            )
            categories.append(cat)

        # Seed products
        products = []
        for _ in range(50):
            product = Product.objects.create(
                name=fake.word().capitalize() + ' ' + fake.word().capitalize(),
                sku=fake.uuid4()[:8].upper(),
                barcode=fake.ean13(),
                category=random.choice(categories),
                quantity=random.randint(0, 200),
                price=Decimal(str(random.uniform(10.0, 500.0))),
                min_stock=random.randint(5, 50),
                description=fake.paragraph(nb_sentences=3),
                is_active=random.choice([True, False])
            )
            products.append(product)

        # Seed customers
        customers = []
        for _ in range(20):
            customer_type = random.choice(['customer', 'vendor'])
            customer = Customer.objects.create(
                name=fake.name(),
                email=fake.email(),
                phone=fake.phone_number(),
                company=fake.company(),
                address=fake.address(),
                type=customer_type,
                is_active=True
            )
            customers.append(customer)

        # Seed orders with unique IDs using counter
        order_num = 1
        for _ in range(30):
            order_type = random.choice(['sales', 'purchase'])
            customer = random.choice([c for c in customers if (order_type == 'sales' and c.type == 'customer') or (order_type == 'purchase' and c.type == 'vendor')])
            order = Order.objects.create(
                id=f'ORD-{order_num:03d}',
                type=order_type,
                customer=customer,
                status=random.choice(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
                total=Decimal('0.00')
            )
            order_num += 1
            # Add items
            num_items = random.randint(1, 5)
            total = Decimal('0.00')
            for _ in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 10)
                price = product.price  # Use current price
                item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=price
                )
                total += item.subtotal
            order.total = total
            order.save()

        # Seed bills with unique IDs using counter
        bill_num = 1
        for _ in range(10):
            vendor = random.choice([c for c in customers if c.type == 'vendor'])
            Bill.objects.create(
                id=f'BILL-{bill_num:03d}',
                vendor=vendor,
                bill_number=f'INV-{fake.date_object().strftime("%Y")}-{random.randint(1, 999):03d}',
                date=fake.date_this_year(),
                due_date=fake.date_between(start_date='-30d', end_date='+30d'),
                status=random.choice(['unpaid', 'paid', 'overdue']),
                amount=Decimal(str(random.uniform(1000.0, 10000.0)))
            )
            bill_num += 1

        # Seed purchase orders with unique IDs using counter
        po_num = 1
        for _ in range(15):
            vendor = random.choice([c for c in customers if c.type == 'vendor'])
            PurchaseOrder.objects.create(
                id=f'PO-{po_num:03d}',
                vendor=vendor,
                date=fake.date_this_year(),
                status=random.choice(['pending', 'approved', 'received']),
                total=Decimal(str(random.uniform(500.0, 5000.0))),
                items_count=random.randint(1, 10)
            )
            po_num += 1

        # Seed workflows
        WorkflowRule.objects.create(
            id='WF-001',
            name='Low Stock Alert',
            description='Send email when inventory falls below minimum level',
            trigger_condition='Inventory Level < 10',
            action='Send Email Alert',
            status='active',
            last_triggered=timezone.now() - timedelta(hours=2)
        )
        WorkflowRule.objects.create(
            id='WF-002',
            name='Auto Reorder',
            description='Automatically create purchase orders for low stock items',
            trigger_condition='Stock Level < Reorder Point',
            action='Create Purchase Order',
            status='active',
            last_triggered=timezone.now() - timedelta(days=1)
        )

        # Seed alerts
        Alert.objects.create(
            id='ALT-001',
            title='Critical Stock Level',
            description='Laptop Pro inventory below critical threshold',
            type='critical',
            status='unread'
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded data!'))