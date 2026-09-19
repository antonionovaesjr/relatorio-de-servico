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
} from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';

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

  // Total de minutos de ministério no ano de serviço
  const totalMinutes = useMemo(() => {
    const dailyMins = serviceYearDailyEntries.reduce(
      (acc, cur) => acc + (cur.hours * 60 + (cur.minutes || 0)),
      0
    );
    const reportsMins = serviceYearReports.reduce((acc, cur) => acc + Math.round((cur.hours ?? 0) * 60), 0);
    return Math.max(dailyMins, reportsMins);
  }, [serviceYearDailyEntries, serviceYearReports]);

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

  // Relatório do mês atual vigente
  const currentMonthReport = useLiveQuery(
    () => db.monthlyReports.get(currentMonthKey),
    [currentMonthKey]
  );

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
    return Math.max(dailyMins, repMins);
  }, [currentMonthDailyEntries, currentMonthReport]);

  // Identificação dos papéis teocráticos
  const isRegularPioneer = settings.role === 'regular_pioneer';
  const isAuxiliaryPioneer =
    settings.role === 'auxiliary_pioneer' || Boolean(currentMonthReport?.isAuxiliaryPioneer);

  // Metas do Pioneiro Regular (Ano de serviço)
  const regularMonthlyTarget = settings.regularPioneerConfig?.monthlyTargetHours || 50;
  const regularAnnualTargetHours = regularMonthlyTarget * 12;
  const regularAnnualTargetMinutes = regularAnnualTargetHours * 60;
  const regularRemainingMinutes = Math.max(0, regularAnnualTargetMinutes - totalMinutes);
  const regularProgressPercent =
    regularAnnualTargetMinutes > 0
      ? Math.min(100, Math.round((totalMinutes / regularAnnualTargetMinutes) * 100))
      : 100;

  // Metas do Pioneiro Auxiliar (Baseado no mês atual vigente)
  const auxMonthlyTargetHours = currentMonthReport?.hasReducedRequirement
    ? 15
    : settings.auxiliaryPioneerConfig?.monthlyTargetHours || 30;
  const auxMonthlyTargetMinutes = auxMonthlyTargetHours * 60;
  const auxRemainingMinutes = Math.max(0, auxMonthlyTargetMinutes - currentMonthMinutes);
  const auxProgressPercent =
    auxMonthlyTargetMinutes > 0
      ? Math.min(100, Math.round((currentMonthMinutes / auxMonthlyTargetMinutes) * 100))
      : 100;

  // Texto do componente "Faltam"
  const faltamDisplay = useMemo(() => {
    if (isRegularPioneer) {
      return `${formatMinutesToHHMM(regularRemainingMinutes)} ${t('home.remaining').toLowerCase()}`;
    }
    if (isAuxiliaryPioneer) {
      return `${formatMinutesToHHMM(auxRemainingMinutes)} ${t('home.remaining').toLowerCase()}`;
    }
    // Para publicador sem requisito: informação abreviada N/A
    return t('common.na');
  }, [isRegularPioneer, isAuxiliaryPioneer, regularRemainingMinutes, auxRemainingMinutes, t]);

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
      }
    });

    return map;
  }, [monthsInServiceYear, serviceYearDailyEntries, serviceYearReports]);

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

  const handleOpenMaps = (addr?: string) => {
    if (!addr) return;
    triggerHaptic(8);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
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

      {/* 🎯 PROGRESSO DA DESIGNAÇÃO — Pioneiro Regular (Anual) */}
      {isRegularPioneer && (
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
              <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
                🎯 {t('home.progressAnnual')}
              </h2>
            </div>
            <span className="text-xs font-bold text-[#001E62] dark:text-[#60A5FA]">
              {regularProgressPercent}%
            </span>
          </div>

          <div className="bg-[#F4F6F9] dark:bg-[#0B1320] p-3 rounded-xl border border-[#DDE3EA] dark:border-[#202E42] space-y-2.5">
            {/* Barra de Progresso */}
            <div className="h-4 w-full bg-[#E8EEF8] dark:bg-[#162234] rounded-full overflow-hidden p-0.5 border border-[#001E62]/20 dark:border-[#25364E]">
              <div
                className="h-full bg-[#001E62] dark:bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${regularProgressPercent}%` }}
              />
            </div>

            <div className="pt-1 space-y-1 text-xs text-[#0A111E] dark:text-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#001E62] dark:text-[#93C5FD] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('home.completedCount', { time: formatMinutesToHHMM(totalMinutes) })}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#5C6B7E] dark:text-[#CBD5E1] font-semibold">
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>{t('home.remainingCount', { time: formatMinutesToHHMM(regularRemainingMinutes) })}</span>
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
        </section>
      )}

      {/* 🎯 PROGRESSO DO MÊS VIGENTE — Pioneiro Auxiliar */}
      {isAuxiliaryPioneer && (
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
              <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
                🎯 {t('home.progressAux')}
              </h2>
            </div>
            <span className="text-xs font-bold text-[#001E62] dark:text-[#60A5FA]">
              {auxProgressPercent}%
            </span>
          </div>

          <div className="bg-[#F4F6F9] dark:bg-[#0B1320] p-3 rounded-xl border border-[#DDE3EA] dark:border-[#202E42] space-y-2.5">
            {/* Barra de Progresso */}
            <div className="h-4 w-full bg-[#E8EEF8] dark:bg-[#162234] rounded-full overflow-hidden p-0.5 border border-[#001E62]/20 dark:border-[#25364E]">
              <div
                className="h-full bg-[#001E62] dark:bg-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${auxProgressPercent}%` }}
              />
            </div>

            <div className="pt-1 space-y-1 text-xs text-[#0A111E] dark:text-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#001E62] dark:text-[#93C5FD] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('home.completedCount', { time: formatMinutesToHHMM(currentMonthMinutes) })}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#5C6B7E] dark:text-[#CBD5E1] font-semibold">
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>{t('home.remainingCount', { time: formatMinutesToHHMM(auxRemainingMinutes) })}</span>
                </span>
              </div>

              <div className="pt-1.5 border-t border-[#DDE3EA] dark:border-[#202E42] flex items-center justify-between text-[11px] text-[#5C6B7E] dark:text-[#CBD5E1]">
                <span>📏 {t('home.monthGoal')}</span>
                <span className="font-bold text-[#0A111E] dark:text-[#F8FAFC]">
                  {auxMonthlyTargetHours}:00 h {currentMonthReport?.hasReducedRequirement ? t('home.specialMonthReduced') : t('home.standardRequirement')}
                </span>
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
              {nextVisit.address && (
                <p className="text-xs text-[#5C6B7E] dark:text-[#CBD5E1] mt-0.5">
                  📍 {nextVisit.address}
                </p>
              )}
              {nextVisit.scheduledDate && (
                <p className="text-[11px] text-[#001E62] dark:text-[#93C5FD] font-semibold mt-1">
                  {t('home.scheduledDate', { date: nextVisit.scheduledDate })}
                </p>
              )}
            </div>

            {nextVisit.address && (
              <button
                type="button"
                onClick={() => handleOpenMaps(nextVisit.address)}
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
