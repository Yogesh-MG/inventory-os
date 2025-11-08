// src/pages/Analytics.tsx
import { useState, useEffect } from 'react';
import { Product, Order, Customer } from '@/types/analystics'; // Import shared types for these
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  ShoppingCart,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  // Local state for data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          api.get('api/products/', { headers: { Authorization: `Bearer ${token}` },}),
          api.get('api/orders/', { headers: { Authorization: `Bearer ${token}` },}),
          api.get('api/customers/', { headers: { Authorization: `Bearer ${token}` },}),
        ]);

        // Map responses safely
        const mappedProducts: Product[] = (productsRes.data.results || productsRes.data || []).map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          quantity: parseInt(p.quantity),
          price: parseFloat(p.price),
          minStock: parseInt(p.min_stock),
          category: p.category_name || p.category || '',
        }));
        const mappedOrders: Order[] = (ordersRes.data.results || ordersRes.data || []).map((o: any) => ({
          id: o.id.toString(),
          type: o.type,
          status: o.status,
          total: parseFloat(o.total),
        }));
        const mappedCustomers: Customer[] = (customersRes.data.results || customersRes.data || []).map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
        }));

        setProducts(mappedProducts);
        setOrders(mappedOrders);
        setCustomers(mappedCustomers);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch analytics data');
        toast({
          title: 'Error',
          description: 'Failed to load analytics data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Local helper functions (replaced from context)
  const getLowStockProducts = () => {
    return products.filter(p => p.quantity <= p.minStock);
  };

  const getTotalValue = () => {
    return products.reduce((total, product) => total + (product.quantity * product.price), 0);
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

  // Calculate analytics data
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.type === 'sales' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const totalCustomers = customers.length;
  const lowStockCount = getLowStockProducts().length;
  const totalValue = getTotalValue();

  // Monthly sales data (simulated; could fetch real data from backend if available)
  const monthlySales = [
    { month: 'Jan', sales: 12000, orders: 45 },
    { month: 'Feb', sales: 15000, orders: 52 },
    { month: 'Mar', sales: 18000, orders: 61 },
    { month: 'Apr', sales: 22000, orders: 78 },
    { month: 'May', sales: 19000, orders: 67 },
    { month: 'Jun', sales: 25000, orders: 89 },
  ];

  // Category analysis
  const categoryAnalysis = products.reduce((acc: any[], product) => {
    const existingCategory = acc.find(item => item.category === product.category);
    if (existingCategory) {
      existingCategory.products += 1;
      existingCategory.value += product.quantity * product.price;
      existingCategory.quantity += product.quantity;
    } else {
      acc.push({
        category: product.category,
        products: 1,
        value: product.quantity * product.price,
        quantity: product.quantity,
      });
    }
    return acc;
  }, []);

  // Top products by value
  const topProducts = products
    .map(product => ({
      ...product,
      totalValue: product.quantity * product.price,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  // Stock status distribution
  const stockStatus = products.reduce((acc: any, product) => {
    if (product.quantity <= product.minStock) {
      acc.lowStock += 1;
    } else if (product.quantity <= product.minStock * 2) {
      acc.mediumStock += 1;
    } else {
      acc.goodStock += 1;
    }
    return acc;
  }, { lowStock: 0, mediumStock: 0, goodStock: 0 });

  const stockStatusData = [
    { name: 'Low Stock', value: stockStatus.lowStock, color: '#ef4444' },
    { name: 'Medium Stock', value: stockStatus.mediumStock, color: '#f59e0b' },
    { name: 'Good Stock', value: stockStatus.goodStock, color: '#10b981' },
  ];

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--primary-light))",
    },
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Business insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlySales}>
                  <XAxis 
                    dataKey="month" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="var(--color-sales)" 
                    fill="var(--color-sales)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stock Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryAnalysis.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{category.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.products} products, {category.quantity} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${category.value.toLocaleString()}</p>
                    <Badge variant="secondary">
                      {totalValue > 0 ? ((category.value / totalValue) * 100).toFixed(1) : 0}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} × ${product.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${product.totalValue.toLocaleString()}</p>
                    <Badge 
                      variant={product.quantity <= product.minStock ? 'destructive' : 'default'}
                    >
                      {product.quantity <= product.minStock ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlySales}>
                <XAxis 
                  dataKey="month" 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}