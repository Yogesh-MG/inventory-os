// src/types/customer.ts (New shared types file for Contacts - create this for modularity)
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  type: 'customer' | 'vendor';
}