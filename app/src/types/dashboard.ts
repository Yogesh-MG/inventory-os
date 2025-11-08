// src/types/dashboard.ts (New shared types file for Dashboard - create this for modularity)
export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  minStock: number;
  category: string;
}

export interface Order {
  id: string;
  type: 'purchase' | 'sales';
  customerId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
}