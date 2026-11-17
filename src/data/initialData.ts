import { InventoryItem, KhataCustomer } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateStringDaysAgo(daysAgo: number, baseDateStr?: string): string {
  const base = baseDateStr ? parseLocalDate(baseDateStr) : new Date();
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const INITIAL_BUDGET = 7000;
export const SAVED_THIS_MONTH = 1240;
export const UPI_CASH_IN_TODAY = 6420;
export const INITIAL_CASH_POSITION = 16000;

export function createInitialItems(today: string): InventoryItem[] {
  return [
    {
      id: 'atta',
      officialName: 'Aashirvaad Atta 5kg',
      alias: 'atta',
      category: 'staples',
      dailySales: 4,
      buyPrice: 230,
      shelfLifeDays: 120,
      distributor: 'Sharma Traders',
      batches: [
        {
          id: 'atta-b1',
          qty: 8,
          boughtDate: dateStringDaysAgo(4, today),
          buyPrice: 230,
        },
      ],
    },
    {
      id: 'tel',
      officialName: 'Fortune Oil 1L',
      alias: 'tel',
      category: 'staples',
      dailySales: 5,
      buyPrice: 135,
      shelfLifeDays: 365,
      distributor: 'Sharma Traders',
      batches: [
        {
          id: 'tel-b1',
          qty: 10,
          boughtDate: dateStringDaysAgo(3, today),
          buyPrice: 135,
        },
      ],
    },
    {
      id: 'cheeni',
      officialName: 'Tata Sugar 1kg',
      alias: 'cheeni',
      category: 'staples',
      dailySales: 6,
      buyPrice: 44,
      shelfLifeDays: 365,
      distributor: 'Sharma Traders',
      batches: [
        {
          id: 'cheeni-b1',
          qty: 15,
          boughtDate: dateStringDaysAgo(5, today),
          buyPrice: 44,
        },
      ],
    },
    {
      id: 'namak',
      officialName: 'Tata Salt 1kg',
      alias: 'namak',
      category: 'staples',
      dailySales: 2,
      buyPrice: 28,
      shelfLifeDays: 365,
      distributor: 'Sharma Traders',
      batches: [
        {
          id: 'namak-b1',
          qty: 20,
          boughtDate: dateStringDaysAgo(9, today),
          buyPrice: 28,
        },
      ],
    },
    {
      id: 'chai-patti',
      officialName: 'Tata Tea 250g',
      alias: 'chai patti',
      category: 'staples',
      dailySales: 2,
      buyPrice: 115,
      shelfLifeDays: 270,
      distributor: 'Gupta Distributors',
      batches: [
        {
          id: 'chai-b1',
          qty: 6,
          boughtDate: dateStringDaysAgo(8, today),
          buyPrice: 115,
        },
      ],
    },
    {
      id: 'biscuit',
      officialName: 'Parle-G 10 rupee',
      alias: '10 wala biscuit',
      category: 'biscuits',
      dailySales: 6,
      buyPrice: 8,
      shelfLifeDays: 180,
      distributor: 'Gupta Distributors',
      batches: [
        {
          id: 'biscuit-b1',
          qty: 30,
          boughtDate: dateStringDaysAgo(70, today),
          buyPrice: 8,
        },
        {
          id: 'biscuit-b2',
          qty: 40,
          boughtDate: dateStringDaysAgo(6, today),
          buyPrice: 8,
        },
      ],
    },
    {
      id: 'cake',
      officialName: 'Britannia Cake',
      alias: 'cake',
      category: 'snacks',
      dailySales: 1,
      buyPrice: 20,
      shelfLifeDays: 90,
      distributor: 'Gupta Distributors',
      batches: [
        {
          id: 'cake-b1',
          qty: 12,
          boughtDate: dateStringDaysAgo(62, today),
          buyPrice: 20,
        },
        {
          id: 'cake-b2',
          qty: 24,
          boughtDate: dateStringDaysAgo(3, today),
          buyPrice: 20,
        },
      ],
    },
    {
      id: 'namkeen',
      officialName: 'Haldiram Namkeen 400g',
      alias: 'namkeen',
      category: 'snacks',
      dailySales: 0.5,
      buyPrice: 110,
      shelfLifeDays: 90,
      distributor: 'Gupta Distributors',
      batches: [
        {
          id: 'namkeen-b1',
          qty: 10,
          boughtDate: dateStringDaysAgo(55, today),
          buyPrice: 110,
        },
        {
          id: 'namkeen-b2',
          qty: 10,
          boughtDate: dateStringDaysAgo(2, today),
          buyPrice: 110,
        },
      ],
    },
    {
      id: 'horlicks',
      officialName: 'Horlicks 500g',
      alias: 'horlicks',
      category: 'health drink',
      dailySales: 0.1,
      buyPrice: 260,
      shelfLifeDays: 180,
      distributor: 'Gupta Distributors',
      batches: [
        {
          id: 'horlicks-b1',
          qty: 6,
          boughtDate: dateStringDaysAgo(100, today),
          buyPrice: 260,
        },
        {
          id: 'horlicks-b2',
          qty: 8,
          boughtDate: dateStringDaysAgo(4, today),
          buyPrice: 260,
        },
      ],
    },
  ];
}

export const INITIAL_KHATA_CUSTOMERS: KhataCustomer[] = [
  { id: 'c1', name: 'Ramesh', amount: 6200, tag: 'Pays on time' },
  { id: 'c2', name: 'Sunita', amount: 5800, tag: 'Usually late' },
  { id: 'c3', name: 'Imran', amount: 4100, tag: 'Uncertain' },
  { id: 'c4', name: 'Meena', amount: 2400, tag: 'Pays on time' },
];
