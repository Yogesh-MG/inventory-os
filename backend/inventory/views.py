# inventory/views.py
from rest_framework import viewsets, status
from django.db import models
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from .models import (
    Category, Product, Customer, Order, Bill,
    PurchaseOrder, WorkflowRule, Alert
)
from .serializers import (
    CategorySerializer, ProductSerializer, CustomerSerializer,
    OrderSerializer, BillSerializer, PurchaseOrderSerializer,
    WorkflowRuleSerializer, AlertSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for products with custom actions for analytics.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'sku', 'is_active']
    search_fields = ['name', 'sku', 'barcode']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get products with low stock.
        """
        low_stock = self.queryset.filter(quantity__lte=models.F('min_stock'))
        serializer = self.get_serializer(low_stock, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def total_value(self, request):
        """
        Get total inventory value.
        """
        total = self.queryset.aggregate(total_value=Sum('total_value'))['total_value'] or 0
        return Response({'total_value': total})


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for customers/vendors.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'email', 'company']


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for orders with nested items support.
    """
    queryset = Order.objects.prefetch_related('items__product', 'customer')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'status', 'customer']

    def get_queryset(self):
        return super().get_queryset().select_related('customer')

    @action(detail=False, methods=['get'])
    def revenue(self, request):
        """
        Get total revenue from sales orders.
        """
        revenue = self.queryset.filter(
            type='sales', status__in=['confirmed', 'shipped', 'delivered']
        ).aggregate(total=Sum('total'))['total'] or 0
        return Response({'revenue': revenue})


class BillViewSet(viewsets.ModelViewSet):
    """
    ViewSet for bills.
    """
    queryset = Bill.objects.select_related('vendor')
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'vendor']

    def get_queryset(self):
        return super().get_queryset().order_by('-due_date')


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for purchase orders.
    """
    queryset = PurchaseOrder.objects.select_related('vendor')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'vendor']


class WorkflowRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for workflow rules.
    """
    queryset = WorkflowRule.objects.all()
    serializer_class = WorkflowRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']


class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for alerts.
    """
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'status']

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """
        Mark alert as read.
        """
        alert = self.get_object()
        alert.status = 'read'
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)