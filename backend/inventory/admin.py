from django.contrib import admin
from .models import Product, PurchaseOrder, Category, OrderItem, Customer, Order, Bill, WorkflowRule, Alert
# Register your models here.
admin.site.register(Product)
admin.site.register(PurchaseOrder)
admin.site.register(Category)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Customer)
admin.site.register(Bill)
admin.site.register(WorkflowRule)
admin.site.register(Alert)