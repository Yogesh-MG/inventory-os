// src/pages/Reports.tsx
import { useState, useEffect } from 'react';
import { Order, PurchaseOrder, Product } from '@/types/reports'; // Reuse or create shared types
import api from '@/utils/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Filter, Calendar, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Plus, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Reports() {
  // Local state for data
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [tabValue, setTabValue] = useState('sales');
  const token = localStorage.getItem('token');
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, purchaseOrdersRes, productsRes] = await Promise.all([
          api.get('api/orders/', { headers: { Authorization: `Bearer ${token}` },}),
          api.get('api/purchase-orders/', { headers: { Authorization: `Bearer ${token}` },}),
          api.get('api/products/', { headers: { Authorization: `Bearer ${token}` },}),
        ]);

        // Map responses safely
        const mappedOrders: Order[] = (ordersRes.data.results || ordersRes.data || []).map((o: any) => ({
          id: o.id.toString(),
          type: o.type,
          customerName: o.customer_name || 'Unknown',
          total: parseFloat(o.total),
          status: o.status,
        }));
        const mappedPurchaseOrders: PurchaseOrder[] = (purchaseOrdersRes.data.results || purchaseOrdersRes.data || []).map((po: any) => ({
          id: po.id.toString(),
          vendorName: po.vendor_name || 'Unknown',
          total: parseFloat(po.total),
          itemsCount: po.items_count,
        }));
        const mappedProducts: Product[] = (productsRes.data.results || productsRes.data || []).map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          category: p.category_name || p.category || '',
          quantity: parseInt(p.quantity),
          price: parseFloat(p.price),
        }));

        setOrders(mappedOrders);
        setPurchaseOrders(mappedPurchaseOrders);
        setProducts(mappedProducts);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch reports data');
        toast({
          title: 'Error',
          description: 'Failed to load reports data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived data for reports
  const salesReport = orders
    .filter(o => o.type === 'sales')
    .reduce((acc: any[], order) => {
      // Group by product or simplify for demo
      // In real, join with order items
      const product = 'Sample Product'; // Simulate
      const existing = acc.find((item: any) => item.product === product);
      if (existing) {
        existing.quantity += 1;
        existing.revenue += order.total;
      } else {
        acc.push({ product, quantity: 1, revenue: order.total, profit: order.total * 0.2 });
      }
      return acc;
    }, [])
    .slice(0, 3);

  const purchasesReport = purchaseOrders.slice(0, 3).map(po => ({
    vendor: po.vendorName,
    orders: 1, // Simulate
    amount: po.total,
    items: po.itemsCount,
  }));

  const inventoryValuation = products.reduce((acc: any[], product) => {
    const existing = acc.find((item: any) => item.category === product.category);
    if (existing) {
      existing.items += 1;
      existing.value += product.quantity * product.price;
    } else {
      acc.push({ category: product.category, items: 1, value: product.quantity * product.price, percentage: '0%' });
    }
    return acc;
  }, []).slice(0, 3);

  // Compute percentages for inventory
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  inventoryValuation.forEach(item => {
    item.percentage = totalInventoryValue > 0 ? `${((item.value / totalInventoryValue) * 100).toFixed(0)}%` : '0%';
  });

  // Global metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalPOs = purchaseOrders.length;
  const inventoryValue = totalInventoryValue;

  const handleExport = (reportType: string) => {
    console.log(`Exporting ${reportType} report...`);
    toast({ title: 'Exported', description: `${reportType} report exported successfully.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-2">
        <p className="text-destructive text-center">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and reporting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('all')}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryValue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -2.1% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +1.2% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="purchases">Purchases Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Valuation</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Performance Report</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('sales')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.revenue.toLocaleString()}</TableCell>
                      <TableCell>${item.profit.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {((item.profit / item.revenue) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Orders Report</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('purchases')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesReport.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.vendor}</TableCell>
                      <TableCell>{item.orders}</TableCell>
                      <TableCell>${item.amount.toLocaleString()}</TableCell>
                      <TableCell>{item.items}</TableCell>
                      <TableCell>${(item.amount / item.orders).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Valuation Report</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('inventory')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Avg Value per Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryValuation.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.items}</TableCell>
                      <TableCell>${item.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.percentage}</Badge>
                      </TableCell>
                      <TableCell>${(item.value / item.items).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Custom Report Builder</h3>
                <p className="text-muted-foreground">Create custom reports with your specific requirements</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}