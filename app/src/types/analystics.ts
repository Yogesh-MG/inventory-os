// src/types/analytics.ts (New shared types file for Analytics - create this for modularity)
export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  minStock: number;
  category: string;
}

export interface Order {
  id: string;
  type: 'purchase' | 'sales';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
}

export interface Customer {
  id: string;
  name: string;
}