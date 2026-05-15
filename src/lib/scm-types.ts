export type ProductStatus = "진행" | "단종예정" | "런칭예정" | "단종";

export interface Product {
  id: string;
  code: string;
  name: string;
  barcode: string;
  category: string;
  series: string;
  manufacturer: string;
  variant: string;
  status: ProductStatus;
  unitCost: number;
  active: boolean;
  memo: string;
  boxWidth?: number;
  boxHeight?: number;
  boxDepth?: number;
  weight?: number;
  volume?: number;
  launchDate?: string;
  costHistory?: Array<{ date: string; cost: number; reason: string }>;
  documents?: Array<{ name: string; type: string; date: string }>;
}

export type VendorRole = "제조" | "부자재" | "소모품";

export interface VendorContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  roles: VendorRole[];
  bizNumber: string;
  contacts: VendorContact[];
  memo: string;
  active: boolean;
}

export interface BomItem {
  id: string;
  materialName: string;
  vendorName: string;
  spec: string;
  quantity: number;
  moqPrices: Record<string, number>;
}

export interface BomVersion {
  id: string;
  version: string;
  active: boolean;
  moqLevels: number[];
  items: BomItem[];
}

export interface Bom {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  versions: BomVersion[];
}

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  vendorName: string;
  unit: string;
  unitPrice: number;
  memo: string;
  active: boolean;
}

export type PoStatus = "진행" | "종결" | "취소" | "잔량";

export interface Inbound {
  id: string;
  date: string;
  quantity: number;
  recorder: string;
}

export interface PurchaseOrderItem {
  id: string;
  type: "상품" | "부자재" | "소모품";
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: PoStatus;
  dueDate: string;
  expectedDate: string;
  inbounds: Inbound[];
  memo: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  vendorName: string;
  vendorContact: string;
  deliveryLocation: string;
  memo: string;
  status: PoStatus;
  items: PurchaseOrderItem[];
}
