import type { Product, Vendor, Bom, SupplyItem, PurchaseOrder } from "./scm-types";

export const mockProducts: Product[] = [
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
  {
    id: "p3", code: "CT-200BK100", name: "케이블타이 200mm 흑색 100p", barcode: "8809123456010",
    category: "유통소비재(BEX)", series: "케이블타이", manufacturer: "툴스피아",
    variant: "200mm/흑색/100p", status: "진행", unitCost: 450, active: true, memo: "",
    boxWidth: 80, boxHeight: 200, boxDepth: 30, weight: 95, volume: 480, launchDate: "2021-06-15",
    costHistory: [{ date: "2025-01-01", cost: 450, reason: "초기 단가" }],
    documents: [],
  },
  {
    id: "p4", code: "DS-XL-WH", name: "방진복 XL 흰색", barcode: "8809123456020",
    category: "유통소비재(BEX)", series: "방진복", manufacturer: "툴스피아",
    variant: "XL/흰색", status: "진행", unitCost: 3200, active: true, memo: "",
    weight: 180, launchDate: "2022-01-10",
    costHistory: [{ date: "2025-03-01", cost: 3200, reason: "초기 단가" }],
    documents: [],
  },
  {
    id: "p5", code: "VA-500ML", name: "베지아쿠아 500ml", barcode: "8809123456030",
    category: "유통소비재(BEX)", series: "베지아쿠아", manufacturer: "WD-40 Korea",
    variant: "500ml", status: "런칭예정", unitCost: 1500, active: false, memo: "2026 하반기 런칭 예정",
    launchDate: "2026-09-01",
    costHistory: [{ date: "2026-04-01", cost: 1500, reason: "예정 단가" }],
    documents: [{ name: "런칭기획서.pdf", type: "기획", date: "2026-03-20" }],
  },
];

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
    id: "v2", name: "툴스피아", roles: ["제조"], bizNumber: "234-56-78901",
    contacts: [
      { id: "vc3", name: "이대표", role: "대표이사", email: "lee@toolspia.com", phone: "010-3456-7890", active: true },
    ],
    memo: "케이블타이/방진복 제조", active: true,
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
      {
        id: "bv2", version: "v2", active: false, moqLevels: [5000, 10000],
        items: [
          { id: "bi4", materialName: "캔 100ml (신형)", vendorName: "반월공장", spec: "100ml 신형", quantity: 1, moqPrices: { "5000": 850, "10000": 750 } },
          { id: "bi5", materialName: "노즐 (신형)", vendorName: "반월공장", spec: "개선형", quantity: 1, moqPrices: { "5000": 55, "10000": 48 } },
          { id: "bi6", materialName: "라벨", vendorName: "㈜대영포장", spec: "100ml용", quantity: 1, moqPrices: { "5000": 30, "10000": 25 } },
        ],
      },
    ],
  },
  {
    id: "b2", productId: "p3", productName: "케이블타이 200mm 흑색 100p", productCode: "CT-200BK100",
    versions: [
      {
        id: "bv3", version: "v1", active: true, moqLevels: [10000, 30000, 50000],
        items: [
          { id: "bi7", materialName: "원사 (나일론)", vendorName: "툴스피아", spec: "PA66", quantity: 100, moqPrices: { "10000": 3, "30000": 2.5, "50000": 2 } },
          { id: "bi8", materialName: "포장봉투", vendorName: "㈜대영포장", spec: "PE 100p", quantity: 1, moqPrices: { "10000": 15, "30000": 12, "50000": 10 } },
        ],
      },
    ],
  },
  {
    id: "b3", productId: "p4", productName: "방진복 XL 흰색", productCode: "DS-XL-WH",
    versions: [
      {
        id: "bv4", version: "v1", active: true, moqLevels: [1000, 3000, 5000],
        items: [
          { id: "bi9", materialName: "부직포 원단", vendorName: "툴스피아", spec: "SMS 원단", quantity: 1, moqPrices: { "1000": 2800, "3000": 2500, "5000": 2200 } },
          { id: "bi10", materialName: "지퍼", vendorName: "툴스피아", spec: "YKK 호환", quantity: 1, moqPrices: { "1000": 200, "3000": 180, "5000": 150 } },
          { id: "bi11", materialName: "포장비닐", vendorName: "㈜대영포장", spec: "개별포장", quantity: 1, moqPrices: { "1000": 50, "3000": 40, "5000": 35 } },
        ],
      },
    ],
  },
];

export const mockSupplyItems: SupplyItem[] = [
  { id: "s1", name: "택배박스 (소)", category: "택배박스", vendorName: "㈜대영포장", unit: "EA", unitPrice: 350, memo: "WD-40 단품용", active: true },
  { id: "s2", name: "택배박스 (중)", category: "택배박스", vendorName: "㈜대영포장", unit: "EA", unitPrice: 450, memo: "2~3개 합포용", active: true },
  { id: "s3", name: "택배박스 (대)", category: "택배박스", vendorName: "㈜대영포장", unit: "EA", unitPrice: 600, memo: "대량 합포용", active: true },
  { id: "s4", name: "에어캡", category: "포장재", vendorName: "㈜대영포장", unit: "M", unitPrice: 50, memo: "폭 50cm", active: true },
  { id: "s5", name: "OPP테이프", category: "포장재", vendorName: "㈜대영포장", unit: "EA", unitPrice: 1200, memo: "48mm x 100m", active: true },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po1", poNumber: "PO2605000001", orderDate: "2026-05-12", vendorName: "반월공장",
    vendorContact: "홍길동", deliveryLocation: "본사", memo: "WD-40 100ml 5월 발주",
    status: "진행",
    items: [
      {
        id: "poi1", type: "상품", itemName: "WD-40 멀티유즈 100ml", quantity: 5000, unitPrice: 880,
        total: 4400000, status: "진행", dueDate: "2026-05-30", expectedDate: "2026-05-28", memo: "",
        inbounds: [{ id: "ib1", date: "2026-05-20", quantity: 2000, recorder: "신용수" }],
      },
      {
        id: "poi2", type: "부자재", itemName: "노즐", quantity: 5000, unitPrice: 50,
        total: 250000, status: "진행", dueDate: "2026-05-30", expectedDate: "2026-05-28", memo: "",
        inbounds: [],
      },
    ],
  },
  {
    id: "po2", poNumber: "PO2605000002", orderDate: "2026-05-10", vendorName: "툴스피아",
    vendorContact: "이대표", deliveryLocation: "본사", memo: "케이블타이 보충",
    status: "종결",
    items: [
      {
        id: "poi3", type: "상품", itemName: "케이블타이 200mm 흑색 100p", quantity: 10000, unitPrice: 450,
        total: 4500000, status: "종결", dueDate: "2026-05-20", expectedDate: "2026-05-18", memo: "",
        inbounds: [
          { id: "ib2", date: "2026-05-18", quantity: 10000, recorder: "신용수" },
        ],
      },
    ],
  },
  {
    id: "po3", poNumber: "PO2605000003", orderDate: "2026-05-08", vendorName: "㈜대영포장",
    vendorContact: "정포장", deliveryLocation: "본사", memo: "포장재 정기 발주",
    status: "진행",
    items: [
      {
        id: "poi4", type: "소모품", itemName: "택배박스 (소)", quantity: 500, unitPrice: 350,
        total: 175000, status: "종결", dueDate: "2026-05-15", expectedDate: "2026-05-14", memo: "",
        inbounds: [{ id: "ib3", date: "2026-05-14", quantity: 500, recorder: "신용수" }],
      },
      {
        id: "poi5", type: "소모품", itemName: "에어캡", quantity: 200, unitPrice: 50,
        total: 10000, status: "진행", dueDate: "2026-05-15", expectedDate: "2026-05-14", memo: "",
        inbounds: [],
      },
      {
        id: "poi6", type: "소모품", itemName: "OPP테이프", quantity: 50, unitPrice: 1200,
        total: 60000, status: "진행", dueDate: "2026-05-15", expectedDate: "2026-05-14", memo: "",
        inbounds: [],
      },
    ],
  },
];
