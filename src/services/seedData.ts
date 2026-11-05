import { District, Product, ReportingPeriod, Sale, Shop, TransferOut, UserProfile } from '../types';
import { generateInvoiceSvg, generateDepositSvg } from './receiptAssets';

export const INITIAL_SHOPS: Shop[] = [
  // Special Administrative Consolidation Account
  {
    id: 'adama_main',
    name: 'ADAMA MAIN (Consolidated)',
    code: 'ADAMA-MAIN',
    accountType: 'administrative_consolidation',
    status: 'active',
    location: 'Oromia Regional HQ',
    isConsolidated: true,
    consolidatedShopIds: ['adama', 'hawassa', 'borena', 'bale', 'assela'],
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  // 8 Independent Operational Shops
  {
    id: 'adama',
    name: 'Adama Shop',
    code: 'ADAMA',
    accountType: 'operational',
    status: 'active',
    location: 'Adama, Oromia',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'hawassa',
    name: 'Hawassa Shop',
    code: 'HAWASSA',
    accountType: 'operational',
    status: 'active',
    location: 'Hawassa, Sidama',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'borena',
    name: 'Borena Shop',
    code: 'BORENA',
    accountType: 'operational',
    status: 'active',
    location: 'Borena, Oromia',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'bale',
    name: 'Bale Shop',
    code: 'BALE',
    accountType: 'operational',
    status: 'active',
    location: 'Bale, Oromia',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'assela',
    name: 'Assela Shop',
    code: 'ASSELA',
    accountType: 'operational',
    status: 'active',
    location: 'Assela, Oromia',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'shashemene',
    name: 'Shashemene Shop',
    code: 'SHASHEMENE',
    accountType: 'operational',
    status: 'active',
    location: 'Shashemene, Oromia',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'chiro',
    name: 'Chiro Shop',
    code: 'CHIRO',
    accountType: 'operational',
    status: 'active',
    location: 'Chiro, Oromia',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'jemo',
    name: 'Jemo Shop',
    code: 'JEMO',
    accountType: 'operational',
    status: 'active',
    location: 'Jemo, Addis Ababa',
    createdAt: '2026-10-01T00:00:00.000Z'
  }
];

export const INITIAL_DISTRICTS: District[] = [
  { id: 'adama-d1', shopId: 'adama', name: 'District 1', code: 'DIST-1', status: 'active', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'adama-d2', shopId: 'adama', name: 'District 2', code: 'DIST-2', status: 'active', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'adama-d3', shopId: 'adama', name: 'District 3', code: 'DIST-3', status: 'active', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'adama-d4', shopId: 'adama', name: 'District 4', code: 'DIST-4', status: 'active', createdAt: '2026-10-01T00:00:00.000Z' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'float',
    name: 'FLOAT (M-PESA / Telecom)',
    code: 'FLOAT',
    unit: 'ETB',
    isDefault: true,
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z'
  }
];

export const INITIAL_PERIODS: ReportingPeriod[] = [
  // Jemo
  {
    id: 'jemo-2026-10',
    shopId: 'jemo',
    monthKey: '2026-10',
    monthName: 'October 2026',
    openingBalance: -1021,
    status: 'open',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'jemo-2026-11',
    shopId: 'jemo',
    monthKey: '2026-11',
    monthName: 'November 2026',
    openingBalance: 25640,
    status: 'open',
    createdAt: '2026-11-01T00:00:00.000Z'
  },
  // Adama Main Consolidation
  {
    id: 'adama_main-2026-10',
    shopId: 'adama_main',
    monthKey: '2026-10',
    monthName: 'October 2026',
    openingBalance: 0,
    status: 'open',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  // Operational Shops
  { id: 'adama-2026-10', shopId: 'adama', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'hawassa-2026-10', shopId: 'hawassa', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'borena-2026-10', shopId: 'borena', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'bale-2026-10', shopId: 'bale', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'assela-2026-10', shopId: 'assela', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'shashemene-2026-10', shopId: 'shashemene', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' },
  { id: 'chiro-2026-10', shopId: 'chiro', monthKey: '2026-10', monthName: 'October 2026', openingBalance: 0, status: 'open', createdAt: '2026-10-01T00:00:00.000Z' }
];

export const INITIAL_TRANSFERS: TransferOut[] = [
  // Jemo Transfers (Verified from uploaded sheet)
  {
    id: 'to-jemo-2026-10-1',
    shopId: 'jemo',
    shopName: 'Jemo Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    amount: 1600000,
    date: '2026-10-01',
    refNumber: 'TO 1-20',
    notes: 'Transfer Out batch 1-20 (October)',
    createdBy: 'brookaklilu33@gmail.com',
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'to-jemo-2026-10-2',
    shopId: 'jemo',
    shopName: 'Jemo Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    amount: 976071,
    date: '2026-10-21',
    refNumber: 'TO 21-31',
    notes: 'Transfer Out batch 21-31 (October)',
    createdBy: 'brookaklilu33@gmail.com',
    createdAt: '2026-10-21T08:00:00.000Z'
  },
  // Adama Main Transfer Out allocation
  {
    id: 'to-adama-main-2026-10-1',
    shopId: 'adama_main',
    shopName: 'ADAMA MAIN (Consolidated)',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    amount: 3500000,
    date: '2026-10-01',
    refNumber: 'TO-ADM-MAIN-01',
    notes: 'Adama Regional float batch for Adama, Hawassa, Borena, Bale, Assela',
    createdBy: 'brookaklilu33@gmail.com',
    createdAt: '2026-10-01T08:00:00.000Z'
  }
];

// October 2026 Jemo sales
const RAW_OCTOBER_JEMO_SALES: { ref: string; date: string; amount: number }[] = [
  { ref: '0036063', date: '2026-10-01', amount: 3300 },
  { ref: '0036064', date: '2026-10-02', amount: 3300 },
  { ref: '0036065', date: '2026-10-02', amount: 20000 },
  { ref: '0036066', date: '2026-10-02', amount: 46700 },
  { ref: '0036067', date: '2026-10-02', amount: 60550 },
  { ref: '0036068', date: '2026-10-03', amount: 20000 },
  { ref: '0036069', date: '2026-10-03', amount: 43900 },
  { ref: '0036070', date: '2026-10-05', amount: 3300 },
  { ref: '0036071', date: '2026-10-05', amount: 3300 },
  { ref: '0036072', date: '2026-10-05', amount: 20100 },
  { ref: '0036073', date: '2026-10-05', amount: 3300 },
  { ref: '0036074', date: '2026-10-05', amount: 20000 },
  { ref: '0036075', date: '2026-10-05', amount: 3300 },
  { ref: '0036076', date: '2026-10-05', amount: 78200 },
  { ref: '0036077', date: '2026-10-06', amount: 20100 },
  { ref: '0036078', date: '2026-10-06', amount: 46800 },
  { ref: '0036079', date: '2026-10-07', amount: 3300 },
  { ref: '0036080', date: '2026-10-07', amount: 36200 },
  { ref: '0036081', date: '2026-10-07', amount: 54600 },
  { ref: '0036082', date: '2026-10-08', amount: 4500 },
  { ref: '0036083', date: '2026-10-08', amount: 650 },
  { ref: '0036084', date: '2026-10-08', amount: 16350 },
  { ref: '0036087', date: '2026-10-09', amount: 40000 },
  { ref: '0036088', date: '2026-10-09', amount: 3300 },
  { ref: '0036089', date: '2026-10-09', amount: 15630 },
  { ref: '0036090', date: '2026-10-09', amount: 26850 },
  { ref: '0036091', date: '2026-10-09', amount: 43400 },
  { ref: '0036092', date: '2026-10-09', amount: 3400 },
  { ref: '0036093', date: '2026-10-10', amount: 15630 },
  { ref: '0036094', date: '2026-10-10', amount: 3300 },
  { ref: '0036095', date: '2026-10-10', amount: 47300 },
  { ref: '0036096', date: '2026-10-12', amount: 9500 },
  { ref: '0036097', date: '2026-10-12', amount: 15700 },
  { ref: '0036098', date: '2026-10-12', amount: 3300 },
  { ref: '0036099', date: '2026-10-12', amount: 15730 },
  { ref: '0036100', date: '2026-10-12', amount: 2100 },
  { ref: '0036351', date: '2026-10-12', amount: 20100 },
  { ref: '0036352', date: '2026-10-12', amount: 9500 },
  { ref: '0036353', date: '2026-10-12', amount: 47550 },
  { ref: '0036354', date: '2026-10-13', amount: 15730 },
  { ref: '0036355', date: '2026-10-13', amount: 20100 },
  { ref: '0036356', date: '2026-10-13', amount: 3400 },
  { ref: '0036357', date: '2026-10-13', amount: 3400 },
  { ref: '0036358', date: '2026-10-13', amount: 17400 },
  { ref: '0036359', date: '2026-10-13', amount: 31300 },
  { ref: '0036360', date: '2026-10-14', amount: 3300 },
  { ref: '0036361', date: '2026-10-14', amount: 20000 },
  { ref: '0036362', date: '2026-10-15', amount: 20000 },
  { ref: '0036363', date: '2026-10-15', amount: 20000 },
  { ref: '0036364', date: '2026-10-15', amount: 3400 },
  { ref: '0036365', date: '2026-10-15', amount: 80000 },
  { ref: '0036366', date: '2026-10-15', amount: 20000 },
  { ref: '0036367', date: '2026-10-15', amount: 3300 },
  { ref: '0036368', date: '2026-10-15', amount: 15630 },
  { ref: '0036369', date: '2026-10-15', amount: 15630 },
  { ref: '0036370', date: '2026-10-15', amount: 26400 },
  { ref: '0036371', date: '2026-10-15', amount: 4600 },
  { ref: '0036373', date: '2026-10-15', amount: 41900 },
  { ref: '0036374', date: '2026-10-16', amount: 20100 },
  { ref: '0036376', date: '2026-10-16', amount: 3300 },
  { ref: '0036377', date: '2026-10-16', amount: 25650 },
  { ref: '0036379', date: '2026-10-17', amount: 9600 },
  { ref: '0036380', date: '2026-10-17', amount: 81650 },
  { ref: '0036381', date: '2026-10-17', amount: 21800 },
  { ref: '0036382', date: '2026-10-17', amount: 3300 },
  { ref: '0036383', date: '2026-10-19', amount: 25000 },
  { ref: '0036384', date: '2026-10-19', amount: 4500 },
  { ref: '0036385', date: '2026-10-19', amount: 3300 },
  { ref: '0036386', date: '2026-10-19', amount: 3300 },
  { ref: '0036387', date: '2026-10-19', amount: 68750 },
  { ref: '0036388', date: '2026-10-20', amount: 3300 },
  { ref: '0036389', date: '2026-10-20', amount: 9200 },
  { ref: '0036390', date: '2026-10-20', amount: 9500 },
  { ref: '0036391', date: '2026-10-20', amount: 15730 },
  { ref: '0036392', date: '2026-10-20', amount: 3400 },
  { ref: '0036393', date: '2026-10-20', amount: 11100 },
  { ref: '0036394', date: '2026-10-20', amount: 31000 },
  { ref: '0036395', date: '2026-10-21', amount: 20100 },
  { ref: '0036396', date: '2026-10-21', amount: 20000 },
  { ref: '0036397', date: '2026-10-21', amount: 22100 },
  { ref: '0036398', date: '2026-10-22', amount: 9000 },
  { ref: '0036399', date: '2026-10-22', amount: 25000 },
  { ref: '0036400', date: '2026-10-22', amount: 15630 },
  { ref: '0036401', date: '2026-10-22', amount: 26600 },
  { ref: '0036402', date: '2026-10-22', amount: 20100 },
  { ref: '0036403', date: '2026-10-22', amount: 20000 },
  { ref: '0036404', date: '2026-10-22', amount: 20000 },
  { ref: '0036405', date: '2026-10-22', amount: 40100 },
  { ref: '0036406', date: '2026-10-23', amount: 4600 },
  { ref: '0036408', date: '2026-10-23', amount: 3300 },
  { ref: '0036410', date: '2026-10-23', amount: 49000 },
  { ref: '0036411', date: '2026-10-24', amount: 20000 },
  { ref: '0036412', date: '2026-10-24', amount: 15730 },
  { ref: '0036413', date: '2026-10-24', amount: 20100 },
  { ref: '0036414', date: '2026-10-24', amount: 3300 },
  { ref: '0036415', date: '2026-10-24', amount: 17100 },
  { ref: '0036416', date: '2026-10-24', amount: 16550 },
  { ref: '0036417', date: '2026-10-26', amount: 2100 },
  { ref: '0036418', date: '2026-10-26', amount: 33750 },
  { ref: '0036419', date: '2026-10-27', amount: 20000 },
  { ref: '0036420', date: '2026-10-27', amount: 4500 },
  { ref: '0036421', date: '2026-10-27', amount: 4600 },
  { ref: '0036422', date: '2026-10-27', amount: 20100 },
  { ref: '0036423', date: '2026-10-27', amount: 3300 },
  { ref: '0036424', date: '2026-10-27', amount: 41300 },
  { ref: '0036425', date: '2026-10-27', amount: 51500 },
  { ref: '0036426', date: '2026-10-27', amount: 20000 },
  { ref: '0036427', date: '2026-10-28', amount: 20000 },
  { ref: '0036428', date: '2026-10-28', amount: 80000 },
  { ref: '0036429', date: '2026-10-28', amount: 20000 },
  { ref: '0036430', date: '2026-10-28', amount: 31000 },
  { ref: '0036431', date: '2026-10-28', amount: 22350 },
  { ref: '0036432', date: '2026-10-29', amount: 15630 },
  { ref: '0036433', date: '2026-10-29', amount: 15730 },
  { ref: '0036434', date: '2026-10-29', amount: 3300 },
  { ref: '0036435', date: '2026-10-29', amount: 4500 },
  { ref: '0036436', date: '2026-10-29', amount: 20000 },
  { ref: '0036437', date: '2026-10-29', amount: 9200 },
  { ref: '0036439', date: '2026-10-30', amount: 3300 },
  { ref: '0036440', date: '2026-10-30', amount: 20100 },
  { ref: '0036441', date: '2026-10-30', amount: 2100 },
  { ref: '0036442', date: '2026-10-30', amount: 20100 },
  { ref: '0036444', date: '2026-10-30', amount: 20800 },
  { ref: '0036445', date: '2026-10-30', amount: 24000 },
  { ref: '0036446', date: '2026-10-31', amount: 3300 },
  { ref: '0036447', date: '2026-10-31', amount: 2200 },
  { ref: '0036448', date: '2026-10-31', amount: 4500 },
  { ref: '0036449', date: '2026-10-31', amount: 20100 },
  { ref: '0036450', date: '2026-10-31', amount: 22230 },
  { ref: '0036451', date: '2026-10-31', amount: 25900 }
];

const jemoSales: Sale[] = RAW_OCTOBER_JEMO_SALES.map((item, index) => {
  const isEarly = index < 30;
  const depositAmount = isEarly ? item.amount : (index % 5 === 0 ? item.amount * 0.5 : item.amount);
  const status = depositAmount === item.amount ? 'reconciled' : (depositAmount > 0 ? 'partial' : 'unreconciled');
  
  return {
    id: `sale-jemo-2026-10-${item.ref}`,
    shopId: 'jemo',
    shopName: 'Jemo Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: item.date,
    invoiceNumber: item.ref,
    salesAmount: item.amount,
    quantity: 1,
    unitPrice: item.amount,
    notes: `Daily Float sales - Ref #${item.ref}`,
    invoiceImages: [generateInvoiceSvg(item.ref, item.amount, item.date)],
    bankDeposits: depositAmount > 0 ? [
      {
        id: `dep-${item.ref}-1`,
        depositDate: item.date,
        amount: depositAmount,
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        refNumber: `CBE-${item.ref}`,
        imageUrl: generateDepositSvg('Commercial Bank of Ethiopia (CBE)', `CBE-${item.ref}`, depositAmount, item.date),
        uploadedAt: `${item.date}T16:00:00.000Z`,
        uploadedBy: 'Jemo Shop Manager'
      }
    ] : [],
    totalDeposited: depositAmount,
    depositDifference: item.amount - depositAmount,
    status: status,
    createdBy: 'jemo-manager',
    createdByName: 'Jemo Manager',
    createdAt: `${item.date}T10:00:00.000Z`,
    updatedAt: `${item.date}T10:00:00.000Z`
  };
});

// Seed sales for Adama Main operational branches (Adama, Hawassa, Borena, Bale, Assela)
const adamaBranchSales: Sale[] = [
  // Adama Shop sales
  {
    id: 'sale-adama-101',
    shopId: 'adama',
    shopName: 'Adama Shop',
    districtId: 'adama-d1',
    districtName: 'District 1',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-02',
    invoiceNumber: 'ADM-004120',
    salesAmount: 450000,
    quantity: 1,
    unitPrice: 450000,
    invoiceImages: [generateInvoiceSvg('ADM-004120', 450000, '2026-10-02')],
    bankDeposits: [
      {
        id: 'dep-adm-1',
        depositDate: '2026-10-02',
        amount: 450000,
        bankName: 'CBE',
        refNumber: 'CBE-ADM-1',
        imageUrl: generateDepositSvg('CBE', 'CBE-ADM-1', 450000, '2026-10-02'),
        uploadedAt: '2026-10-02T12:00:00Z',
        uploadedBy: 'Adama Manager'
      }
    ],
    totalDeposited: 450000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'adama-manager',
    createdByName: 'Adama Manager',
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-02T10:00:00Z'
  },
  {
    id: 'sale-adama-102',
    shopId: 'adama',
    shopName: 'Adama Shop',
    districtId: 'adama-d2',
    districtName: 'District 2',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-15',
    invoiceNumber: 'ADM-004121',
    salesAmount: 380000,
    quantity: 1,
    unitPrice: 380000,
    invoiceImages: [generateInvoiceSvg('ADM-004121', 380000, '2026-10-15')],
    bankDeposits: [
      {
        id: 'dep-adm-2',
        depositDate: '2026-10-15',
        amount: 380000,
        bankName: 'CBE',
        refNumber: 'CBE-ADM-2',
        imageUrl: generateDepositSvg('CBE', 'CBE-ADM-2', 380000, '2026-10-15'),
        uploadedAt: '2026-10-15T12:00:00Z',
        uploadedBy: 'Adama Manager'
      }
    ],
    totalDeposited: 380000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'adama-manager',
    createdByName: 'Adama Manager',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  // Hawassa Shop sales
  {
    id: 'sale-hawassa-201',
    shopId: 'hawassa',
    shopName: 'Hawassa Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-05',
    invoiceNumber: 'HAW-001092',
    salesAmount: 520000,
    quantity: 1,
    unitPrice: 520000,
    invoiceImages: [generateInvoiceSvg('HAW-001092', 520000, '2026-10-05')],
    bankDeposits: [
      {
        id: 'dep-haw-1',
        depositDate: '2026-10-05',
        amount: 520000,
        bankName: 'Awash Bank',
        refNumber: 'AW-HAW-1',
        imageUrl: generateDepositSvg('Awash Bank', 'AW-HAW-1', 520000, '2026-10-05'),
        uploadedAt: '2026-10-05T14:00:00Z',
        uploadedBy: 'Hawassa Manager'
      }
    ],
    totalDeposited: 520000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'hawassa-manager',
    createdByName: 'Hawassa Manager',
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z'
  },
  // Borena Shop sales
  {
    id: 'sale-borena-301',
    shopId: 'borena',
    shopName: 'Borena Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-10',
    invoiceNumber: 'BOR-000451',
    salesAmount: 290000,
    quantity: 1,
    unitPrice: 290000,
    invoiceImages: [generateInvoiceSvg('BOR-000451', 290000, '2026-10-10')],
    bankDeposits: [
      {
        id: 'dep-bor-1',
        depositDate: '2026-10-10',
        amount: 290000,
        bankName: 'CBE',
        refNumber: 'CBE-BOR-1',
        imageUrl: generateDepositSvg('CBE', 'CBE-BOR-1', 290000, '2026-10-10'),
        uploadedAt: '2026-10-10T11:00:00Z',
        uploadedBy: 'Borena Manager'
      }
    ],
    totalDeposited: 290000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'borena-manager',
    createdByName: 'Borena Manager',
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z'
  },
  // Bale Shop sales
  {
    id: 'sale-bale-401',
    shopId: 'bale',
    shopName: 'Bale Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-12',
    invoiceNumber: 'BAL-000782',
    salesAmount: 310000,
    quantity: 1,
    unitPrice: 310000,
    invoiceImages: [generateInvoiceSvg('BAL-000782', 310000, '2026-10-12')],
    bankDeposits: [
      {
        id: 'dep-bal-1',
        depositDate: '2026-10-12',
        amount: 310000,
        bankName: 'CBE',
        refNumber: 'CBE-BAL-1',
        imageUrl: generateDepositSvg('CBE', 'CBE-BAL-1', 310000, '2026-10-12'),
        uploadedAt: '2026-10-12T15:00:00Z',
        uploadedBy: 'Bale Manager'
      }
    ],
    totalDeposited: 310000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'bale-manager',
    createdByName: 'Bale Manager',
    createdAt: '2026-10-12T10:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z'
  },
  // Assela Shop sales
  {
    id: 'sale-assela-501',
    shopId: 'assela',
    shopName: 'Assela Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-18',
    invoiceNumber: 'ASS-000913',
    salesAmount: 260000,
    quantity: 1,
    unitPrice: 260000,
    invoiceImages: [generateInvoiceSvg('ASS-000913', 260000, '2026-10-18')],
    bankDeposits: [
      {
        id: 'dep-ass-1',
        depositDate: '2026-10-18',
        amount: 260000,
        bankName: 'Telebirr',
        refNumber: 'TB-ASS-1',
        imageUrl: generateDepositSvg('Telebirr', 'TB-ASS-1', 260000, '2026-10-18'),
        uploadedAt: '2026-10-18T16:00:00Z',
        uploadedBy: 'Assela Manager'
      }
    ],
    totalDeposited: 260000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'assela-manager',
    createdByName: 'Assela Manager',
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-10-18T11:00:00Z'
  },
  // Shashemene Shop sales (Excluded from Adama Main)
  {
    id: 'sale-shashemene-601',
    shopId: 'shashemene',
    shopName: 'Shashemene Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-08',
    invoiceNumber: 'SHA-000301',
    salesAmount: 340000,
    quantity: 1,
    unitPrice: 340000,
    invoiceImages: [],
    bankDeposits: [
      {
        id: 'dep-sha-1',
        depositDate: '2026-10-08',
        amount: 340000,
        bankName: 'CBE',
        refNumber: 'CBE-SHA-1',
        uploadedAt: '2026-10-08T12:00:00Z',
        uploadedBy: 'Shashemene Manager'
      }
    ],
    totalDeposited: 340000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'shashemene-manager',
    createdByName: 'Shashemene Manager',
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-08T09:00:00Z'
  },
  // Chiro Shop sales (Excluded from Adama Main)
  {
    id: 'sale-chiro-701',
    shopId: 'chiro',
    shopName: 'Chiro Shop',
    productId: 'float',
    productName: 'FLOAT',
    monthKey: '2026-10',
    salesDate: '2026-10-14',
    invoiceNumber: 'CHR-000512',
    salesAmount: 280000,
    quantity: 1,
    unitPrice: 280000,
    invoiceImages: [],
    bankDeposits: [
      {
        id: 'dep-chr-1',
        depositDate: '2026-10-14',
        amount: 280000,
        bankName: 'CBE',
        refNumber: 'CBE-CHR-1',
        uploadedAt: '2026-10-14T11:00:00Z',
        uploadedBy: 'Chiro Manager'
      }
    ],
    totalDeposited: 280000,
    depositDifference: 0,
    status: 'reconciled',
    createdBy: 'chiro-manager',
    createdByName: 'Chiro Manager',
    createdAt: '2026-10-14T10:00:00Z',
    updatedAt: '2026-10-14T10:00:00Z'
  }
];

export const INITIAL_SALES: Sale[] = [...jemoSales, ...adamaBranchSales];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-brook',
    email: 'brookaklilu33@gmail.com',
    displayName: 'Brook Aklilu (Superadmin)',
    role: 'superadmin',
    shopIds: ['adama_main', 'adama', 'hawassa', 'borena', 'bale', 'assela', 'shashemene', 'chiro', 'jemo'],
    status: 'active',
    preferredLanguage: 'en',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user-jemo-manager',
    email: 'jemo.manager@moderntechethiopia.com',
    displayName: 'Abebe (Jemo Manager)',
    role: 'shop_manager',
    shopIds: ['jemo'],
    status: 'active',
    preferredLanguage: 'am',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user-adama-manager',
    email: 'adama.manager@moderntechethiopia.com',
    displayName: 'Tadesse (Adama Manager)',
    role: 'shop_manager',
    shopIds: ['adama'],
    districtIds: ['adama-d1', 'adama-d2', 'adama-d3', 'adama-d4'],
    status: 'active',
    preferredLanguage: 'om',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user-hawassa-manager',
    email: 'hawassa.manager@moderntechethiopia.com',
    displayName: 'Dawit (Hawassa Manager)',
    role: 'shop_manager',
    shopIds: ['hawassa'],
    status: 'active',
    preferredLanguage: 'am',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'user-chiro-manager',
    email: 'chiro.manager@moderntechethiopia.com',
    displayName: 'Kedir (Chiro Manager)',
    role: 'shop_manager',
    shopIds: ['chiro'],
    status: 'active',
    preferredLanguage: 'om',
    createdAt: '2026-10-01T00:00:00.000Z'
  }
];
