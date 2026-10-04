import type { MonthlyReport, UserSettings, DailyEntry } from '../types/models';
import { formatMonthLabel } from './date';

export interface ShareReportOptions {
  report: MonthlyReport;
  settings?: UserSettings | null;
  dailyEntries?: DailyEntry[];
}

export function compileReportShareText(options: ShareReportOptions): string {
  const { report, settings, dailyEntries } = options;
  const publisherName = settings?.publisherName?.trim()
    ? ` - ${settings.publisherName.trim()}`
    : '';

  const formattedMonth = formatMonthLabel(report.monthKey);
  const capitalizedMonth =
    formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Cálculo de designação teocrática
  const isPublisher = !settings?.role || settings.role === 'publisher';
  let roleLine = '';
  if (isPublisher) {
    roleLine = `• Pioneiro auxiliar: ${report.isAuxiliaryPioneer ? `Sim${report.hasReducedRequirement ? ' (50% — mês especial)' : ''}` : 'Não'}\n`;
  } else if (settings.role === 'auxiliary_pioneer') {
    roleLine = `• Pioneiro auxiliar: Sim\n`;
  } else if (settings.role === 'regular_pioneer') {
    roleLine = `• Pioneiro regular: Sim\n`;
    if (report.creditHours && report.creditHours > 0) {
      roleLine += `• Crédito de horas: ${report.creditHours}h\n`;
    }
  }
  const hoursLine =
    report.hours !== null && report.hours !== undefined
      ? `Horas: ${report.hours}`
      : 'Horas: -';

  // Agregação iterativa dos registros diários no IndexedDB
  const dailySum = (dailyEntries || []).reduce(
    (acc, cur) => acc + (cur.bibleStudies || 0),
    0
  );
  const dailyMax = (dailyEntries || []).reduce(
    (acc, cur) => Math.max(acc, cur.bibleStudies || 0),
    0
  );
  const totalStudies = Math.max(
    report.bibleStudies ?? 0,
    dailySum,
    dailyMax
  );

  const studiesLine = `Total de estudos: ${totalStudies}`;

  const notesLine = report.notes?.trim()
    ? `\n\nObservações:\n${report.notes.trim()}`
    : '';

  return (
    `📋 *Relatório de Ministério${publisherName}*\n` +
    `📅 *Mês:* ${capitalizedMonth}\n` +
    roleLine +
    `• ${hoursLine}\n` +
    `• ${studiesLine}` +
    notesLine
  );
}

export async function shareReportData(
  options: ShareReportOptions
): Promise<{ success: boolean; method: 'share' | 'clipboard' | 'failed' }> {
  const text = compileReportShareText(options);
  const formattedMonth = formatMonthLabel(options.report.monthKey);
  const title = `Relatório de Ministério - ${formattedMonth}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return { success: true, method: 'share' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'share' };
      }
      // Se falhar o share nativo, faz fallback para área de transferência
    }
  }

  // Fallback para Clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    } catch {
      return { success: false, method: 'failed' };
    }
  }

  return { success: false, method: 'failed' };
}
