export type UserRole = 'superadmin' | 'shop_manager' | 'recorder' | 'auditor';

export type Language = 'en' | 'am' | 'om';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  shopIds: string[]; // Shops user has access to
  districtIds?: string[]; // Specific districts for shop
  status: 'active' | 'suspended';
  preferredLanguage?: Language;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  location?: string;
  isConsolidated?: boolean; // True for Adama Main
  consolidatedShopIds?: string[]; // E.g., ['adama', 'hawassa', 'borena', 'bale', 'assela']
  createdAt: string;
  updatedAt?: string;
}

export interface District {
  id: string;
  shopId: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface BankDeposit {
  id: string;
  depositDate: string;
  amount: number;
  bankName: string;
  refNumber?: string;
  imageUrl?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export type ReconciliationStatus =
  | 'unreconciled'
  | 'partial'
  | 'reconciled'
  | 'over_deposited'
  | 'evidence_pending';

export interface Sale {
  id: string;
  shopId: string;
  shopName?: string;
  districtId?: string;
  districtName?: string;
  productId: string;
  productName?: string;
  monthKey: string; // e.g., "2026-10"
  salesDate: string;
  invoiceNumber: string;
  salesAmount: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  invoiceImages: string[];
  bankDeposits: BankDeposit[];
  totalDeposited: number;
  depositDifference: number; // salesAmount - totalDeposited
  status: ReconciliationStatus;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  correctionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferOut {
  id: string;
  shopId: string;
  shopName?: string;
  districtId?: string;
  districtName?: string;
  productId: string;
  productName?: string;
  monthKey: string;
  amount: number;
  date: string;
  refNumber: string;
  notes?: string;
  attachmentUrls?: string[];
  createdBy: string;
  createdAt: string;
}

export interface ReportingPeriod {
  id: string;
  shopId: string;
  monthKey: string; // "YYYY-MM"
  monthName: string;
  openingBalance: number; // BBF
  status: 'open' | 'closed';
  closedAt?: string;
  closedBy?: string;
  reopenReason?: string;
  createdAt: string;
  bbfAdjustments?: {
    previousBBF: number;
    newBBF: number;
    adjustedBy: string;
    adjustedAt: string;
    reason: string;
  }[];
}

export interface AuditLog {
  id: string;
  shopId?: string;
  shopName?: string;
  action: string;
  entityType: 'sale' | 'transfer_out' | 'user' | 'shop' | 'district' | 'period' | 'product' | 'setting' | 'bbf';
  entityId: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  timestamp: string;
}

export interface AppSetting {
  id: string;
  defaultCommissionRate: number; // e.g., 0.01 (1%)
  calculationBasis: 'transfer_out' | 'total_sales';
  effectiveMonthKey?: string;
  currency: string;
  timezone: string;
  updatedAt: string;
  history?: {
    rate: number;
    basis: 'transfer_out' | 'total_sales';
    effectiveMonthKey: string;
    updatedBy: string;
    updatedAt: string;
    reason?: string;
  }[];
}

export interface FloatReconciliationSummary {
  openingBalance: number; // BBF
  totalTransferOut: number;
  totalSales: number;
  totalDeposited: number;
  closingBalance: number; // SOH = Opening + Transfer Out - Total Sales
  commissionRate: number; // default 0.01
  commissionAmount: number; // Up Front = CommissionRate * (TransferOut or Sales)
  difference: number; // Closing Balance - CommissionAmount
  status: 'Balanced' | 'Shortage' | 'Overage';
  invoiceCount: number;
  pendingEvidenceCount: number;
  unreconciledDepositAmount: number;
}
