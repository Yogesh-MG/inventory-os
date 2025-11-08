// src/types/order.ts (New shared types file for Orders - create this for modularity)
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

export interface Customer {
  id: string;
  name: string;
  company: string;
  type: 'customer' | 'vendor';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}