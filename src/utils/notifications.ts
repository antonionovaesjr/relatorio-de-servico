import type { UserSettings } from '../types/models';
import { todayDateString } from './date';

/**
 * Verifica se a data atual está no período de "final do mês"
 * (últimos 3 dias do mês vigente ou dia 1º do mês seguinte).
 */
export function isEndOfMonth(targetDate: Date = new Date()): boolean {
  const day = targetDate.getDate();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  // Último dia do mês atual
  const lastDay = new Date(year, month + 1, 0).getDate();

  return day >= lastDay - 2 || day === 1;
}

/**
 * Solicita permissão para notificações web nativas
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Dispara notificação nativa de lembrete de fim de mês
 */
export async function triggerEndOfMonthNotification(
  title: string,
  body: string
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body,
    icon: '/relatorio-servicos/icon-192.png',
    badge: '/relatorio-servicos/icon-192.png',
    tag: 'end-of-month-report-reminder',
  };

  // Se o Service Worker estiver disponível, usa showNotification para compatibilidade mobile PWA
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return;
      }
    } catch {
      // Fallback para Notification construtor padrão
    }
  }

  try {
    new Notification(title, options);
  } catch {
    // Silencia se o navegador não permitir new Notification()
  }
}

/**
 * Checa regras e executa o lembrete de envio de relatório no fim do mês
 */
export async function checkAndTriggerEndOfMonthReminder(
  settings: UserSettings,
  t: (key: string) => string
): Promise<boolean> {
  if (!settings.remindReportEndOfMonth) {
    return false;
  }

  if (!isEndOfMonth()) {
    return false;
  }

  const today = todayDateString();
  const lastReminderDate = localStorage.getItem('last_report_reminder_date');

  // Já foi lembrado hoje
  if (lastReminderDate === today) {
    return false;
  }

  // Dispara a notificação se tiver permissão
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    await triggerEndOfMonthNotification(
      t('settings.endOfMonthNoticeTitle'),
      t('settings.endOfMonthNoticeBody')
    );
  }

  localStorage.setItem('last_report_reminder_date', today);
  return true;
}
