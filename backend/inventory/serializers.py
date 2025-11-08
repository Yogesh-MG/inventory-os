# inventory/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, Product, Customer, Order, OrderItem,
    Bill, PurchaseOrder, WorkflowRule, Alert
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField( read_only=True)
    stock_status = serializers.CharField(read_only=True)
    total_value = serializers.DecimalField( max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'category', 'category_name',
            'quantity', 'price', 'min_stock', 'description', 'stock_status',
            'total_value', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'stock_status', 'total_value']


class CustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    total_order_value = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'company', 'address', 'type',
            'order_count', 'total_order_value', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'order_count', 'total_order_value']

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_total_order_value(self, obj):
        return sum(order.total for order in obj.orders.all() if order.status != 'cancelled')


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.DecimalField( max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'quantity', 'price', 'subtotal'
        ]
        read_only_fields = ['id', 'subtotal', 'product_name']


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_company = serializers.CharField(source='customer.company', read_only=True)
    items = OrderItemSerializer( many=True, read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'type', 'type_display', 'customer', 'customer_name', 'customer_company',
            'status', 'status_display', 'total', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'type_display', 'status_display',
            'customer_name', 'customer_company', 'items', 'total'
        ]

    def create(self, validated_data):
        # Handle items creation
        items_data = self.initial_data.get('items', [])
        order = Order.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product'])
            item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                price=item_data['price']
            )
            total += item.subtotal
        order.total = total
        order.save()
        return order


class BillSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    is_overdue = serializers.BooleanField( read_only=True)

    class Meta:
        model = Bill
        fields = [
            'id', 'vendor', 'vendor_name', 'bill_number', 'date', 'due_date',
            'status', 'amount', 'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vendor_name', 'is_overdue']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'vendor', 'vendor_name', 'date', 'status', 'total',
            'items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vendor_name']


class WorkflowRuleSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WorkflowRule
        fields = [
            'id', 'name', 'description', 'trigger_condition', 'action',
            'status', 'status_display', 'last_triggered', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_display']


class AlertSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'title', 'description', 'type', 'type_display',
            'status', 'status_display', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'type_display', 'status_display']