// src/pages/Orders.tsx
import { useState, useEffect } from 'react';
import { Order, Customer, Product } from '@/types/order'; // Assume types exported from shared types file
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useFieldArray } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface OrderFormData {
  type: 'purchase' | 'sales';
  customerId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  products: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}

export default function Orders() {
  // Local state for orders data
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch orders, customers, and products on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          api.get('api/orders/', { headers: { Authorization: `Bearer ${token}` },}),  // Backend endpoint
          api.get('api/customers/', { headers: { Authorization: `Bearer ${token}` },}),
          api.get('api/products/', { headers: { Authorization: `Bearer ${token}` },}),
        ]);

        // Map orders response to frontend type
        const mappedOrders: Order[] = ordersRes.data.results?.map((o: any) => ({
          id: o.id.toString(),
          type: o.type,
          customerId: o.customer.toString(),
          products: o.items?.map((i: any) => ({
            productId: i.product.toString(),
            quantity: i.quantity,
            price: parseFloat(i.price),
          })) || [],
          status: o.status,
          total: parseFloat(o.total),
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        })) || [];

        // Map customers
        const mappedCustomers: Customer[] = customersRes.data.results?.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          company: c.company,
          type: c.type,
        })) || [];

        // Map products (minimal for form)
        const mappedProducts: Product[] = productsRes.data.results?.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          sku: p.sku,
          price: parseFloat(p.price),
        })) || [];

        setOrders(mappedOrders);
        setCustomers(mappedCustomers);
        setProducts(mappedProducts);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch orders data');
        toast({
          title: 'Error',
          description: 'Failed to load orders data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<OrderFormData>({
    defaultValues: {
      type: 'sales',
      customerId: '',
      status: 'pending',
      products: [{ productId: '', quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  // Derived filters
  const filteredOrders = orders.filter(order => {
    const customer = customers.find(c => c.id === order.customerId);
    const customerName = customer?.name || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders
    .filter(o => o.type === 'sales' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const filteredCustomers = customers.filter(c => 
    form.watch('type') === 'sales' ? c.type === 'customer' : c.type === 'vendor'
  );

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`products.${index}.price`, product.price);
    }
  };

  // Local CRUD functions (handle API + local state updates)
  const addOrder = async (data: OrderFormData) => {
    try {
      setFormLoading(true);
      const items = data.products.map(p => ({
        product: p.productId,
        quantity: p.quantity,
        price: p.price.toString(),
      }));
      const total = data.products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const res = await api.post('api/orders/', { 
        type: data.type,
        customer: data.customerId,
        status: data.status,
        items,
        total: total.toString(),
      }, { headers: { Authorization: `Bearer ${token}` },});
      const newOrder: Order = {
        id: res.data.id.toString(),
        type: res.data.type,
        customerId: res.data.customer.toString(),
        products: res.data.items?.map((i: any) => ({
          productId: i.product.toString(),
          quantity: i.quantity,
          price: parseFloat(i.price),
        })) || [],
        status: res.data.status,
        total: parseFloat(res.data.total),
        createdAt: res.data.created_at,
        updatedAt: res.data.updated_at,
      };
      setOrders(prev => [...prev, newOrder]);  // Optimistic local update
      toast({ title: 'Success', description: 'Order added successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to add order.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const updateOrder = async (updatedOrder: Order) => {
    try {
      setFormLoading(true);
      const items = updatedOrder.products.map(p => ({
        product: p.productId,
        quantity: p.quantity,
        price: p.price.toString(),
      }));
      const res = await api.patch(`api/orders/${updatedOrder.id}/`, { 
        type: updatedOrder.type,
        customer: updatedOrder.customerId,
        status: updatedOrder.status,
        items,
        total: updatedOrder.total.toString(),
      }, { headers: { Authorization: `Bearer ${token}` },});
      const mappedOrder: Order = {
        ...updatedOrder,
        ...{
          products: res.data.items?.map((i: any) => ({
            productId: i.product.toString(),
            quantity: i.quantity,
            price: parseFloat(i.price),
          })) || updatedOrder.products,
          total: parseFloat(res.data.total),
          updatedAt: res.data.updated_at,
        },
      };
      setOrders(prev => prev.map(o => o.id === mappedOrder.id ? mappedOrder : o));  // Local update
      toast({ title: 'Success', description: 'Order updated successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to update order.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`api/orders/${id}/`, { headers: { Authorization: `Bearer ${token}` },});
      setOrders(prev => prev.filter(o => o.id !== id));  // Local removal
      toast({ title: 'Success', description: 'Order deleted successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to delete order.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: OrderFormData) => {
    if (data.products.some(p => !p.productId || p.quantity <= 0 || p.price <= 0)) {
      toast({ title: 'Error', description: 'Please fill all product details.', variant: 'destructive' });
      return;
    }
    if (data.customerId === '') {
      toast({ title: 'Error', description: 'Please select a customer/vendor.', variant: 'destructive' });
      return;
    }
    if (data.products.length === 0) {
      toast({ title: 'Error', description: 'Add at least one product.', variant: 'destructive' });
      return;
    }

    if (orders.length > 0) {  // Skip update if no existing orders for simplicity; implement if needed
      await addOrder(data);
    } else {
      await addOrder(data);
    }
    setIsDialogOpen(false);
    form.reset();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage purchase and sales orders</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={formLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sales">Sales Order</SelectItem>
                            <SelectItem value="purchase">Purchase Order</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer/Vendor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer/vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredCustomers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} ({customer.company})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Products</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ productId: '', quantity: 1, price: 0 })}
                      disabled={formLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-3 gap-4 items-end p-3 border rounded-md bg-muted/50">
                        <FormField
                          control={form.control}
                          name={`products.${index}.productId`}
                          render={({ field: productField }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <Select onValueChange={(value) => {
                                productField.onChange(value);
                                handleProductSelect(index, value);
                              }} value={productField.value} disabled={formLoading}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} ({product.sku})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`products.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="1"
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                  disabled={formLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`products.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    disabled={formLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={formLoading || fields.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create Order
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From completed sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.type === 'purchase').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active purchase orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search orders by customer or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                disabled={loading}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sales">Sales Orders</SelectItem>
                <SelectItem value="purchase">Purchase Orders</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer/Vendor</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.id}</TableCell>
                  <TableCell>
                    <Badge variant={order.type === 'sales' ? 'default' : 'secondary'}>
                      {order.type === 'sales' ? (
                        <>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Sales
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Purchase
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getCustomerName(order.customerId)}</div>
                      <div className="text-sm text-muted-foreground">
                        {customers.find(c => c.id === order.customerId)?.company}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.products.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm">
                          {getProductName(item.productId)} × {item.quantity}
                        </div>
                      ))}
                      {order.products.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{order.products.length - 2} more
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" disabled={loading}>
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteOrder(order.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your search criteria.' 
                  : 'Get started by creating your first order.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}