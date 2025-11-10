# inventory/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'bills', views.BillViewSet)
router.register(r'purchase-orders', views.PurchaseOrderViewSet)
router.register(r'workflows', views.WorkflowRuleViewSet)
router.register(r'alerts', views.AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('inventory-report/', views.generate_inventory_report, name='inventory-report'),
]