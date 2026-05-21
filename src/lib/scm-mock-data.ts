import type { Product, Vendor, Bom, SupplyItem, PurchaseOrder } from "./scm-types";

// ─────────────────────────────────────────
// 상품 마스터 — 실제 BEX 제품 데이터
// ─────────────────────────────────────────

export const mockProducts: Product[] = [
  // ── WD-40 시리즈 (기존) ──
  {
    id: "p1", code: "WD-100ML", name: "WD-40 멀티유즈 100ml", barcode: "8809123456001",
    category: "유통소비재(BEX)", series: "WD-40 멀티유즈", manufacturer: "WD-40 Korea",
    variant: "100ml", status: "진행", unitCost: 880, active: true, memo: "주력 상품",
    boxWidth: 50, boxHeight: 150, boxDepth: 50, weight: 130, volume: 375, launchDate: "2020-03-01",
    costHistory: [
      { date: "2026-01-01", cost: 880, reason: "원자재 단가 인상" },
      { date: "2025-06-01", cost: 820, reason: "연간 계약 갱신" },
      { date: "2024-01-01", cost: 780, reason: "초기 단가" },
    ],
    documents: [
      { name: "WD-40 디자인 가이드.pdf", type: "디자인", date: "2025-03-15" },
      { name: "MSDS 안전보건자료.pdf", type: "인증서", date: "2024-09-10" },
    ],
  },
  {
    id: "p2", code: "WD-191ML", name: "WD-40 멀티유즈 191ml", barcode: "8809123456002",
    category: "유통소비재(BEX)", series: "WD-40 멀티유즈", manufacturer: "WD-40 Korea",
    variant: "191ml", status: "진행", unitCost: 1250, active: true, memo: "",
    boxWidth: 55, boxHeight: 180, boxDepth: 55, weight: 220, volume: 544, launchDate: "2020-03-01",
    costHistory: [{ date: "2026-01-01", cost: 1250, reason: "연간 계약" }],
    documents: [],
  },

  // ── 케이블타이 시리즈 (2026 신상품) ──
  // 소재: Nylon 6.6 (PA66), Self-Locking, -40°C ~ +85°C
  {
    id: "ct01", code: "BT-10W", name: "케이블타이 10cm (백)", barcode: "8801329000106",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "100mm / 2.5mm / 백색 / 1000pcs", status: "진행", unitCost: 2000, active: true,
    memo: "인장강도 8kgf, 입수 35봉/BOX", weight: 900, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 2000, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [{ name: "케이블타이 상세페이지.pdf", type: "디자인", date: "2026-05-01" }],
  },
  {
    id: "ct02", code: "BT-10B", name: "케이블타이 10cm (흑)", barcode: "8801329000113",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "100mm / 2.5mm / 흑색 / 1000pcs", status: "진행", unitCost: 2000, active: true,
    memo: "인장강도 8kgf, 입수 35봉/BOX", weight: 900, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 2000, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct03", code: "BT-14W", name: "케이블타이 14cm (백)", barcode: "8801329000120",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "140mm / 3.6mm / 백색 / 1000pcs", status: "진행", unitCost: 4050, active: true,
    memo: "인장강도 13kgf, 입수 15봉/BOX", weight: 1800, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 4050, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct04", code: "BT-14B", name: "케이블타이 14cm (흑)", barcode: "8801329000137",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "140mm / 3.6mm / 흑색 / 1000pcs", status: "진행", unitCost: 4050, active: true,
    memo: "인장강도 13kgf, 입수 15봉/BOX", weight: 1800, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 4050, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct05", code: "BT-20W", name: "케이블타이 20cm (백)", barcode: "8801329000144",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "200mm / 4.8mm / 백색 / 1000pcs", status: "진행", unitCost: 8800, active: true,
    memo: "인장강도 22kgf, 입수 8봉/BOX, 주력 사이즈", weight: 4800, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 8800, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct06", code: "BT-20B", name: "케이블타이 20cm (흑)", barcode: "8801329000151",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "200mm / 4.8mm / 흑색 / 1000pcs", status: "진행", unitCost: 8800, active: true,
    memo: "인장강도 22kgf, 입수 8봉/BOX, 주력 사이즈", weight: 4800, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 8800, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct07", code: "BT-27W", name: "케이블타이 27cm (백)", barcode: "8801329000168",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "270mm / 6mm / 백색 / 500pcs", status: "진행", unitCost: 9050, active: true,
    memo: "인장강도 32kgf, 입수 7봉/BOX", weight: 6000, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 9050, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct08", code: "BT-27B", name: "케이블타이 27cm (흑)", barcode: "8801329000175",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "270mm / 6mm / 흑색 / 500pcs", status: "진행", unitCost: 9050, active: true,
    memo: "인장강도 32kgf, 입수 7봉/BOX", weight: 6000, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 9050, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct09", code: "BT-30W", name: "케이블타이 30cm (백)", barcode: "8801329000182",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "300mm / 5mm / 백색 / 500pcs", status: "진행", unitCost: 7950, active: true,
    memo: "인장강도 22kgf, 입수 10봉/BOX", weight: 5000, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 7950, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct10", code: "BT-30B", name: "케이블타이 30cm (흑)", barcode: "8801329000199",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "300mm / 5mm / 흑색 / 500pcs", status: "진행", unitCost: 7950, active: true,
    memo: "인장강도 22kgf, 입수 10봉/BOX", weight: 5000, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 7950, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct11", code: "BT-37W", name: "케이블타이 37cm (백)", barcode: "8801329000281",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "370mm / 7.6mm / 백색 / 300pcs", status: "진행", unitCost: 9400, active: true,
    memo: "인장강도 47kgf, 입수 7봉/BOX", weight: 7600, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 9400, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct12", code: "BT-37B", name: "케이블타이 37cm (흑)", barcode: "8801329000298",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "370mm / 7.6mm / 흑색 / 300pcs", status: "진행", unitCost: 9400, active: true,
    memo: "인장강도 47kgf, 입수 7봉/BOX", weight: 7600, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 9400, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct13", code: "BT-45W", name: "케이블타이 45cm (백)", barcode: "8801329000205",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "450mm / 9mm / 백색 / 100pcs", status: "진행", unitCost: 5850, active: true,
    memo: "인장강도 80kgf, 입수 13봉/BOX, 산업용 대형", weight: 9000, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 5850, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "ct14", code: "BT-45B", name: "케이블타이 45cm (흑)", barcode: "8801329000212",
    category: "유통소비재(BEX)", series: "프리미엄 케이블타이", manufacturer: "㈜툴스피아",
    variant: "450mm / 9mm / 흑색 / 100pcs", status: "진행", unitCost: 5850, active: true,
    memo: "인장강도 80kgf, 입수 13봉/BOX, 산업용 대형", weight: 9000, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-10", cost: 5850, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },

  // ── 방진복 BP (BEX Protection) 시리즈 (2026 신상품) ──
  // 소재: PP부직포, 후드형/원피스, 먼지/오염 차단, 통기성 우수
  {
    id: "bp01", code: "BP-XL-WH", name: "방진복 BP XL (흰색)", barcode: "8801329000229",
    category: "유통소비재(BEX)", series: "BP(BEX Protection)", manufacturer: "㈜툴스피아",
    variant: "XL / 흰색 / 24EA입", status: "진행", unitCost: 1100, active: true,
    memo: "총길이 176cm, 가슴너비 65cm, 소매길이 58cm, 바지길이 82cm, 키 165~175cm 추천, 입수 24EA/BOX",
    weight: 180, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-05", cost: 1100, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [{ name: "방진복 상세페이지.pdf", type: "디자인", date: "2026-05-01" }],
  },
  {
    id: "bp02", code: "BP-XL-GR", name: "방진복 BP XL (회색)", barcode: "8801329000236",
    category: "유통소비재(BEX)", series: "BP(BEX Protection)", manufacturer: "㈜툴스피아",
    variant: "XL / 회색 / 24EA입", status: "진행", unitCost: 1100, active: true,
    memo: "총길이 176cm, 가슴너비 65cm, 키 165~175cm 추천, 입수 24EA/BOX",
    weight: 180, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-05", cost: 1100, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "bp03", code: "BP-XXL-WH", name: "방진복 BP XXL (흰색)", barcode: "8801329000243",
    category: "유통소비재(BEX)", series: "BP(BEX Protection)", manufacturer: "㈜툴스피아",
    variant: "XXL / 흰색 / 24EA입", status: "진행", unitCost: 1100, active: true,
    memo: "총길이 180cm, 가슴너비 68cm, 키 170~180cm 추천, 입수 24EA/BOX",
    weight: 190, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-05", cost: 1100, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "bp04", code: "BP-XXL-GR", name: "방진복 BP XXL (회색)", barcode: "8801329000250",
    category: "유통소비재(BEX)", series: "BP(BEX Protection)", manufacturer: "㈜툴스피아",
    variant: "XXL / 회색 / 24EA입", status: "진행", unitCost: 1100, active: true,
    memo: "총길이 180cm, 가슴너비 68cm, 키 170~180cm 추천, 입수 24EA/BOX",
    weight: 190, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-05", cost: 1100, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "bp05", code: "BP-XXXL-WH", name: "방진복 BP XXXL (흰색)", barcode: "8801329000267",
    category: "유통소비재(BEX)", series: "BP(BEX Protection)", manufacturer: "㈜툴스피아",
    variant: "XXXL / 흰색 / 24EA입", status: "진행", unitCost: 1100, active: true,
    memo: "총길이 184cm, 가슴너비 71cm, 키 175~185cm 추천, 입수 24EA/BOX",
    weight: 200, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-05", cost: 1100, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },
  {
    id: "bp06", code: "BP-XXXL-GR", name: "방진복 BP XXXL (회색)", barcode: "8801329000274",
    category: "유통소비재(BEX)", series: "BP(BEX Protection)", manufacturer: "㈜툴스피아",
    variant: "XXXL / 회색 / 24EA입", status: "진행", unitCost: 1100, active: true,
    memo: "총길이 184cm, 가슴너비 71cm, 키 175~185cm 추천, 입수 24EA/BOX",
    weight: 200, launchDate: "2026-05-22",
    costHistory: [{ date: "2026-03-05", cost: 1100, reason: "초도 발주 단가 (VAT별도)" }],
    documents: [],
  },

  // ── 베지아쿠아 (런칭예정) ──
  {
    id: "p5", code: "VA-500ML", name: "베지아쿠아 500ml", barcode: "8809123456030",
    category: "유통소비재(BEX)", series: "베지아쿠아", manufacturer: "WD-40 Korea",
    variant: "500ml", status: "런칭예정", unitCost: 1500, active: false, memo: "2026 하반기 런칭 예정",
    launchDate: "2026-09-01",
    costHistory: [{ date: "2026-04-01", cost: 1500, reason: "예정 단가" }],
    documents: [{ name: "런칭기획서.pdf", type: "기획", date: "2026-03-20" }],
  },
];

// ─────────────────────────────────────────
// 거래처
// ─────────────────────────────────────────

export const mockVendors: Vendor[] = [
  {
    id: "v1", name: "WD-40 Korea", roles: ["제조"], bizNumber: "123-45-67890",
    contacts: [
      { id: "vc1", name: "김제조", role: "영업 담당", email: "kim@wd40.co.kr", phone: "010-1234-5678", active: true },
      { id: "vc2", name: "박물류", role: "물류 담당", email: "park@wd40.co.kr", phone: "010-2345-6789", active: true },
    ],
    memo: "WD-40 독점 공급", active: true,
  },
  {
    id: "v2", name: "㈜툴스피아", roles: ["제조"], bizNumber: "234-56-78901",
    contacts: [
      { id: "vc3", name: "이대표", role: "대표이사", email: "lee@toolspia.com", phone: "010-3456-7890", active: true },
    ],
    memo: "케이블타이 14종 + 방진복 6종 제조/공급, 지정 물류창고 도착 기준 납품", active: true,
  },
  {
    id: "v3", name: "반월공장", roles: ["제조", "부자재"], bizNumber: "345-67-89012",
    contacts: [
      { id: "vc4", name: "홍길동", role: "영업 담당", email: "hong@banwol.co.kr", phone: "010-4567-8901", active: true },
      { id: "vc5", name: "이대표", role: "기술 담당", email: "lee@banwol.co.kr", phone: "010-5678-9012", active: false },
    ],
    memo: "캔/노즐 제조 + 부자재 공급", active: true,
  },
  {
    id: "v4", name: "㈜대영포장", roles: ["소모품"], bizNumber: "456-78-90123",
    contacts: [
      { id: "vc6", name: "정포장", role: "영업 담당", email: "jung@daeyoung.co.kr", phone: "010-6789-0123", active: true },
    ],
    memo: "라벨/포장재 전문", active: true,
  },
];

// ─────────────────────────────────────────
// BOM
// ─────────────────────────────────────────

export const mockBoms: Bom[] = [
  {
    id: "b1", productId: "p1", productName: "WD-40 멀티유즈 100ml", productCode: "WD-100ML",
    versions: [
      {
        id: "bv1", version: "v1", active: true, moqLevels: [5000, 10000, 20000],
        items: [
          { id: "bi1", materialName: "캔 100ml", vendorName: "반월공장", spec: "100ml 알루미늄", quantity: 1, moqPrices: { "5000": 800, "10000": 700, "20000": 650 } },
          { id: "bi2", materialName: "노즐", vendorName: "반월공장", spec: "표준형", quantity: 1, moqPrices: { "5000": 50, "10000": 45, "20000": 40 } },
          { id: "bi3", materialName: "라벨", vendorName: "㈜대영포장", spec: "100ml용", quantity: 1, moqPrices: { "5000": 30, "10000": 25, "20000": 20 } },
        ],
      },
    ],
  },
  {
    id: "b2", productId: "ct05", productName: "케이블타이 20cm (백)", productCode: "BT-20W",
    versions: [
      {
        id: "bv3", version: "v1", active: true, moqLevels: [5000, 10000, 50000],
        items: [
          { id: "bi7", materialName: "나일론 원사 (PA66)", vendorName: "㈜툴스피아", spec: "PA66 산업용", quantity: 1000, moqPrices: { "5000": 8.8, "10000": 8.0, "50000": 7.5 } },
          { id: "bi8", materialName: "포장봉투 (PE)", vendorName: "㈜대영포장", spec: "1000pcs 포장", quantity: 1, moqPrices: { "5000": 20, "10000": 15, "50000": 12 } },
        ],
      },
    ],
  },
  {
    id: "b3", productId: "bp01", productName: "방진복 BP XL (흰색)", productCode: "BP-XL-WH",
    versions: [
      {
        id: "bv4", version: "v1", active: true, moqLevels: [5000, 10000, 30000],
        items: [
          { id: "bi9", materialName: "PP부직포 원단", vendorName: "㈜툴스피아", spec: "SMS 원단 / 통기성", quantity: 1, moqPrices: { "5000": 900, "10000": 850, "30000": 800 } },
          { id: "bi10", materialName: "지퍼", vendorName: "㈜툴스피아", spec: "전면 지퍼 구조", quantity: 1, moqPrices: { "5000": 100, "10000": 90, "30000": 80 } },
          { id: "bi11", materialName: "개별포장 비닐", vendorName: "㈜대영포장", spec: "단품 포장", quantity: 1, moqPrices: { "5000": 50, "10000": 40, "30000": 35 } },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────
// 소모품
// ─────────────────────────────────────────

export const mockSupplyItems: SupplyItem[] = [
  { id: "s1", name: "택배박스 (소)", category: "택배박스", vendorName: "㈜대영포장", unit: "EA", unitPrice: 350, memo: "WD-40 단품용", active: true },
  { id: "s2", name: "택배박스 (중)", category: "택배박스", vendorName: "㈜대영포장", unit: "EA", unitPrice: 450, memo: "2~3개 합포용", active: true },
  { id: "s3", name: "택배박스 (대)", category: "택배박스", vendorName: "㈜대영포장", unit: "EA", unitPrice: 600, memo: "대량 합포용", active: true },
  { id: "s4", name: "에어캡", category: "포장재", vendorName: "㈜대영포장", unit: "M", unitPrice: 50, memo: "폭 50cm", active: true },
  { id: "s5", name: "OPP테이프", category: "포장재", vendorName: "㈜대영포장", unit: "EA", unitPrice: 1200, memo: "48mm x 100m", active: true },
];

// ─────────────────────────────────────────
// 발주 관리 — 실제 발주서 기반 데이터
// ─────────────────────────────────────────

export const mockPurchaseOrders: PurchaseOrder[] = [
  // 실제 발주: 케이블타이 14종 → ㈜툴스피아 (2026.03.10 발주)
  {
    id: "po1", poNumber: "PO2603-CT", orderDate: "2026-03-10", vendorName: "㈜툴스피아",
    vendorContact: "이대표", deliveryLocation: "지정 물류창고", memo: "케이블타이 초도 발주 / 납품요청 2026.04.17",
    status: "종결",
    items: [
      { id: "poi01", type: "상품", itemName: "BT-10W 케이블타이 10cm (백) 1000pcs", quantity: 1575, unitPrice: 2000, total: 3150000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "45BOX", inbounds: [{ id: "ib01", date: "2026-04-17", quantity: 1575, recorder: "신용수" }] },
      { id: "poi02", type: "상품", itemName: "BT-10B 케이블타이 10cm (흑) 1000pcs", quantity: 1575, unitPrice: 2000, total: 3150000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "45BOX", inbounds: [{ id: "ib02", date: "2026-04-17", quantity: 1575, recorder: "신용수" }] },
      { id: "poi03", type: "상품", itemName: "BT-14W 케이블타이 14cm (백) 1000pcs", quantity: 1500, unitPrice: 4050, total: 6075000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "100BOX", inbounds: [{ id: "ib03", date: "2026-04-17", quantity: 1500, recorder: "신용수" }] },
      { id: "poi04", type: "상품", itemName: "BT-14B 케이블타이 14cm (흑) 1000pcs", quantity: 1500, unitPrice: 4050, total: 6075000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "100BOX", inbounds: [{ id: "ib04", date: "2026-04-17", quantity: 1500, recorder: "신용수" }] },
      { id: "poi05", type: "상품", itemName: "BT-20W 케이블타이 20cm (백) 1000pcs", quantity: 5000, unitPrice: 8800, total: 44000000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "625BOX, 주력", inbounds: [{ id: "ib05", date: "2026-04-17", quantity: 5000, recorder: "신용수" }] },
      { id: "poi06", type: "상품", itemName: "BT-20B 케이블타이 20cm (흑) 1000pcs", quantity: 5000, unitPrice: 8800, total: 44000000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "625BOX, 주력", inbounds: [{ id: "ib06", date: "2026-04-17", quantity: 5000, recorder: "신용수" }] },
      { id: "poi07", type: "상품", itemName: "BT-27W 케이블타이 27cm (백) 500pcs", quantity: 3500, unitPrice: 9050, total: 31675000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "500BOX", inbounds: [{ id: "ib07", date: "2026-04-17", quantity: 3500, recorder: "신용수" }] },
      { id: "poi08", type: "상품", itemName: "BT-27B 케이블타이 27cm (흑) 500pcs", quantity: 3500, unitPrice: 9050, total: 31675000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "500BOX", inbounds: [{ id: "ib08", date: "2026-04-17", quantity: 3500, recorder: "신용수" }] },
      { id: "poi09", type: "상품", itemName: "BT-30W 케이블타이 30cm (백) 500pcs", quantity: 3000, unitPrice: 7950, total: 23850000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "300BOX", inbounds: [{ id: "ib09", date: "2026-04-17", quantity: 3000, recorder: "신용수" }] },
      { id: "poi10", type: "상품", itemName: "BT-30B 케이블타이 30cm (흑) 500pcs", quantity: 3000, unitPrice: 7950, total: 23850000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "300BOX", inbounds: [{ id: "ib10", date: "2026-04-17", quantity: 3000, recorder: "신용수" }] },
      { id: "poi11", type: "상품", itemName: "BT-37W 케이블타이 37cm (백) 300pcs", quantity: 4060, unitPrice: 9400, total: 38164000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "580BOX", inbounds: [{ id: "ib11", date: "2026-04-17", quantity: 4060, recorder: "신용수" }] },
      { id: "poi12", type: "상품", itemName: "BT-37B 케이블타이 37cm (흑) 300pcs", quantity: 4060, unitPrice: 9400, total: 38164000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "580BOX", inbounds: [{ id: "ib12", date: "2026-04-17", quantity: 4060, recorder: "신용수" }] },
      { id: "poi13", type: "상품", itemName: "BT-45W 케이블타이 45cm (백) 100pcs", quantity: 2600, unitPrice: 5850, total: 15210000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "200BOX", inbounds: [{ id: "ib13", date: "2026-04-17", quantity: 2600, recorder: "신용수" }] },
      { id: "poi14", type: "상품", itemName: "BT-45B 케이블타이 45cm (흑) 100pcs", quantity: 2600, unitPrice: 5850, total: 15210000, status: "종결", dueDate: "2026-04-17", expectedDate: "2026-04-17", memo: "200BOX", inbounds: [{ id: "ib14", date: "2026-04-17", quantity: 2600, recorder: "신용수" }] },
    ],
  },
  // 실제 발주: 방진복 6종 → ㈜툴스피아 (2026.03.05 발주)
  {
    id: "po2", poNumber: "PO2603-BP", orderDate: "2026-03-05", vendorName: "㈜툴스피아",
    vendorContact: "이대표", deliveryLocation: "지정 물류창고", memo: "방진복 초도 발주 / 납품요청 2026.04.23",
    status: "종결",
    items: [
      { id: "poi15", type: "상품", itemName: "방진복 BP XL (흰색) 24EA입", quantity: 5016, unitPrice: 1100, total: 5517600, status: "종결", dueDate: "2026-04-23", expectedDate: "2026-04-23", memo: "209BOX", inbounds: [{ id: "ib15", date: "2026-04-23", quantity: 5016, recorder: "신용수" }] },
      { id: "poi16", type: "상품", itemName: "방진복 BP XL (회색) 24EA입", quantity: 5016, unitPrice: 1100, total: 5517600, status: "종결", dueDate: "2026-04-23", expectedDate: "2026-04-23", memo: "209BOX", inbounds: [{ id: "ib16", date: "2026-04-23", quantity: 5016, recorder: "신용수" }] },
      { id: "poi17", type: "상품", itemName: "방진복 BP XXL (흰색) 24EA입", quantity: 5016, unitPrice: 1100, total: 5517600, status: "종결", dueDate: "2026-04-23", expectedDate: "2026-04-23", memo: "209BOX", inbounds: [{ id: "ib17", date: "2026-04-23", quantity: 5016, recorder: "신용수" }] },
      { id: "poi18", type: "상품", itemName: "방진복 BP XXL (회색) 24EA입", quantity: 5016, unitPrice: 1100, total: 5517600, status: "종결", dueDate: "2026-04-23", expectedDate: "2026-04-23", memo: "209BOX", inbounds: [{ id: "ib18", date: "2026-04-23", quantity: 5016, recorder: "신용수" }] },
      { id: "poi19", type: "상품", itemName: "방진복 BP XXXL (흰색) 24EA입", quantity: 5016, unitPrice: 1100, total: 5517600, status: "종결", dueDate: "2026-04-23", expectedDate: "2026-04-23", memo: "209BOX", inbounds: [{ id: "ib19", date: "2026-04-23", quantity: 5016, recorder: "신용수" }] },
      { id: "poi20", type: "상품", itemName: "방진복 BP XXXL (회색) 24EA입", quantity: 5016, unitPrice: 1100, total: 5517600, status: "종결", dueDate: "2026-04-23", expectedDate: "2026-04-23", memo: "209BOX", inbounds: [{ id: "ib20", date: "2026-04-23", quantity: 5016, recorder: "신용수" }] },
    ],
  },
  // WD-40 정기 발주
  {
    id: "po3", poNumber: "PO2605-WD", orderDate: "2026-05-12", vendorName: "반월공장",
    vendorContact: "홍길동", deliveryLocation: "본사", memo: "WD-40 100ml 5월 발주",
    status: "진행",
    items: [
      {
        id: "poi21", type: "상품", itemName: "WD-40 멀티유즈 100ml", quantity: 5000, unitPrice: 880,
        total: 4400000, status: "진행", dueDate: "2026-05-30", expectedDate: "2026-05-28", memo: "",
        inbounds: [{ id: "ib21", date: "2026-05-20", quantity: 2000, recorder: "신용수" }],
      },
      {
        id: "poi22", type: "부자재", itemName: "노즐", quantity: 5000, unitPrice: 50,
        total: 250000, status: "진행", dueDate: "2026-05-30", expectedDate: "2026-05-28", memo: "",
        inbounds: [],
      },
    ],
  },
  // 포장재 정기 발주
  {
    id: "po4", poNumber: "PO2605-PKG", orderDate: "2026-05-08", vendorName: "㈜대영포장",
    vendorContact: "정포장", deliveryLocation: "본사", memo: "포장재 정기 발주",
    status: "진행",
    items: [
      { id: "poi23", type: "소모품", itemName: "택배박스 (소)", quantity: 500, unitPrice: 350, total: 175000, status: "종결", dueDate: "2026-05-15", expectedDate: "2026-05-14", memo: "", inbounds: [{ id: "ib22", date: "2026-05-14", quantity: 500, recorder: "신용수" }] },
      { id: "poi24", type: "소모품", itemName: "에어캡", quantity: 200, unitPrice: 50, total: 10000, status: "진행", dueDate: "2026-05-15", expectedDate: "2026-05-14", memo: "", inbounds: [] },
      { id: "poi25", type: "소모품", itemName: "OPP테이프", quantity: 50, unitPrice: 1200, total: 60000, status: "진행", dueDate: "2026-05-15", expectedDate: "2026-05-14", memo: "", inbounds: [] },
    ],
  },
];
