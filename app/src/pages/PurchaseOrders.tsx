// src/pages/PurchaseOrders.tsx
import { useState, useEffect } from 'react';
import { PurchaseOrder, Customer } from '@/types/purchase-order';
import api from '@/utils/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { 
  Plus, 
  Download, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Loader2,
  DollarSign,
  Package,
  ShoppingCart
} from "lucide-react";
import { Badge } from '@/components/ui/badge';

interface PurchaseOrderFormData {
  vendor: string;
  date: string;
  status: 'pending' | 'approved' | 'received';
  total: number;
  itemsCount: number;
}

export default function PurchaseOrders() {
  // Local state for purchase orders data
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [tabValue, setTabValue] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch purchase orders and customers on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [posRes, customersRes] = await Promise.all([
          api.get('api/purchase-orders/'),  // Fixed: Added 'api/' prefix
          api.get('api/customers/'),  // Fixed: Added 'api/' prefix
        ]);

        // Handle paginated response safely
        const posData = posRes.data.results || posRes.data || [];
        const customerData = customersRes.data.results || customersRes.data || [];

        // Map POs response to frontend type
        const pos: PurchaseOrder[] = Array.isArray(posData) ? posData.map((po: any) => ({
          id: po.id.toString(),
          vendor: po.vendor.toString(),
          vendorName: po.vendor_name,
          date: po.date,
          status: po.status as 'pending' | 'approved' | 'received',
          total: parseFloat(po.total),
          itemsCount: po.items_count,
          createdAt: po.created_at,
          updatedAt: po.updated_at,
        })) : [];

        // Map customers (minimal for vendors)
        const mappedCustomers: Customer[] = Array.isArray(customerData) ? customerData.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          company: c.company,
          type: c.type,
        })) : [];

        setAllPOs(pos);
        setCustomers(mappedCustomers);
      } catch (err: any) {
        console.error('API Response:', err);
        if (err.response?.status === 401) {
          toast({
            title: 'Auth Error',
            description: 'Please log in to access this data.',
            variant: 'destructive',
          });
        } else {
          setError('Failed to fetch purchase orders data');
          toast({
            title: 'Error',
            description: 'Failed to load purchase orders data.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const vendors = customers.filter(c => c.type === 'vendor');

  const form = useForm<PurchaseOrderFormData>({
    defaultValues: {
      vendor: '',
      date: '',
      status: 'pending',
      total: 0,
      itemsCount: 0,
    },
  });

  // Derived filters
  const pendingPOs = allPOs.filter(po => po.status === 'pending');
  const approvedPOs = allPOs.filter(po => po.status === 'approved');
  const receivedPOs = allPOs.filter(po => po.status === 'received');

  const totalPOs = allPOs.length;
  const pendingCount = pendingPOs.length;
  const totalValue = allPOs.reduce((sum, po) => sum + po.total, 0);

  const getPOsForTab = () => {
    switch (tabValue) {
      case 'pending': return pendingPOs;
      case 'approved': return approvedPOs;
      case 'received': return receivedPOs;
      default: return allPOs;
    }
  };

  const currentPOs = getPOsForTab();

  // Local CRUD functions (handle API + local state updates)
  const addPurchaseOrder = async (data: PurchaseOrderFormData) => {
    try {
      setFormLoading(true);
      const res = await api.post('api/purchase-orders/', {  // Fixed: Added 'api/' prefix
        vendor: data.vendor,
        date: data.date,
        status: data.status,
        total: data.total.toString(),
        items_count: data.itemsCount,
      });
      const newPO: PurchaseOrder = {
        id: res.data.id.toString(),
        vendor: res.data.vendor.toString(),
        vendorName: res.data.vendor_name,
        date: res.data.date,
        status: res.data.status,
        total: parseFloat(res.data.total),
        itemsCount: res.data.items_count,
        createdAt: res.data.created_at,
        updatedAt: res.data.updated_at,
      };
      setAllPOs(prev => [...prev, newPO]);
      toast({ title: 'Success', description: 'Purchase order added successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      if (err.response?.status === 401) {
        toast({
          title: 'Auth Error',
          description: 'Session expired. Please log in again.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Error', description: 'Failed to add purchase order.', variant: 'destructive' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const updatePurchaseOrder = async (updatedPO: PurchaseOrder) => {
    try {
      setFormLoading(true);
      const res = await api.patch(`api/purchase-orders/${updatedPO.id}/`, {  // Fixed: Added 'api/' prefix
        vendor: updatedPO.vendor,
        date: updatedPO.date,
        status: updatedPO.status,
        total: updatedPO.total.toString(),
        items_count: updatedPO.itemsCount,
      });
      const mappedPO: PurchaseOrder = {
        ...updatedPO,
        vendorName: res.data.vendor_name,
        total: parseFloat(res.data.total),
        itemsCount: res.data.items_count,
        updatedAt: res.data.updated_at,
      };
      setAllPOs(prev => prev.map(po => po.id === mappedPO.id ? mappedPO : po));
      toast({ title: 'Success', description: 'Purchase order updated successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to update purchase order.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`api/purchase-orders/${id}/`);  // Fixed: Added 'api/' prefix
      setAllPOs(prev => prev.filter(po => po.id !== id));
      toast({ title: 'Success', description: 'Purchase order deleted successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to delete purchase order.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    if (editingPO) {
      await updatePurchaseOrder({ ...editingPO, ...data });
    } else {
      await addPurchaseOrder(data);
    }
    setIsDialogOpen(false);
    setEditingPO(null);
    form.reset();
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    form.reset({
      vendor: po.vendor,
      date: po.date,
      status: po.status,
      total: po.total,
      itemsCount: po.itemsCount,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (poId: string) => {
    await deletePurchaseOrder(poId);
  };

  const handleExport = () => {
    console.log('Exporting purchase orders...');
    toast({ title: 'Exported', description: 'Purchase orders exported successfully.' });
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
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage your purchase orders and vendor relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={loading}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={loading} onClick={() => { setEditingPO(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPO ? 'Edit Purchase Order' : 'Add New Purchase Order'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name} ({vendor.company})
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={formLoading} />
                        </FormControl>
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
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total ($)</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="itemsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Items Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              disabled={formLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={formLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {editingPO ? 'Update Purchase Order' : 'Add Purchase Order'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPOs}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.id}</TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>{format(parseISO(po.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          po.status === 'pending' ? 'secondary' :
                          po.status === 'approved' ? 'default' :
                          'success'
                        }>
                          {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{po.itemsCount}</TableCell>
                      <TableCell className="font-medium">${po.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" disabled={loading}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(po)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={loading}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete PO "{po.id}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(po.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={loading}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {currentPOs.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No purchase orders found</h3>
                  <p className="text-muted-foreground">Get started by creating your first purchase order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPOs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>{format(parseISO(po.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">${po.total.toLocaleString()}</TableCell>
                        <TableCell>{po.itemsCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(po)} disabled={loading}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={loading}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete PO "{po.id}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(po.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={loading}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No pending purchase orders</h3>
                  <p className="text-muted-foreground">All orders are processed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedPOs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>{format(parseISO(po.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">${po.total.toLocaleString()}</TableCell>
                        <TableCell>{po.itemsCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(po)} disabled={loading}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={loading}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete PO "{po.id}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(po.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={loading}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No approved purchase orders</h3>
                  <p className="text-muted-foreground">No orders approved yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Received Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {receivedPOs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>{format(parseISO(po.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">${po.total.toLocaleString()}</TableCell>
                        <TableCell>{po.itemsCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(po)} disabled={loading}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={loading}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete PO "{po.id}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(po.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={loading}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No received purchase orders</h3>
                  <p className="text-muted-foreground">No orders received yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}