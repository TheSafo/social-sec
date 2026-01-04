export const formatMoney = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

export const formatCurrency = (value: number): string => `$${formatMoney(value)}`;

export const parseNumber = (value: string | number | null | undefined): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseCurrency = (value: string | number | null | undefined): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const normalized = String(value).replace(/[^0-9.]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
