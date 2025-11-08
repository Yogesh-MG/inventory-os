// src/types/reports.ts (New shared types file for Reports - create this for modularity)
export interface Order {
  id: string;
  type: 'purchase' | 'sales';
  customerName: string;
  total: number;
  status: string;
}

export interface PurchaseOrder {
  id: string;
  vendorName: string;
  total: number;
  itemsCount: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}