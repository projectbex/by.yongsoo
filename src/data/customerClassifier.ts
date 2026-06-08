// ── 거래처 분류 (내부거래 vs 외부) ──
// Phase 3: 그룹��� 거래처를 식별하여 내부거래 분리

export type InternalGroup =
  | "범우화학"
  | "범우하이텍"
  | "범우화인켐"
  | "범우하이테크"
  | "범우공장"
  | "범우켐"
  | "범우루브"
  | "범우BIT"
  | "광우"
  | "기타그룹사"
  | null;

// 0단계 진단에서 확인된 15개 그룹사 거래처 (정확한 이름)
const INTERNAL_CUSTOMERS_EXACT = new Set<string>([
  "범우하이텍",
  "범우화학공업(주)양산",
  "범우화학공업(주)시화",
  "범우화인켐 주식회사",
  "범우하이테크 주식회사",
  "(주)범우 양산공장",
  "(주)범우 시화공장",
  "(주)범우켐",
  "주식회사비아이티범우연구소",
  "범우켐텍(주)",
  "범우루브 주식회사",
  "(주)광우",
  "범우켐엔지니어링(주)",
  "(주)범우케미칼",
  "범우머티리얼 주식회사",
]);

// 키워드 기반 fallback (새 거래처 추가 시 자동 매칭)
const INTERNAL_KEYWORDS = ["범우", "광우"];

export interface CustomerClassification {
  isInternal: boolean;
  group: InternalGroup;
}

function getGroup(name: string): InternalGroup {
  if (name.includes("범우화학공업")) return "범우화학";
  if (name.includes("범우하이텍")) return "범우하이텍";
  if (name.includes("범우화인켐")) return "범우화인켐";
  if (name.includes("범우하이테크")) return "범우하이테크";
  if (name.includes("범우") && name.includes("공장")) return "범우공장";
  if (name.includes("범우켐") || name.includes("범우케미칼")) return "범우켐";
  if (name.includes("범우루브")) return "범우루브";
  if (name.includes("비아이티") || name.includes("BIT")) return "범우BIT";
  if (name.includes("광우")) return "광우";
  if (name.includes("범우")) return "기타그룹사";
  return "기타그룹사";
}

export function classifyCustomer(customerName: string): CustomerClassification {
  if (!customerName) return { isInternal: false, group: null };

  const normalized = customerName.trim();

  // 정확 매칭 우선
  if (INTERNAL_CUSTOMERS_EXACT.has(normalized)) {
    return { isInternal: true, group: getGroup(normalized) };
  }

  // 키워드 fallback
  const matched = INTERNAL_KEYWORDS.find((kw) => normalized.includes(kw));
  if (matched) {
    return { isInternal: true, group: getGroup(normalized) };
  }

  return { isInternal: false, group: null };
}
