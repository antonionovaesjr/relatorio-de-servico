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

interface HomeViewProps {
  onGoToMonth: (monthKey: string) => void;
  onGoToVisits: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onGoToMonth, onGoToVisits }) => {
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

  // Parâmetros de Pioneiro Regular e Metas
  const isRegularPioneer = settings.role === 'regular_pioneer';
  const monthlyTargetHours = settings.regularPioneerConfig?.monthlyTargetHours || (isRegularPioneer ? 50 : 0);
  const annualTargetHours = monthlyTargetHours * 12;
  const annualTargetMinutes = annualTargetHours * 60;
  const remainingMinutes = Math.max(0, annualTargetMinutes - totalMinutes);
  const progressPercent =
    annualTargetMinutes > 0 ? Math.min(100, Math.round((totalMinutes / annualTargetMinutes) * 100)) : 100;

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
        return 'Pioneiro Regular';
      case 'auxiliary_pioneer':
        return 'Pioneiro Auxiliar';
      default:
        return 'Publicador';
    }
  }, [settings.role]);

  const handleOpenMaps = (addr?: string) => {
    if (!addr) return;
    triggerHaptic(8);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* 👤 CARD PRINCIPAL: PERFIL & RESUMO DO ANO DE SERVIÇO */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        {/* Perfil */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              {settings.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#01D65A]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#008069] dark:bg-[#005C4B] flex items-center justify-center text-white font-bold text-base border-2 border-[#01D65A]">
                  {settings.publisherName ? settings.publisherName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#01D65A] border-2 border-white dark:border-[#1F2C34]" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-[#111B1F] dark:text-[#E9EDEF] leading-tight">
                {settings.publisherName?.trim() || 'Publicador'}
              </h1>
              <div className="flex items-center gap-1 text-xs text-[#019444] dark:text-[#01D65A] font-semibold mt-0.5">
                <Award className="w-3.5 h-3.5" />
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#657484] dark:text-[#8696A0]">
            Ano {currentServiceYear}
          </span>
        </div>

        {/* Subcard Resumo dos relatórios do ano */}
        <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] space-y-2">
          <div className="text-[11px] font-bold text-[#657484] dark:text-[#8696A0] uppercase tracking-wider pb-1.5 border-b border-[#E1E1E1] dark:border-[#2A3942] flex items-center justify-between">
            <span>📅 {currentServiceYear} — Resumo dos relatórios do ano</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Estudos */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1F2C34] rounded-lg border border-[#E1E1E1] dark:border-[#2A3942]">
              <span className="text-base">📚</span>
              <div>
                <span className="text-[10px] text-[#657484] dark:text-[#8696A0] block leading-none">Estudos</span>
                <span className="font-bold text-[#111B1F] dark:text-[#E9EDEF]">{totalStudies} estudos</span>
              </div>
            </div>

            {/* Horas */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1F2C34] rounded-lg border border-[#E1E1E1] dark:border-[#2A3942]">
              <span className="text-base">⏰</span>
              <div>
                <span className="text-[10px] text-[#657484] dark:text-[#8696A0] block leading-none">Horas</span>
                <span className="font-bold text-[#019444] dark:text-[#01D65A]">
                  {formatMinutesToHHMM(totalMinutes)} h
                </span>
              </div>
            </div>

            {/* Dias de campo */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1F2C34] rounded-lg border border-[#E1E1E1] dark:border-[#2A3942]">
              <span className="text-base">📝</span>
              <div>
                <span className="text-[10px] text-[#657484] dark:text-[#8696A0] block leading-none">Dias</span>
                <span className="font-bold text-[#111B1F] dark:text-[#E9EDEF]">{distinctDaysCount} dias</span>
              </div>
            </div>

            {/* Faltam */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1F2C34] rounded-lg border border-[#E1E1E1] dark:border-[#2A3942]">
              <span className="text-base">🎯</span>
              <div>
                <span className="text-[10px] text-[#657484] dark:text-[#8696A0] block leading-none">Faltam</span>
                <span className="font-bold text-[#657484] dark:text-[#8696A0]">
                  {annualTargetMinutes > 0 ? `${formatMinutesToHHMM(remainingMinutes)} faltam` : 'Livre'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 PROGRESSO DA DESIGNAÇÃO (visível apenas se pioneiro regular) */}
      {isRegularPioneer && (
        <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
              <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
                🎯 Progresso da Designação
              </h2>
            </div>
            <span className="text-xs font-bold text-[#019444] dark:text-[#01D65A]">
              {progressPercent}%
            </span>
          </div>

          <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] space-y-2.5">
            {/* Barra de Progresso WhatsApp: fundo #E1FFD2, barra #01D65A */}
            <div className="h-4 w-full bg-[#E1FFD2] dark:bg-[#005C4B]/40 rounded-full overflow-hidden p-0.5 border border-[#01D65A]/20">
              <div
                className="h-full bg-[#01D65A] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="pt-1 space-y-1 text-xs text-[#111B1F] dark:text-[#E9EDEF]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#008069] dark:text-[#01D65A] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{formatMinutesToHHMM(totalMinutes)} cumpridas</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#657484] dark:text-[#8696A0] font-semibold">
                  <Hourglass className="w-3.5 h-3.5" />
                  <span>{formatMinutesToHHMM(remainingMinutes)} faltam</span>
                </span>
              </div>

              <div className="pt-1.5 border-t border-[#E1E1E1] dark:border-[#2A3942] flex items-center justify-between text-[11px] text-[#657484] dark:text-[#8696A0]">
                <span>📏 Meta Anual:</span>
                <span className="font-bold text-[#111B1F] dark:text-[#E9EDEF]">
                  {annualTargetHours}:00 ({monthlyTargetHours} h/mês)
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 📊 HORAS POR MÊS (Gráfico de barras WhatsApp) */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
            <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
              📊 Horas por Mês
            </h2>
          </div>
          <span className="text-[10px] text-[#657484] dark:text-[#8696A0]">
            Toque na barra para abrir o mês
          </span>
        </div>

        <div className="space-y-1.5">
          {monthsInServiceYear.map((mKey) => {
            const mins = monthlyMinutesMap[mKey] || 0;
            const barWidthPercent = maxBarMinutes > 0 ? Math.min(100, Math.round((mins / maxBarMinutes) * 100)) : 0;
            const isCurrentMonth = mKey === currentMonthKey;
            const monthLabelShort = formatMonthLabel(mKey).slice(0, 3);

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
                    ? 'bg-[#E1FFD2]/60 dark:bg-[#005C4B]/40 font-bold border border-[#01D65A]/40'
                    : 'hover:bg-[#F0F2F5] dark:hover:bg-[#111B26]/60'
                }`}
              >
                <span className="w-8 text-xs font-semibold text-[#657484] dark:text-[#8696A0] capitalize">
                  {monthLabelShort}
                </span>

                {/* Barra verde WhatsApp */}
                <div className="flex-1 h-3.5 bg-[#F0F2F5] dark:bg-[#111B26] rounded-full overflow-hidden p-0.5 border border-[#E1E1E1] dark:border-[#2A3942]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      mins > 0 ? 'bg-[#01D65A]' : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.max(barWidthPercent, mins > 0 ? 5 : 0)}%` }}
                  />
                </div>

                {/* Horas formatadas hh:mm */}
                <span className="w-14 text-right font-mono text-xs font-bold text-[#111B1F] dark:text-[#E9EDEF]">
                  {formatMinutesToHHMM(mins)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 💬 LEMBRETE RÁPIDO: Próxima Revisita */}
      {nextVisit && (
        <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
              <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
                Próxima Revisita
              </h2>
            </div>
            <button
              onClick={() => {
                triggerHaptic(8);
                onGoToVisits();
              }}
              className="text-xs text-[#019444] dark:text-[#01D65A] font-semibold hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="pt-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#111B1F] dark:text-[#E9EDEF]">
                👤 {nextVisit.contactName}
              </h3>
              {nextVisit.address && (
                <p className="text-xs text-[#657484] dark:text-[#8696A0] mt-0.5">
                  📍 {nextVisit.address}
                </p>
              )}
              {nextVisit.scheduledDate && (
                <p className="text-[11px] text-[#008069] dark:text-[#01D65A] font-semibold mt-1">
                  Data prevista: {nextVisit.scheduledDate}
                </p>
              )}
            </div>

            {nextVisit.address && (
              <button
                type="button"
                onClick={() => handleOpenMaps(nextVisit.address)}
                title="Abrir no Google Maps"
                className="p-2.5 rounded-xl bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] hover:bg-[#01D65A] hover:text-white transition-colors border border-[#01D65A]/20 shrink-0"
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
