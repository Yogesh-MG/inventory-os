import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  price: number;
  category: string;
  minStock: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  type: 'customer' | 'vendor';
}

export interface Order {
  id: string;
  type: 'purchase' | 'sales';
  customerId: string;
  products: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface InventoryState {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  loading: boolean;
  error: string | null;
}

// Actions
type InventoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'UPDATE_PRODUCT_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'DELETE_ORDER'; payload: string };

// Initial state with mock data
const initialState: InventoryState = {
  products: [
    {
      id: '1',
      name: 'MacBook Pro 16"',
      sku: 'MBP-16-001',
      barcode: '1234567890123',
      quantity: 25,
      price: 2499.99,
      category: 'Electronics',
      minStock: 5,
      description: 'High-performance laptop for professionals',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      sku: 'IPH-15-PRO',
      barcode: '2345678901234',
      quantity: 12,
      price: 999.99,
      category: 'Electronics',
      minStock: 10,
      description: 'Latest iPhone with Pro features',
      createdAt: '2024-01-16T09:30:00Z',
      updatedAt: '2024-01-16T09:30:00Z',
    },
    {
      id: '3',
      name: 'Office Chair Pro',
      sku: 'OCH-PRO-001',
      barcode: '3456789012345',
      quantity: 8,
      price: 299.99,
      category: 'Furniture',
      minStock: 15,
      description: 'Ergonomic office chair with lumbar support',
      createdAt: '2024-01-17T14:20:00Z',
      updatedAt: '2024-01-17T14:20:00Z',
    },
    {
      id: '4',
      name: 'Wireless Mouse',
      sku: 'WM-001',
      barcode: '4567890123456',
      quantity: 50,
      price: 49.99,
      category: 'Electronics',
      minStock: 20,
      description: 'Ergonomic wireless mouse with precision tracking',
      createdAt: '2024-01-18T11:15:00Z',
      updatedAt: '2024-01-18T11:15:00Z',
    },
  ],
  customers: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 555-0123',
      company: 'Tech Solutions Inc.',
      address: '123 Business St, New York, NY 10001',
      type: 'customer',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@designstudio.com',
      phone: '+1 555-0124',
      company: 'Creative Design Studio',
      address: '456 Design Ave, Los Angeles, CA 90210',
      type: 'customer',
    },
    {
      id: '3',
      name: 'Apple Inc.',
      email: 'vendor@apple.com',
      phone: '+1 800-275-2273',
      company: 'Apple Inc.',
      address: 'One Apple Park Way, Cupertino, CA 95014',
      type: 'vendor',
    },
  ],
  orders: [
    {
      id: '1',
      type: 'sales',
      customerId: '1',
      products: [
        { productId: '1', quantity: 2, price: 2499.99 },
        { productId: '4', quantity: 5, price: 49.99 },
      ],
      status: 'confirmed',
      total: 5249.93,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: '2',
      type: 'purchase',
      customerId: '3',
      products: [
        { productId: '2', quantity: 10, price: 899.99 },
      ],
      status: 'pending',
      total: 8999.90,
      createdAt: '2024-01-21T14:30:00Z',
      updatedAt: '2024-01-21T14:30:00Z',
    },
  ],
  loading: false,
  error: null,
};

// Reducer
function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'UPDATE_PRODUCT_QUANTITY':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId
            ? { ...p, quantity: action.payload.quantity, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(o => o.id !== action.payload),
      };
    default:
      return state;
  }
}

// Context
interface InventoryContextType {
  state: InventoryState;
  dispatch: React.Dispatch<InventoryAction>;
  // Helper functions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (order: Order) => void;
  deleteOrder: (id: string) => void;
  getLowStockProducts: () => Product[];
  getTotalValue: () => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Provider
export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const product: Product = {
      ...productData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const updateProduct = (product: Product) => {
    const updatedProduct = { ...product, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
  };

  const deleteProduct = (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_PRODUCT_QUANTITY', payload: { productId, quantity } });
  };

  const getProductByBarcode = (barcode: string) => {
    return state.products.find(p => p.barcode === barcode);
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    const customer: Customer = {
      ...customerData,
      id: Math.random().toString(36).substr(2, 9),
    };
    dispatch({ type: 'ADD_CUSTOMER', payload: customer });
  };

  const updateCustomer = (customer: Customer) => {
    dispatch({ type: 'UPDATE_CUSTOMER', payload: customer });
  };

  const deleteCustomer = (id: string) => {
    dispatch({ type: 'DELETE_CUSTOMER', payload: id });
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const order: Order = {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ORDER', payload: order });
  };

  const updateOrder = (order: Order) => {
    const updatedOrder = { ...order, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
  };

  const deleteOrder = (id: string) => {
    dispatch({ type: 'DELETE_ORDER', payload: id });
  };

  const getLowStockProducts = () => {
    return state.products.filter(p => p.quantity <= p.minStock);
  };

  const getTotalValue = () => {
    return state.products.reduce((total, product) => total + (product.quantity * product.price), 0);
  };

  const value: InventoryContextType = {
    state,
    dispatch,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductQuantity,
    getProductByBarcode,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addOrder,
    updateOrder,
    deleteOrder,
    getLowStockProducts,
    getTotalValue,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

// Hook
export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}