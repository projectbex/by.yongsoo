import { mockPurchaseOrders } from "@/lib/scm-mock-data";
import PurchaseOrderDetail from "./PurchaseOrderDetail";

export function generateStaticParams() {
  return mockPurchaseOrders.map((po) => ({ id: po.id }));
}

export default function PurchaseOrderDetailPage() {
  return <PurchaseOrderDetail />;
}
