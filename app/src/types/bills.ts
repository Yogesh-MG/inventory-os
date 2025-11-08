// src/types/bill.ts (New shared types file for Bills - create this for modularity)
export interface Bill {
  id: string;
  vendor: string;
  vendorName: string;
  billNumber: string;
  date: string;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  amount: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

// Export Customer minimal interface for Bills
export interface Customer {
  id: string;
  name: string;
  company: string;
  type: 'customer' | 'vendor';
}