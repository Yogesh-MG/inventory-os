# inventory/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Category(models.Model):
    """
    Categories for organizing products.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Core inventory product model with stock tracking.
    """
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=50, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    min_stock = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def stock_status(self):
        """
        Returns stock status: 'low', 'medium', 'good'.
        """
        if self.quantity <= self.min_stock:
            return 'low'
        elif self.quantity <= self.min_stock * 2:
            return 'medium'
        return 'good'

    @property
    def total_value(self):
        """
        Current total value of this product in stock.
        """
        return self.quantity * self.price


class Customer(models.Model):
    """
    Customers and vendors (unified via type field).
    """
    TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('vendor', 'Vendor'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='customer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Order(models.Model):
    """
    Sales and purchase orders.
    """
    TYPE_CHOICES = [
        ('sales', 'Sales'),
        ('purchase', 'Purchase'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.CharField(max_length=20, primary_key=True)  # Custom ID like 'ORD-001'
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()} Order {self.id}"


class OrderItem(models.Model):
    """
    Line items for orders, linking products to orders.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def subtotal(self):
        return self.quantity * self.price


class Bill(models.Model):
    """
    Vendor bills for tracking payments.
    """
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    id = models.CharField(max_length=20, primary_key=True)  # e.g., 'BILL-001'
    vendor = models.ForeignKey(Customer, on_delete=models.PROTECT, limit_choices_to={'type': 'vendor'})
    bill_number = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Bill {self.bill_number} - {self.vendor.name}"

    @property
    def is_overdue(self):
        return self.status == 'unpaid' and self.due_date < timezone.now().date()


class PurchaseOrder(models.Model):
    """
    Dedicated purchase orders.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('received', 'Received'),
    ]

    id = models.CharField(max_length=20, primary_key=True)  # e.g., 'PO-001'
    vendor = models.ForeignKey(Customer, on_delete=models.PROTECT, limit_choices_to={'type': 'vendor'})
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    total = models.DecimalField(max_digits=10, decimal_places=2)
    items_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"PO {self.id} - {self.vendor.name}"


class WorkflowRule(models.Model):
    """
    Automation workflow rules (basic for alerts/reorders).
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    id = models.CharField(max_length=20, primary_key=True)  # e.g., 'WF-001'
    name = models.CharField(max_length=200)
    description = models.TextField()
    trigger_condition = models.CharField(max_length=200)  # e.g., "quantity < min_stock"
    action = models.CharField(max_length=200)  # e.g., "send_email"
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='inactive')
    last_triggered = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Alert(models.Model):
    """
    System alerts and notifications.
    """
    TYPE_CHOICES = [
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Info'),
    ]
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
    ]

    id = models.CharField(max_length=20, primary_key=True)  # e.g., 'ALT-001'
    title = models.CharField(max_length=200)
    description = models.TextField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unread')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title