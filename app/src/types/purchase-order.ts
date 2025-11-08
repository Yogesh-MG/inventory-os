// src/types/purchase-order.ts (New shared types file for PurchaseOrders - create this for modularity)
export interface PurchaseOrder {
  id: string;
  vendor: string;
  vendorName: string;
  date: string;
  status: 'pending' | 'approved' | 'received';
  total: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Export Customer minimal interface for PurchaseOrders
export interface Customer {
  id: string;
  name: string;
  company: string;
  type: 'customer' | 'vendor';
}