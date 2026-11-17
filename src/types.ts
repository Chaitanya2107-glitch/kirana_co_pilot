export type TabId = 'home' | 'stock' | 'delivery' | 'reorder' | 'cash';

export type ItemStatus = 'OK' | 'Low' | 'Old stock';

export type SuggestedAction = 'Put in front' | 'Bundle' | 'Small discount';

export type KhataTag = 'Pays on time' | 'Usually late' | 'Uncertain';

export interface Batch {
  id: string;
  qty: number;
  boughtDate: string; // YYYY-MM-DD
  buyPrice: number;
}

export interface InventoryItem {
  id: string;
  officialName: string;
  alias: string;
  category: string;
  dailySales: number;
  buyPrice: number;
  shelfLifeDays: number;
  distributor: string;
  batches: Batch[];
}

export interface KhataCustomer {
  id: string;
  name: string;
  amount: number;
  tag: KhataTag;
}

export interface BatchRiskInfo {
  batch: Batch;
  ageDays: number;
  remainingShelfLifeDays: number;
  isAtRisk: boolean;
  rupeesAtRisk: number;
}

export interface AtRiskItem {
  item: InventoryItem;
  totalStock: number;
  daysLeft: number;
  atRiskUnits: number;
  atRiskRupees: number;
  oldestRiskBatch: BatchRiskInfo;
  suggestedAction: SuggestedAction;
  reason: string;
}

export interface ItemMetrics {
  item: InventoryItem;
  totalStock: number;
  daysLeft: number;
  isLow: boolean;
  hasAtRiskBatch: boolean;
  atRiskUnits: number;
  atRiskRupees: number;
  status: ItemStatus;
  batchDetails: BatchRiskInfo[];
  dontReorderReason: string | null;
}

export type ReorderLineActionState = 'pending' | 'approved' | 'skipped';

export interface ReorderLine {
  item: InventoryItem;
  metrics: ItemMetrics;
  suggestedQty: number;
  qty: number;
  amount: number;
  reducedToFitBudget: boolean;
  reason: string;
  actionState: ReorderLineActionState;
  isEdited: boolean;
}

export interface NotFundedLine {
  item: InventoryItem;
  metrics: ItemMetrics;
  neededQty: number;
  neededAmount: number;
  reason: string;
}

export interface DontReorderLine {
  item: InventoryItem;
  metrics: ItemMetrics;
  reason: string;
}

export interface ReorderPlan {
  fundedLines: ReorderLine[];
  notFundedLines: NotFundedLine[];
  dontReorderLines: DontReorderLine[];
  activeOrderTotal: number;
  approvedOrderTotal: number;
  approvedCount: number;
  remainingBudget: number;
}
