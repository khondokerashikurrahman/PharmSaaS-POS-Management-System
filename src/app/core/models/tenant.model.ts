export type TenantPlan =
  | 'Basic'
  | 'Standard'
  | 'Premium';

export type TenantStatus =
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Approved'
  | 'Rejected'
  | 'Archived';

export interface Tenant {
  id: string;

  // Pharmacy / Organization information
  name: string;
  owner: string;

  email: string;
  phone: string;
  address: string;

  // SaaS subscription
  plan: string | null;

  status: TenantStatus;

  registrationDate: string;

  subscriptionStart?: string;
  subscriptionEnd?: string;

  // Organization summary
  branches: number;
  employees: number;

  monthlyBilling: number | null;
  tenantCode?: string;

  createdAt?: string;
  updatedAt?: string;
}