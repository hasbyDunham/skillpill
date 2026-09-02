import { Language } from './translations';

const categoryID: Record<string, string> = {
  all: 'Semua',
  leadership: 'Kepemimpinan',
  'sales & negotiation': 'Penjualan & Negosiasi',
  sales: 'Penjualan',
  negotiation: 'Negosiasi',
  marketing: 'Pemasaran',
  productivity: 'Produktivitas',
  communication: 'Komunikasi',
  finance: 'Keuangan',
  technology: 'Teknologi',
  management: 'Manajemen',
  business: 'Bisnis',
  creativity: 'Kreativitas',
};

const difficultyID: Record<string, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Mahir',
  easy: 'Mudah',
  medium: 'Menengah',
  hard: 'Sulit',
};

export function localizeCategory(value: string = '', lang: Language) {
  if (lang === 'EN') return value;
  return categoryID[value.trim().toLowerCase()] || value;
}

export function localizeDifficulty(value: string = '', lang: Language) {
  if (lang === 'EN') return value;
  return difficultyID[value.trim().toLowerCase()] || value;
}

export function localizeDuration(value: string = '', lang: Language) {
  if (lang === 'EN') return value;
  return value
    .replace(/\bminutes?\b/gi, 'menit')
    .replace(/\bmins?\b/gi, 'menit')
    .replace(/\bhours?\b/gi, 'jam')
    .replace(/\bhrs?\b/gi, 'jam');
}

const LEGACY_USD_TO_IDR = 15_000;

export function rupiahAmount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value <= 1_000 ? Math.round(value * LEGACY_USD_TO_IDR) : Math.round(value);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(rupiahAmount(value));
}

export function convertDollarTextToRupiah(value: string) {
  return value.replace(/\$([\d,.]+)\s*([kKmM])?/g, (_match, raw: string, suffix?: string) => {
    const normalized = raw.includes(',') && raw.includes('.')
      ? raw.replace(/,/g, '')
      : raw.replace(/,/g, '');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return _match;
    const multiplier = suffix?.toLowerCase() === 'm' ? 1_000_000 : suffix?.toLowerCase() === 'k' ? 1_000 : 1;
    return formatRupiah(parsed * multiplier);
  }).replace(/\ba dollar\b/gi, 'any rupiah').replace(/\bdollars?\b/gi, 'rupiah');
}

export function convertDollarTextDeep<T>(value: T): T {
  if (typeof value === 'string') return convertDollarTextToRupiah(value) as T;
  if (Array.isArray(value)) return value.map((item) => convertDollarTextDeep(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, convertDollarTextDeep(item)])
    ) as T;
  }
  return value;
}
