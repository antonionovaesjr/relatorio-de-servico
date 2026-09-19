export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
}

export function formatMonthLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function calculateServiceYear(monthKey: string): number {
  const { year, month } = parseMonthKey(monthKey);
  // O Ano de Serviço inicia em Setembro (mês 9).
  // Exemplo: Setembro/2026 até Agosto/2027 pertence ao Ano de Serviço 2027.
  return month >= 9 ? year + 1 : year;
}

export function navigateMonthKey(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1 + delta, 1);
  return getMonthKey(date);
}

export function getServiceYearMonths(serviceYear: number): string[] {
  const baseYear = serviceYear - 1;
  const months: string[] = [];

  for (let m = 9; m <= 12; m++) {
    months.push(`${baseYear}-${String(m).padStart(2, '0')}`);
  }
  for (let m = 1; m <= 8; m++) {
    months.push(`${serviceYear}-${String(m).padStart(2, '0')}`);
  }

  return months;
}

// Helpers para lançamentos diários
export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function deriveMonthKeyFromDate(dateStr: string): string {
  // dateStr é esperado no formato "YYYY-MM-DD"
  return dateStr.slice(0, 7);
}

export function calculateServiceYearFromDate(dateStr: string): number {
  const monthKey = deriveMonthKeyFromDate(dateStr);
  return calculateServiceYear(monthKey);
}

export function formatDailyDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function formatHoursDecimal(hours: number, minutes = 0): string {
  const totalMinutes = Math.round(hours * 60) + minutes;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes || 0));
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function parseHHMMToMinutes(value: string): number {
  const result = tryParseTimeToMinutes(value);
  return result.isValid ? result.minutes : 0;
}

export function tryParseTimeToMinutes(value: string): { minutes: number; isValid: boolean } {
  if (!value) return { minutes: 0, isValid: true };
  const trimmed = value.trim();
  if (trimmed === '') return { minutes: 0, isValid: true };

  // Formato HH:MM
  if (trimmed.includes(':')) {
    const [hStr, mStr] = trimmed.split(':');
    if (hStr.trim() === '' && mStr.trim() === '') return { minutes: 0, isValid: false };
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m) || m < 0 || m >= 60 || h < 0) {
      return { minutes: 0, isValid: false };
    }
    return { minutes: h * 60 + m, isValid: true };
  }

  // Formato Decimal (com ponto ou vírgula, ex: 4.25 ou 4,25)
  const normalized = trimmed.replace(',', '.');
  const num = parseFloat(normalized);
  if (!isNaN(num) && num >= 0) {
    return { minutes: Math.round(num * 60), isValid: true };
  }

  return { minutes: 0, isValid: false };
}


