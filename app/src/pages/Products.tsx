// src/pages/Products.tsx
import { useState, useEffect } from 'react';
import { Product, Category } from '@/types/product'; // Assume types exported from shared types file
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Package,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  price: number;
  category: string;
  minStock: number;
  description: string;
}

export default function Products() {
  // Local state for products data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('api/products/', {
            headers: { Authorization: `Bearer ${token}` },
          }),  // Backend endpoint
          api.get('api/categories/', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Map products response to frontend type
        const mappedProducts: Product[] = productsRes.data.results?.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || '',
          quantity: parseInt(p.quantity),
          price: parseFloat(p.price),
          category: p.category_name || p.category || '',
          minStock: parseInt(p.min_stock),
          description: p.description || '',
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })) || [];

        // Map categories (minimal)
        const mappedCategories: Category[] = categoriesRes.data.results?.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
        })) || [];

        setProducts(mappedProducts);
        setCategories(mappedCategories);
      } catch (err: any) {
        console.error('API Response:', err);
        setError('Failed to fetch products data');
        toast({
          title: 'Error',
          description: 'Failed to load products data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      quantity: 0,
      price: 0,
      category: '',
      minStock: 0,
      description: '',
    },
  });

  // Derived data
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  const getStockStatus = (product: Product) => {
    if (product.quantity <= product.minStock) {
      return { status: 'Low Stock', variant: 'destructive' as const };
    } else if (product.quantity <= product.minStock * 2) {
      return { status: 'Medium Stock', variant: 'secondary' as const };
    }
    return { status: 'In Stock', variant: 'default' as const };
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

  // Local CRUD functions (handle API + local state updates)
  const addProduct = async (data: ProductFormData) => {
    try {
      setFormLoading(true);
      const res = await api.post('api/products/', {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category,  // Assume category is name; adjust if ID
        quantity: data.quantity,
        price: data.price.toString(),
        min_stock: data.minStock,
        description: data.description,
      }, { headers: { Authorization: `Bearer ${token}` },});
      const newProduct: Product = {
        id: res.data.id.toString(),
        name: res.data.name,
        sku: res.data.sku,
        barcode: res.data.barcode || '',
        quantity: parseInt(res.data.quantity),
        price: parseFloat(res.data.price),
        category: res.data.category_name || res.data.category || '',
        minStock: parseInt(res.data.min_stock),
        description: res.data.description || '',
        createdAt: res.data.created_at,
        updatedAt: res.data.updated_at,
      };
      setProducts(prev => [...prev, newProduct]);  // Optimistic local update
      toast({ title: 'Success', description: 'Product added successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to add product.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      setFormLoading(true);
      const res = await api.patch(`api/products/${updatedProduct.id}/`, {
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        barcode: updatedProduct.barcode,
        category: updatedProduct.category,
        quantity: updatedProduct.quantity,
        price: updatedProduct.price.toString(),
        min_stock: updatedProduct.minStock,
        description: updatedProduct.description,
      }, { headers: { Authorization: `Bearer ${token}` },});
      const mappedProduct: Product = {
        ...updatedProduct,
        ...{
          category: res.data.category_name || updatedProduct.category,
          quantity: parseInt(res.data.quantity),
          price: parseFloat(res.data.price),
          minStock: parseInt(res.data.min_stock),
          description: res.data.description || '',
          updatedAt: res.data.updated_at,
        },
      };
      setProducts(prev => prev.map(p => p.id === mappedProduct.id ? mappedProduct : p));  // Local update
      toast({ title: 'Success', description: 'Product updated successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to update product.', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`api/products/${id}/`, { headers: { Authorization: `Bearer ${token}` },});
      setProducts(prev => prev.filter(p => p.id !== id));  // Local removal
      toast({ title: 'Success', description: 'Product deleted successfully.' });
    } catch (err: any) {
      console.error('API Response:', err);
      toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProduct({ ...editingProduct, ...data });
    } else {
      addProduct(data);
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      quantity: product.quantity,
      price: product.price,
      category: product.category,
      minStock: product.minStock,
      description: product.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    deleteProduct(productId);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProduct(null);
              form.reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter SKU" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter barcode" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category" {...field} disabled={formLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="price"
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
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock</FormLabel>
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description"
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
                    {editingProduct ? 'Update Product' : 'Add Product'}
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
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search products by name, SKU, category, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              disabled={loading}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          Min: {product.minStock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant}>
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
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
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first product.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}