import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  User,
  Award,
  MapPin,
  CheckCircle2,
  Hourglass,
} from 'lucide-react';

import { db, useUserSettings } from '../../db/db';
import {
  calculateServiceYear,
  getServiceYearMonths,
  formatMonthLabel,
  getMonthKey,
  formatMinutesToHHMM,
  calculateRemainingMonthlyTime,
} from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';
import { isEndOfMonth, checkAndTriggerEndOfMonthReminder } from '../../utils/notifications';
import { formatFullAddress, getGoogleMapsUrl } from '../../utils/geolocation';
import type { ReturnVisit } from '../../types/models';

interface HomeViewProps {
  onGoToMonth: (monthKey: string) => void;
  onGoToVisits: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onGoToMonth, onGoToVisits }) => {
  const { t, locale } = useTranslation();
  const currentMonthKey = getMonthKey(new Date());
  const currentServiceYear = calculateServiceYear(currentMonthKey);

  const settings = useUserSettings();
  const allReports = useLiveQuery(() => db.monthlyReports.toArray(), []);
  const allDailyEntries = useLiveQuery(() => db.dailyEntries.toArray(), []);
  const allReturnVisits = useLiveQuery(() => db.returnVisits.toArray(), []);

  // Lançamentos diários do ano de serviço atual (Setembro a Agosto)
  const serviceYearDailyEntries = useMemo(() => {
    if (!allDailyEntries) return [];
    return allDailyEntries.filter((e) => e.serviceYear === currentServiceYear);
  }, [allDailyEntries, currentServiceYear]);

  // Relatórios mensais do ano de serviço atual
  const serviceYearReports = useMemo(() => {
    if (!allReports) return [];
    return allReports.filter((r) => r.serviceYear === currentServiceYear);
  }, [allReports, currentServiceYear]);

  // Relatório do mês atual vigente
  const currentMonthReport = useLiveQuery(
    () => db.monthlyReports.get(currentMonthKey),
    [currentMonthKey]
  );

  // Identificação dos papéis teocráticos
  const isRegularPioneer = settings.role === 'regular_pioneer';
  const isAuxiliaryPioneer =
    settings.role === 'auxiliary_pioneer' || Boolean(currentMonthReport?.isAuxiliaryPioneer);

  // Total de minutos de ministério no ano de serviço (inclui créditos para pioneiro regular)
  const totalMinutes = useMemo(() => {
    const dailyMins = serviceYearDailyEntries.reduce(
      (acc, cur) => acc + (cur.hours * 60 + (cur.minutes || 0)),
      0
    );
    const reportsMins = serviceYearReports.reduce((acc, cur) => acc + Math.round((cur.hours ?? 0) * 60), 0);
    const baseMins = Math.max(dailyMins, reportsMins);
    if (isRegularPioneer) {
      const creditMins = serviceYearReports.reduce((acc, cur) => acc + (cur.creditHours || 0) * 60, 0);
      return baseMins + creditMins;
    }
    return baseMins;
  }, [serviceYearDailyEntries, serviceYearReports, isRegularPioneer]);

  // Total de estudos no ano de serviço
  const totalStudies = useMemo(() => {
    const dailyStudiesTotal = serviceYearDailyEntries.reduce(
      (acc, cur) => acc + (cur.bibleStudies || 0),
      0
    );
    const reportsStudiesTotal = serviceYearReports.reduce(
      (acc, cur) => acc + (cur.bibleStudies ?? 0),
      0
    );
    return Math.max(dailyStudiesTotal, reportsStudiesTotal);
  }, [serviceYearDailyEntries, serviceYearReports]);

  // Dias de campo distintos no ano
  const distinctDaysCount = useMemo(() => {
    const days = new Set(serviceYearDailyEntries.map((e) => e.date));
    return days.size;
  }, [serviceYearDailyEntries]);

  // Registros do mês atual vigente
  const currentMonthDailyEntries = useMemo(() => {
    return serviceYearDailyEntries.filter((e) => e.monthKey === currentMonthKey);
  }, [serviceYearDailyEntries, currentMonthKey]);

  const currentMonthMinutes = useMemo(() => {
    const dailyMins = currentMonthDailyEntries.reduce(
      (acc, cur) => acc + (cur.hours * 60 + (cur.minutes || 0)),
      0
    );
    const repMins = Math.round((currentMonthReport?.hours ?? 0) * 60);
    const baseMins = Math.max(dailyMins, repMins);
    if (isRegularPioneer && currentMonthReport?.creditHours) {
      return baseMins + (currentMonthReport.creditHours * 60);
    }
    return baseMins;
  }, [currentMonthDailyEntries, currentMonthReport, isRegularPioneer]);

  // Metas do Pioneiro Regular (Ano de serviço e Mês atual)
  const regularMonthlyTarget = settings.regularPioneerConfig?.monthlyTargetHours || 50;
  const regularAnnualTargetHours = regularMonthlyTarget * 12;
  const regularAnnualTargetMinutes = regularAnnualTargetHours * 60;
  const regularRemainingMinutes = Math.max(0, regularAnnualTargetMinutes - totalMinutes);
  const regularProgressPercent =
    regularAnnualTargetMinutes > 0
      ? Math.min(100, Math.round((totalMinutes / regularAnnualTargetMinutes) * 100))
      : 100;

  // Cálculo da Meta Mensal do Pioneiro Regular
  const regularMonthlyCalculation = useMemo(() => {
    return calculateRemainingMonthlyTime(regularMonthlyTarget, currentMonthMinutes);
  }, [regularMonthlyTarget, currentMonthMinutes]);

  // Metas do Pioneiro Auxiliar (Baseado no mês atual vigente)
  const auxMonthlyTargetHours = currentMonthReport?.hasReducedRequirement
    ? 15
    : settings.auxiliaryPioneerConfig?.monthlyTargetHours || 30;

  const auxMonthlyCalculation = useMemo(() => {
    return calculateRemainingMonthlyTime(auxMonthlyTargetHours, currentMonthMinutes);
  }, [auxMonthlyTargetHours, currentMonthMinutes]);

  // Texto do componente "Faltam" no resumo
  const faltamDisplay = useMemo(() => {
    if (isRegularPioneer) {
      return `${regularMonthlyCalculation.formattedRemaining} ${t('home.remaining').toLowerCase()}`;
    }
    if (isAuxiliaryPioneer) {
      return `${auxMonthlyCalculation.formattedRemaining} ${t('home.remaining').toLowerCase()}`;
    }
    // Para publicador sem requisito: informação abreviada N/A
    return t('common.na');
  }, [isRegularPioneer, isAuxiliaryPioneer, regularMonthlyCalculation.formattedRemaining, auxMonthlyCalculation.formattedRemaining, t]);

  // Meses do ano de serviço
  const monthsInServiceYear = useMemo(() => {
    return getServiceYearMonths(currentServiceYear);
  }, [currentServiceYear]);

  // Mapa de minutos por mês para o gráfico
  const monthlyMinutesMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthsInServiceYear.forEach((m) => {
      map[m] = 0;
    });

    serviceYearDailyEntries.forEach((e) => {
      if (map[e.monthKey] !== undefined) {
        map[e.monthKey] += e.hours * 60 + (e.minutes || 0);
      }
    });

    serviceYearReports.forEach((r) => {
      if (map[r.monthKey] !== undefined) {
        const repMins = Math.round((r.hours ?? 0) * 60);
        if (repMins > map[r.monthKey]) {
          map[r.monthKey] = repMins;
        }
        if (isRegularPioneer && r.creditHours) {
          map[r.monthKey] += r.creditHours * 60;
        }
      }
    });

    return map;
  }, [monthsInServiceYear, serviceYearDailyEntries, serviceYearReports, isRegularPioneer]);

  // Máximo de minutos para escala das barras
  const maxBarMinutes = useMemo(() => {
    const vals = Object.values(monthlyMinutesMap);
    return Math.max(...vals, 60 * 10);
  }, [monthlyMinutesMap]);

  // Próxima revisita pendente
  const nextVisit = useMemo(() => {
    if (!allReturnVisits) return null;
    const pending = allReturnVisits
      .filter((v) => !v.isCompleted)
      .sort((a, b) => {
        const da = a.scheduledDate || a.lastVisitDate || '';
        const db = b.scheduledDate || b.lastVisitDate || '';
        return da.localeCompare(db);
      });
    return pending[0] || null;
  }, [allReturnVisits]);

  // Formatação da designação
  const roleLabel = useMemo(() => {
    switch (settings.role) {
      case 'regular_pioneer':
        return t('roles.regular');
      case 'auxiliary_pioneer':
        return t('roles.auxiliary');
      default:
        return t('roles.publisher');
    }
  }, [settings.role, t]);

  const handleOpenMaps = (visit: ReturnVisit) => {
    triggerHaptic(8);
    window.open(getGoogleMapsUrl(visit), '_blank', 'noopener,noreferrer');
  };

  // Dispara lembrete automático de final de mês se configurado
  React.useEffect(() => {
    if (settings.remindReportEndOfMonth !== false) {
      checkAndTriggerEndOfMonthReminder(settings, t);
    }
  }, [settings, t]);

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* 📋 Lembrete de Envio do Relatório no Final do Mês */}
      {settings.remindReportEndOfMonth !== false && isEndOfMonth() && (
        <section className="bg-[#E8EEF8] dark:bg-[#172554] border border-[#001E62]/30 dark:border-[#3B82F6]/50 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD]">
                {t('settings.endOfMonthNoticeTitle')}
              </h3>
              <p className="text-[11px] text-[#5C6B7E] dark:text-[#CBD5E1] mt-0.5 leading-snug">
                {t('settings.endOfMonthNoticeBody')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              onGoToMonth(currentMonthKey);
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#001E62] hover:bg-[#001545] dark:bg-[#1D4ED8] dark:hover:bg-[#2563EB] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            {t('nav.reports')}
          </button>
        </section>
      )}

      {/* 👤 CARD PRINCIPAL: PERFIL & RESUMO DO ANO DE SERVIÇO */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-3">
        {/* Perfil */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              {settings.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#001E62] dark:border-[#3B82F6]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#001E62] dark:bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-base border-2 border-[#001E62] dark:border-[#3B82F6]">
                  {settings.publisherName ? settings.publisherName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#3B82F6] border-2 border-white dark:border-[#111A29]" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-[#0A111E] dark:text-[#F8FAFC] leading-tight">
                {settings.publisherName?.trim() || t('roles.publisher')}
              </h1>
              <div className="flex items-center gap-1 text-xs text-[#001E62] dark:text-[#93C5FD] font-semibold mt-0.5">
                <Award className="w-3.5 h-3.5" />
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#5C6B7E] dark:text-[#CBD5E1]">
            {t('home.annualShort', { year: currentServiceYear })}
          </span>
        </div>

        {/* Subcard Resumo dos relatórios do ano */}
        <div className="bg-[#F4F6F9] dark:bg-[#0B1320] p-3 rounded-xl border border-[#DDE3EA] dark:border-[#202E42] space-y-2">
          <div className="text-[11px] font-bold text-[#5C6B7E] dark:text-[#CBD5E1] uppercase tracking-wider pb-1.5 border-b border-[#DDE3EA] dark:border-[#202E42] flex items-center justify-between">
            <span>📅 {currentServiceYear} — {t('home.annualSummary')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Estudos */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111A29] rounded-lg border border-[#DDE3EA] dark:border-[#1F2E44]">
              <span className="text-base">📚</span>
              <div>
                <span className="text-[10px] text-[#5C6B7E] dark:text-[#94A3B8] block leading-none">{t('home.studies')}</span>
                <span className="font-bold text-[#0A111E] dark:text-[#F8FAFC]">{t('home.studiesCount', { count: totalStudies })}</span>
              </div>
            </div>

            {/* Horas */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111A29] rounded-lg border border-[#DDE3EA] dark:border-[#1F2E44]">
              <span className="text-base">⏰</span>
              <div>
                <span className="text-[10px] text-[#5C6B7E] dark:text-[#94A3B8] block leading-none">{t('home.hours')}</span>
                <span className="font-bold text-[#001E62] dark:text-[#60A5FA]">
                  {formatMinutesToHHMM(totalMinutes)} h
                </span>
              </div>
            </div>

            {/* Dias de campo */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111A29] rounded-lg border border-[#DDE3EA] dark:border-[#1F2E44]">
              <span className="text-base">📝</span>
              <div>
                <span className="text-[10px] text-[#5C6B7E] dark:text-[#94A3B8] block leading-none">{t('home.days')}</span>
                <span className="font-bold text-[#0A111E] dark:text-[#F8FAFC]">{t('home.daysCount', { count: distinctDaysCount })}</span>
              </div>
            </div>

            {/* Faltam (Cálculo no mês vigente para pioneiro aux. e N/A para publicador) */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#111A29] rounded-lg border border-[#DDE3EA] dark:border-[#1F2E44]">
              <span className="text-base">🎯</span>
              <div>
                <span className="text-[10px] text-[#5C6B7E] dark:text-[#94A3B8] block leading-none">{t('home.remaining')}</span>
                <span className="font-bold text-[#001E62] dark:text-[#60A5FA]">
                  {faltamDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 PROGRESSO DA DESIGNAÇÃO — Dual-Bar (Anual Azul e Mensal #6E1996) */}
      {(isRegularPioneer || isAuxiliaryPioneer) && (
        <section
          data-testid="progress-card"
          className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-3"
        >
          {/* Cabeçalho do Card */}
          <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
              <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
                🎯 {t('home.progressTitle')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {isRegularPioneer && (
                <>
                  <span className="text-[#001E62] dark:text-[#60A5FA] bg-[#E8EEF8] dark:bg-[#162234] px-2 py-0.5 rounded-md text-[11px]">
                    Ano: {regularProgressPercent}%
                  </span>
                  <span className="text-[#5C6B7E] dark:text-[#64748B] text-[10px]">•</span>
                </>
              )}
              <span
                data-testid="monthly-badge"
                className="text-[#001E62] dark:text-[#60A5FA] bg-[#E8EEF8] dark:bg-[#162234] px-2 py-0.5 rounded-md text-[11px] font-bold"
              >
                Mês: {isRegularPioneer ? regularMonthlyCalculation.progressPercent : auxMonthlyCalculation.progressPercent}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* 1. BARRA DE PROGRESSO ANUAL (Apenas Pioneiro Regular — Cor Azul) */}
            {isRegularPioneer && (
              <div
                data-testid="annual-progress-section"
                className="bg-[#F4F6F9] dark:bg-[#0B1320] p-3 rounded-xl border border-[#DDE3EA] dark:border-[#202E42] space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#001E62] dark:text-[#93C5FD] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#001E62] dark:bg-[#3B82F6]" />
                    <span>📅 {t('home.progressAnnual')} ({regularAnnualTargetHours}h)</span>
                  </span>
                  <span className="text-[#001E62] dark:text-[#60A5FA]">
                    {regularProgressPercent}%
                  </span>
                </div>

                {/* Barra de Progresso Anual (Azul) */}
                <div className="h-3.5 w-full bg-[#E8EEF8] dark:bg-[#162234] rounded-full overflow-hidden p-0.5 border border-[#001E62]/20 dark:border-[#25364E]">
                  <div
                    data-testid="annual-progress-bar"
                    className="h-full bg-[#001E62] dark:bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${regularProgressPercent}%` }}
                  />
                </div>

                <div className="pt-0.5 space-y-1 text-xs text-[#0A111E] dark:text-[#F8FAFC]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#001E62] dark:text-[#93C5FD] font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('home.completedCount', { time: formatMinutesToHHMM(totalMinutes) })}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#5C6B7E] dark:text-[#CBD5E1] font-semibold text-[11px]">
                      <Hourglass className="w-3.5 h-3.5" />
                      <span>
                        {regularRemainingMinutes === 0
                          ? t('home.goalReached')
                          : t('home.remainingCount', { time: formatMinutesToHHMM(regularRemainingMinutes) })}
                      </span>
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-[#DDE3EA] dark:border-[#202E42] flex items-center justify-between text-[11px] text-[#5C6B7E] dark:text-[#CBD5E1]">
                    <span>📏 {t('home.annualGoal')}</span>
                    <span className="font-bold text-[#0A111E] dark:text-[#F8FAFC]">
                      {regularAnnualTargetHours}:00 ({regularMonthlyTarget} {t('home.hoursPerMonth')})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BARRA DE PROGRESSO MENSAL */}
            <div
              data-testid="monthly-progress-section"
              className="bg-[#F4F6F9] dark:bg-[#0B1320] p-3 rounded-xl border border-[#DDE3EA] dark:border-[#202E42] space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#001E62] dark:text-[#93C5FD] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#001E62] dark:bg-[#3B82F6]" />
                  <span>
                    🗓️ {isRegularPioneer ? t('home.progressMonthly') : t('home.progressAux')} ({isRegularPioneer ? regularMonthlyTarget : auxMonthlyTargetHours}h)
                  </span>
                </span>
                <span className="text-[#001E62] dark:text-[#60A5FA]">
                  {isRegularPioneer ? regularMonthlyCalculation.progressPercent : auxMonthlyCalculation.progressPercent}%
                </span>
              </div>

              {/* Barra de Progresso Mensal — Cor #6E1996 exclusivamente para Pioneiro Regular */}
              <div className="h-3.5 w-full bg-[#E8EEF8] dark:bg-[#162234] rounded-full overflow-hidden p-0.5 border border-[#001E62]/20 dark:border-[#25364E]">
                <div
                  data-testid="monthly-progress-bar"
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isRegularPioneer ? '' : 'bg-[#001E62] dark:bg-[#3B82F6]'
                  }`}
                  style={{
                    width: `${isRegularPioneer ? regularMonthlyCalculation.progressPercent : auxMonthlyCalculation.progressPercent}%`,
                    ...(isRegularPioneer ? { backgroundColor: '#6E1996' } : {}),
                  }}
                />
              </div>

              <div className="pt-0.5 space-y-1 text-xs text-[#0A111E] dark:text-[#F8FAFC]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#001E62] dark:text-[#93C5FD] font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('home.completedCount', { time: formatMinutesToHHMM(currentMonthMinutes) })}</span>
                  </span>
                  <span
                    data-testid="monthly-remaining-label"
                    className="flex items-center gap-1.5 text-[#5C6B7E] dark:text-[#CBD5E1] font-semibold text-[11px]"
                  >
                    <Hourglass className="w-3.5 h-3.5" />
                    <span>
                      {(isRegularPioneer ? regularMonthlyCalculation.isTargetReached : auxMonthlyCalculation.isTargetReached)
                        ? t('home.goalReached')
                        : t('home.remainingCount', {
                            time: isRegularPioneer
                              ? regularMonthlyCalculation.formattedRemaining
                              : auxMonthlyCalculation.formattedRemaining,
                          })}
                    </span>
                  </span>
                </div>

                <div className="pt-1.5 border-t border-[#DDE3EA] dark:border-[#202E42] flex items-center justify-between text-[11px] text-[#5C6B7E] dark:text-[#CBD5E1]">
                  <span>📏 {t('home.monthGoal')}</span>
                  <span className="font-bold text-[#0A111E] dark:text-[#F8FAFC]">
                    {isRegularPioneer
                      ? `${regularMonthlyTarget}:00 h`
                      : `${auxMonthlyTargetHours}:00 h ${currentMonthReport?.hasReducedRequirement ? t('home.specialMonthReduced') : t('home.standardRequirement')}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 📊 HORAS POR MÊS (Gráfico de barras) */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
            <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              📊 {t('home.chartTitle')}
            </h2>
          </div>
          <span className="text-[10px] text-[#5C6B7E] dark:text-[#CBD5E1]">
            {t('home.chartHint')}
          </span>
        </div>

        <div className="space-y-1.5">
          {monthsInServiceYear.map((mKey) => {
            const mins = monthlyMinutesMap[mKey] || 0;
            const barWidthPercent = maxBarMinutes > 0 ? Math.min(100, Math.round((mins / maxBarMinutes) * 100)) : 0;
            const isCurrentMonth = mKey === currentMonthKey;
            const monthLabelShort = formatMonthLabel(mKey, locale).slice(0, 3);

            return (
              <button
                key={mKey}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onGoToMonth(mKey);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-left ${
                  isCurrentMonth
                    ? 'bg-[#E8EEF8] dark:bg-[#172554] font-bold border border-[#001E62]/40 dark:border-[#3B82F6]'
                    : 'hover:bg-[#F4F6F9] dark:hover:bg-[#0B1320]'
                }`}
              >
                <span className="w-8 text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] capitalize">
                  {monthLabelShort}
                </span>

                {/* Barra */}
                <div className="flex-1 h-3.5 bg-[#F4F6F9] dark:bg-[#0B1320] rounded-full overflow-hidden p-0.5 border border-[#DDE3EA] dark:border-[#202E42]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      mins > 0 ? 'bg-[#001E62] dark:bg-[#3B82F6]' : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.max(barWidthPercent, mins > 0 ? 5 : 0)}%` }}
                  />
                </div>

                {/* Horas formatadas hh:mm */}
                <span className="w-14 text-right font-mono text-xs font-bold text-[#0A111E] dark:text-[#F8FAFC]">
                  {formatMinutesToHHMM(mins)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 💬 LEMBRETE RÁPIDO: Próxima Revisita */}
      {nextVisit && (
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
              <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
                {t('home.nextRevisit')}
              </h2>
            </div>
            <button
              onClick={() => {
                triggerHaptic(8);
                onGoToVisits();
              }}
              className="text-xs text-[#001E62] dark:text-[#93C5FD] font-semibold hover:underline"
            >
              {t('home.viewAll')}
            </button>
          </div>

          <div className="pt-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0A111E] dark:text-[#F8FAFC]">
                👤 {nextVisit.contactName}
              </h3>
              {formatFullAddress(nextVisit) && (
                <p className="text-xs text-[#5C6B7E] dark:text-[#CBD5E1] mt-0.5">
                  📍 {formatFullAddress(nextVisit)}
                </p>
              )}
              {(nextVisit.scheduledDate || nextVisit.scheduledTime) && (
                <p className="text-[11px] text-[#001E62] dark:text-[#93C5FD] font-semibold mt-1">
                  {nextVisit.scheduledDate && t('home.scheduledDate', { date: nextVisit.scheduledDate })}
                  {nextVisit.scheduledTime && ` ${t('revisit.atTime')} ${nextVisit.scheduledTime}`}
                </p>
              )}
            </div>

            {(formatFullAddress(nextVisit) || nextVisit.latitude) && (
              <button
                type="button"
                onClick={() => handleOpenMaps(nextVisit)}
                title={t('home.openMaps')}
                className="p-2.5 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1E3A8A] transition-colors border border-[#CBD8EE] dark:border-[#3B82F6]/40 shrink-0"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
