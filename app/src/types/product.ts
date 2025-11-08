// src/types/product.ts (New shared types file for Products - create this for modularity)
export interface Product {
  id: string;
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

// Minimal Category interface for Products
export interface Category {
  id: string;
  name: string;
}