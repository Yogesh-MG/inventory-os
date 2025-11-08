// src/pages/Contacts.tsx
import { useState, useEffect } from 'react';
import { Customer } from '@/types/customer'; // Assume types exported from shared types file
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Loader2, 
} from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  type: 'customer' | 'vendor';
}

export default function Contacts() {
  // Local state for contacts data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch customers on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('api/customers/', { headers: { Authorization: `Bearer ${token}` },});  // Backend endpoint

        // Map customers response to frontend type
        const mappedCustomers: Customer[] = res.data.results?.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          email: c.email,
          phone: c.phone,
          company: c.company,
          address: c.address,
          type: c.type,
        })) || [];

        setCustomers(mappedCustomers);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch customers data');
        toast({
          title: 'Error',
          description: 'Failed to load customers data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<ContactFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      type: 'customer',
    },
  });

  const filteredContacts = customers.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm);
    
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Local CRUD functions (handle API + local state updates)
  const addCustomer = async (data: ContactFormData) => {
    try {
      setFormLoading(true);
      const res = await api.post('api/customers/', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        address: data.address,
        type: data.type,
      }, { headers: { Authorization: `Bearer ${token}` },});
      const newCustomer: Customer = {
        id: res.data.id.toString(),
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        company: res.data.company,
        address: res.data.address,
        type: res.data.type,
      };
      setCustomers(prev => [...prev, newCustomer]);  // Optimistic local update
      toast({ title: 'Success', description: 'Customer added successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to add customer.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    try {
      setFormLoading(true);
      const res = await api.patch(`api/customers/${updatedCustomer.id}/`, {
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        company: updatedCustomer.company,
        address: updatedCustomer.address,
        type: updatedCustomer.type,
      }, { headers: { Authorization: `Bearer ${token}` },});
      const mappedCustomer: Customer = {
        ...updatedCustomer,
        ...{
          email: res.data.email,
          phone: res.data.phone,
          company: res.data.company,
          address: res.data.address,
          type: res.data.type,
        },
      };
      setCustomers(prev => prev.map(c => c.id === mappedCustomer.id ? mappedCustomer : c));  // Local update
      toast({ title: 'Success', description: 'Customer updated successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to update customer.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`api/customers/${id}/`, { headers: { Authorization: `Bearer ${token}` },});
      setCustomers(prev => prev.filter(c => c.id !== id));  // Local removal
      toast({ title: 'Success', description: 'Customer deleted successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to delete customer.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getContactOrderCount = (customerId: string) => {
    // For demo, simulate order count; in real, fetch or compute from orders state/API
    return Math.floor(Math.random() * 10);
  };

  const getContactOrderValue = (customerId: string) => {
    // Simulate total value
    return Math.floor(Math.random() * 10000);
  };

  const handleSubmit = async (data: ContactFormData) => {
    if (editingContact) {
      await updateCustomer({ ...editingContact, ...data });
    } else {
      await addCustomer(data);
    }
    setIsDialogOpen(false);
    setEditingContact(null);
    form.reset();
  };

  const handleEdit = (contact: Customer) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      address: contact.address,
      type: contact.type,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    await deleteCustomer(contactId);
  };

  const totalContacts = customers.length;
  const customerCount = customers.filter(c => c.type === 'customer').length;
  const vendorCount = customers.filter(c => c.type === 'vendor').length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers & Vendors</h1>
          <p className="text-muted-foreground">
            Manage your business contacts and relationships
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingContact(null);
              form.reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={formLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} disabled={formLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter full address"
                          className="resize-none"
                          {...field}
                          disabled={formLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    {editingContact ? 'Update Contact' : 'Add Contact'}
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
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              All customers and vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">
              Active customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorCount}</div>
            <p className="text-xs text-muted-foreground">
              Business partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search contacts by name, email, company, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                disabled={loading}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Contact Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="vendor">Vendors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => {
                    const orderCount = getContactOrderCount(contact.id);
                    const orderValue = getContactOrderValue(contact.id);
                    
                    return (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {contact.address.split(',')[0]}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contact.type === 'customer' ? 'default' : 'secondary'}>
                            {contact.type === 'customer' ? 'Customer' : 'Vendor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{contact.company}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-center">
                              <Mail className="w-3 h-3 mr-2 text-muted-foreground" />
                              {contact.email}
                            </div>
                            <div className="text-sm flex items-center">
                              <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                              {contact.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{orderCount}</div>
                          <div className="text-sm text-muted-foreground">orders</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${orderValue.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">total</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(contact)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={loading}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{contact.name}"? 
                                    This action cannot be undone and will affect related orders.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(contact.id)}
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
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredContacts.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No contacts found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' 
                      ? 'Try adjusting your search criteria.' 
                      : 'Get started by adding your first contact.'}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}