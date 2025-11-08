// src/pages/Bills.tsx
import { useState, useEffect } from 'react';
import { Bill } from '@/types/bills'; // Assume types exported from a shared types file
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
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { 
  Plus, 
  Download, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from '@/components/ui/badge';

interface BillFormData {
  vendor: string;
  billNumber: string;
  date: string;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  amount: number;
}

// Local types (or import from shared if needed)
interface Customer {
  id: string;
  name: string;
  company: string;
  type: 'customer' | 'vendor';
}

export default function Bills() {
  // Local state for bills data
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const [tabValue, setTabValue] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch bills and customers on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [billsRes, customersRes] = await Promise.all([
          api.get('api/bills/', { headers: { Authorization: `Bearer ${token}` },}),  // Backend endpoint
          api.get('api/customers/', { headers: { Authorization: `Bearer ${token}` },}),
        ]);

        // Map bills response to frontend type
        const bills: Bill[] = billsRes.data.results?.map((b: any) => ({
          id: b.id.toString(),
          vendor: b.vendor.toString(),
          vendorName: b.vendor_name,
          billNumber: b.bill_number,
          date: b.date,
          dueDate: b.due_date,
          status: b.status as 'unpaid' | 'paid' | 'overdue',
          amount: parseFloat(b.amount),
          isOverdue: b.is_overdue,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        })) || [];

        // Map customers (minimal for vendors)
        const mappedCustomers: Customer[] = customersRes.data.results?.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          company: c.company,
          type: c.type,
        })) || [];

        setAllBills(bills);
        setCustomers(mappedCustomers);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch bills data');
        toast({
          title: 'Error',
          description: 'Failed to load bills data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const vendors = customers.filter(c => c.type === 'vendor');

  const form = useForm<BillFormData>({
    defaultValues: {
      vendor: '',
      billNumber: '',
      date: '',
      dueDate: '',
      status: 'unpaid',
      amount: 0,
    },
  });

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const unpaidBills = allBills.filter(b => b.status === 'unpaid');
  const dueThisMonthBills = unpaidBills.filter(b => 
    isWithinInterval(parseISO(b.dueDate), { start: currentMonthStart, end: currentMonthEnd })
  );
  const overdueBills = allBills.filter(b => b.status === 'overdue');

  const totalOutstanding = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const dueThisMonth = dueThisMonthBills.reduce((sum, b) => sum + b.amount, 0);
  const overdueAmount = overdueBills.reduce((sum, b) => sum + b.amount, 0);

  const getBillsForTab = () => {
    switch (tabValue) {
      case 'unpaid': return unpaidBills;
      case 'paid': return allBills.filter(b => b.status === 'paid');
      case 'overdue': return overdueBills;
      default: return allBills;
    }
  };

  const currentBills = getBillsForTab();

  // Local CRUD functions (handle API + local state updates)
  const addBill = async (data: BillFormData) => {
    try {
      setFormLoading(true);
      const res = await api.post('api/bills/', {
        vendor: data.vendor,
        bill_number: data.billNumber,
        date: data.date,
        due_date: data.dueDate,
        status: data.status,
        amount: data.amount.toString(),  // Backend expects string/Decimal
      }, { headers: { Authorization: `Bearer ${token}` },});
      const newBill: Bill = {
        id: res.data.id.toString(),
        vendor: res.data.vendor.toString(),
        vendorName: res.data.vendor_name,
        billNumber: res.data.bill_number,
        date: res.data.date,
        dueDate: res.data.due_date,
        status: res.data.status,
        amount: parseFloat(res.data.amount),
        isOverdue: res.data.is_overdue,
        createdAt: res.data.created_at,
        updatedAt: res.data.updated_at,
      };
      setAllBills(prev => [...prev, newBill]);  // Optimistic local update
      toast({ title: 'Success', description: 'Bill added successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to add bill.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const updateBill = async (updatedBill: Bill) => {
    try {
      setFormLoading(true);
      const res = await api.patch(`api/bills/${updatedBill.id}/`, {
        vendor: updatedBill.vendor,
        bill_number: updatedBill.billNumber,
        date: updatedBill.date,
        due_date: updatedBill.dueDate,
        status: updatedBill.status,
        amount: updatedBill.amount.toString(),
      }, { headers: { Authorization: `Bearer ${token}` },});
      const mappedBill: Bill = {
        ...updatedBill,
        ...{
          vendorName: res.data.vendor_name,
          amount: parseFloat(res.data.amount),
          isOverdue: res.data.is_overdue,
          updatedAt: res.data.updated_at,
        },
      };
      setAllBills(prev => prev.map(b => b.id === mappedBill.id ? mappedBill : b));  // Local update
      toast({ title: 'Success', description: 'Bill updated successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to update bill.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const deleteBill = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`api/bills/${id}/`, { headers: { Authorization: `Bearer ${token}` },});
      setAllBills(prev => prev.filter(b => b.id !== id));  // Local removal
      toast({ title: 'Success', description: 'Bill deleted successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to delete bill.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: BillFormData) => {
    if (editingBill) {
      await updateBill({ ...editingBill, ...data });
    } else {
      await addBill(data);
    }
    setIsDialogOpen(false);
    setEditingBill(null);
    form.reset();
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    form.reset({
      vendor: bill.vendor,
      billNumber: bill.billNumber,
      date: bill.date,
      dueDate: bill.dueDate,
      status: bill.status,
      amount: bill.amount,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (billId: string) => {
    await deleteBill(billId);
  };

  const handleExport = () => {
    console.log('Exporting bills...');
    toast({ title: 'Exported', description: 'Bills exported successfully.' });
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bills</h1>
          <p className="text-muted-foreground">Track and manage vendor bills and payments</p>
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
              <Button size="sm" onClick={() => { setEditingBill(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingBill ? 'Edit Bill' : 'Add New Bill'}</DialogTitle>
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
                    name="billNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bill number" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
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
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={formLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
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
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={formLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {editingBill ? 'Update Bill' : 'Add Bill'}
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
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{unpaidBills.length} unpaid bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dueThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{dueThisMonthBills.length} bills due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{overdueBills.length} overdue bills</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Bills</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bills Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>{bill.vendorName}</TableCell>
                      <TableCell>{format(parseISO(bill.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(parseISO(bill.dueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          bill.status === 'unpaid' ? 'secondary' :
                          bill.status === 'paid' ? 'default' :
                          'destructive'
                        }>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">${bill.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" disabled={loading}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(bill)}
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
                                <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete bill "{bill.billNumber}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(bill.id)}
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
              {currentBills.length === 0 && (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No bills found</h3>
                  <p className="text-muted-foreground">Get started by adding your first bill.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unpaid Bills</CardTitle>
            </CardHeader>
            <CardContent>
              {unpaidBills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>{bill.vendorName}</TableCell>
                        <TableCell>{format(parseISO(bill.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(bill.dueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">${bill.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)} disabled={loading}>
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
                                  <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete bill "{bill.billNumber}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(bill.id)}
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
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No unpaid bills</h3>
                  <p className="text-muted-foreground">All bills are up to date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paid Bills</CardTitle>
            </CardHeader>
            <CardContent>
              {allBills.filter(b => b.status === 'paid').length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBills.filter(b => b.status === 'paid').map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>{bill.vendorName}</TableCell>
                        <TableCell>{format(parseISO(bill.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(bill.dueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">${bill.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)} disabled={loading}>
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
                                  <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete bill "{bill.billNumber}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(bill.id)}
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
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No paid bills</h3>
                  <p className="text-muted-foreground">No payments recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Bills</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueBills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>{bill.vendorName}</TableCell>
                        <TableCell>{format(parseISO(bill.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(bill.dueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">${bill.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={loading}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)} disabled={loading}>
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
                                  <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete bill "{bill.billNumber}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(bill.id)}
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
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No overdue bills</h3>
                  <p className="text-muted-foreground">All bills are current.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}