// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS ENTITY TYPES — Faz 2 İş Modülleri
// ─────────────────────────────────────────────────────────────────────────────

// ── SALES MODULE ──────────────────────────────────────────────────────────────

export type CustomerType = 'individual' | 'corporate';
export type CustomerStatus = 'active' | 'passive' | 'blocked';

export interface Customer {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  address: Record<string, unknown> | null;
  contactPerson: string | null;
  type: CustomerType;
  status: CustomerStatus;
  creditLimit: number;
  balance: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderType = 'sale' | 'purchase';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  totalPrice: number;
  product?: { id: string; code: string; name: string; unit: string };
}

export interface Order {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  type: OrderType;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  currency: string;
  notes: string | null;
  dueDate: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; code: string; name: string };
  items?: OrderItem[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceType = 'sale' | 'purchase' | 'refund';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  totalPrice: number;
  product?: { id: string; code: string; name: string; unit: string } | null;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  orderId: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; code: string; name: string };
  items?: InvoiceItem[];
}

// ── INVENTORY MODULE ──────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
  parent?: { id: string; name: string } | null;
  children?: ProductCategory[];
}

export interface Product {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  vatRate: number;
  minStock: number;
  currentStock: number;
  imageUrl: string | null;
  barcode: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory | null;
}

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer';

export interface StockMovement {
  id: string;
  organizationId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number | null;
  reference: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  product?: { id: string; code: string; name: string; unit: string };
}

// ── FINANCE MODULE ────────────────────────────────────────────────────────────

export type FinancialAccountType = 'bank' | 'cash' | 'credit';

export interface FinancialAccount {
  id: string;
  organizationId: string;
  name: string;
  type: FinancialAccountType;
  currency: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  organizationId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  reference: string | null;
  date: string;
  createdAt: string;
  account?: { id: string; name: string; type: FinancialAccountType; currency: string };
}

// ── HR MODULE ─────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'active' | 'inactive' | 'terminated';
export type SalaryType = 'monthly' | 'hourly';

export interface Employee {
  id: string;
  organizationId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  departmentId: string | null;
  position: string | null;
  startDate: string;
  endDate: string | null;
  salary: number;
  salaryType: SalaryType;
  status: EmployeeStatus;
  emergencyContact: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  approvedById: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
  };
}

// ── ACCOUNTING MODULE ─────────────────────────────────────────────────────────

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  isActive: boolean;
  children?: ChartOfAccount[];
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  account?: { code: string; name: string };
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  isPosted: boolean;
  createdAt: string;
  lines: JournalLine[];
}

export interface TrialBalanceLine {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

// ── PERFORMANCE MODULE ────────────────────────────────────────────────────────

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string;
  score?: number;
  ratings: Record<string, number>;
  strengths?: string;
  improvements?: string;
  goals: unknown[];
  status: 'draft' | 'submitted' | 'approved';
  createdAt: string;
  updatedAt: string;
}

// ── PURCHASING MODULE ─────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  paymentTerms: number;
  currency: string;
  balance: number;
  status: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  totalAmount: number;
  expectedDate?: string;
}

// ── TASKS MODULE ──────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  assignedToId?: string;
  dueDate?: string;
}

// ── PAGINATION HELPERS ────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
