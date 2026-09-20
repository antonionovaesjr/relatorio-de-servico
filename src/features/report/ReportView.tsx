import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ClipboardCopy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  CheckCircle2,
  Circle,
  Plus,
} from 'lucide-react';

import { db, useUserSettings } from '../../db/db';
import type { MonthlyReport, ReturnVisit, DailyEntry } from '../../types/models';
import {
  getMonthKey,
  formatMonthLabel,
  calculateServiceYear,
  navigateMonthKey,
  deriveMonthKeyFromDate,
  calculateServiceYearFromDate,
  formatMinutesToHHMM,
  parseHHMMToMinutes,
  formatDailyDate,
} from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';
import { ShareModal } from './components/ShareModal';
import { RevisitModal } from '../register/RevisitModal';
import { formatFullAddress, getGoogleMapsUrl } from '../../utils/geolocation';

interface ReportViewProps {
  initialMonthKey?: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ initialMonthKey }) => {
  const { t, locale } = useTranslation();
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(
    () => initialMonthKey || getMonthKey(new Date())
  );

  // Busca e Filtro
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNewRevisitModalOpen, setIsNewRevisitModalOpen] = useState(false);

  // Edição de Lançamento Diário
  const [editingDailyEntry, setEditingDailyEntry] = useState<DailyEntry | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTimeStr, setEditTimeStr] = useState('');
  const [editStudies, setEditStudies] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Ajuste rápido de tempo na edição
  const handleAdjustEditMinutes = (mins: number) => {
    triggerHaptic(8);
    const currentMins = parseHHMMToMinutes(editTimeStr);
    const nextMins = Math.max(0, currentMins + mins);
    setEditTimeStr(formatMinutesToHHMM(nextMins));
  };

  const handleResetEditTime = () => {
    triggerHaptic(10);
    setEditTimeStr('00:00');
  };

  // Configurações do usuário
  const settings = useUserSettings();

  // Lançamentos diários do mês
  const dailyEntries = useLiveQuery(
    () => db.dailyEntries.where('monthKey').equals(currentMonthKey).toArray(),
    [currentMonthKey]
  );

  // Filtragem pela busca
  const filteredDailyEntries = useMemo(() => {
    if (!dailyEntries) return [];
    let list = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.date.includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dailyEntries, searchQuery]);

  // Soma de minutos e estudos das diárias
  const totalDailyMinutes = useMemo(() => {
    if (!dailyEntries) return 0;
    return dailyEntries.reduce((acc, cur) => acc + (cur.hours * 60 + (cur.minutes || 0)), 0);
  }, [dailyEntries]);

  const computedStudies = useMemo(() => {
    if (!dailyEntries) return 0;
    return dailyEntries.reduce((acc, cur) => acc + (cur.bibleStudies || 0), 0);
  }, [dailyEntries]);

  // Consulta do relatório salvo do mês
  const dbReport = useLiveQuery(() => db.monthlyReports.get(currentMonthKey), [currentMonthKey]);

  // Relatório ativo mesclado
  const report: MonthlyReport = useMemo(() => {
    const computedHoursDecimal = Math.round((totalDailyMinutes / 60) * 10) / 10;
    return {
      monthKey: currentMonthKey,
      serviceYear: calculateServiceYear(currentMonthKey),
      bibleStudies: dbReport?.bibleStudies ?? computedStudies,
      hours: dbReport?.hours ?? computedHoursDecimal,
      notes: dbReport?.notes ?? '',
      isAuxiliaryPioneer: dbReport?.isAuxiliaryPioneer ?? false,
      hasReducedRequirement: dbReport?.hasReducedRequirement ?? false,
      updatedAt: dbReport?.updatedAt ?? new Date().toISOString(),
    };
  }, [currentMonthKey, dbReport, computedStudies, totalDailyMinutes]);

  // Revisitas do mês
  const returnVisits = useLiveQuery(
    () => db.returnVisits.where('monthKey').equals(currentMonthKey).toArray(),
    [currentMonthKey]
  );

  // Filtragem de revisitas pela busca
  const filteredReturnVisits = useMemo(() => {
    if (!returnVisits) return [];
    if (!searchQuery.trim()) return returnVisits;
    const q = searchQuery.toLowerCase();
    return returnVisits.filter(
      (v) =>
        v.contactName.toLowerCase().includes(q) ||
        (v.address && v.address.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.number && v.number.toLowerCase().includes(q)) ||
        (v.complement && v.complement.toLowerCase().includes(q)) ||
        (v.notes && v.notes.toLowerCase().includes(q))
    );
  }, [returnVisits, searchQuery]);

  // Navegação do Mês
  const handleNavigate = (delta: number) => {
    triggerHaptic(10);
    setCurrentMonthKey((prev) => navigateMonthKey(prev, delta));
  };

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      triggerHaptic(10);
      setCurrentMonthKey(e.target.value);
    }
  };

  // Atualização no banco
  const handleUpdateReport = async (patch: Partial<MonthlyReport>) => {
    const updated: MonthlyReport = {
      ...report,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.monthlyReports.put(updated);
  };

  // Regras de pioneiro / publicador
  const isPublisher = settings.role === 'publisher';

  // Excluir Lançamento Diário
  const handleDeleteDaily = async (id?: number) => {
    if (!id) return;
    triggerHaptic(15);
    if (window.confirm(t('reports.deleteConfirmDaily'))) {
      await db.dailyEntries.delete(id);
    }
  };

  // Abrir Modal de Edição Diária
  const handleStartEditDaily = (entry: DailyEntry) => {
    triggerHaptic(10);
    setEditingDailyEntry(entry);
    setEditDate(entry.date);
    const m = entry.hours * 60 + (entry.minutes || 0);
    setEditTimeStr(formatMinutesToHHMM(m));
    setEditStudies(entry.bibleStudies || 0);
    setEditNotes(entry.notes || '');
  };

  // Salvar Edição Diária
  const handleSaveEditDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDailyEntry || !editingDailyEntry.id) return;
    triggerHaptic(12);

    const mins = parseHHMMToMinutes(editTimeStr);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const mKey = deriveMonthKeyFromDate(editDate);
    const sYear = calculateServiceYearFromDate(editDate);

    await db.dailyEntries.update(editingDailyEntry.id, {
      date: editDate,
      monthKey: mKey,
      serviceYear: sYear,
      hours: h,
      minutes: m,
      bibleStudies: editStudies,
      notes: editNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });

    setEditingDailyEntry(null);
  };

  // Abrir Google Maps
  const handleOpenMaps = (visit: ReturnVisit) => {
    triggerHaptic(8);
    window.open(getGoogleMapsUrl(visit), '_blank', 'noopener,noreferrer');
  };

  // Alternar Status da Revisita
  const handleToggleVisit = async (visit: ReturnVisit) => {
    if (!visit.id) return;
    triggerHaptic(8);
    await db.returnVisits.update(visit.id, {
      isCompleted: !visit.isCompleted,
      updatedAt: new Date().toISOString(),
    });
  };

  // Excluir Revisita
  const handleDeleteVisit = async (id?: number) => {
    if (!id) return;
    triggerHaptic(12);
    if (window.confirm(t('reports.deleteConfirmRevisit'))) {
      await db.returnVisits.delete(id);
    }
  };

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* 🔍 BARRA DE BUSCA */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C6B7E] dark:text-[#94A3B8]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('reports.searchPlaceholder')}
          className="w-full bg-white dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA] shadow-xs placeholder:text-[#657484] dark:placeholder:text-[#94A3B8]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#657484] dark:text-[#94A3B8] hover:text-[#111B1F] dark:hover:text-white"
          >
            {t('common.clear')}
          </button>
        )}
      </div>

      {/* 📅 CARD SELETOR DE MÊS & OPÇÕES TEOCRÁTICAS */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <button
            type="button"
            onClick={() => handleNavigate(-1)}
            className="p-1.5 rounded-lg text-[#5C6B7E] hover:text-[#111B1F] dark:text-[#CBD5E1] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#162236] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <label className="text-sm font-extrabold capitalize text-[#111B1F] dark:text-[#F8FAFC] cursor-pointer flex items-center gap-1.5">
            <span>📅 {formatMonthLabel(currentMonthKey, locale)}</span>
            <span className="text-xs font-normal text-[#5C6B7E] dark:text-[#94A3B8]">
              — {filteredDailyEntries.length} {filteredDailyEntries.length === 1 ? t('reports.singleRecord') : t('reports.multipleRecords')}
            </span>
            <input
              type="month"
              value={currentMonthKey}
              onChange={handleMonthInputChange}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={() => handleNavigate(1)}
            className="p-1.5 rounded-lg text-[#5C6B7E] hover:text-[#111B1F] dark:text-[#CBD5E1] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#162236] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Opções Teocráticas — SOMENTE SE FOR PUBLICADOR NAS CONFIGURAÇÕES */}
        {isPublisher && (
          <div className="space-y-2 pt-1 border-t border-[#E1E1E1]/60 dark:border-[#1F2E44] mt-2">
            {/* Campo: Mês como pioneiro auxiliar */}
            <label className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-colors ${
              report.isAuxiliaryPioneer
                ? 'bg-[#E8EEF8] dark:bg-[#172554] border-[#001E62] dark:border-[#3B82F6]'
                : 'bg-[#F0F2F5] dark:bg-[#0B1320] border-[#E1E1E1] dark:border-[#202E42] hover:border-[#001E62]'
            }`}>
              <input
                type="checkbox"
                checked={report.isAuxiliaryPioneer}
                onChange={(e) => {
                  triggerHaptic(8);
                  const checked = e.target.checked;
                  handleUpdateReport({
                    isAuxiliaryPioneer: checked,
                    hasReducedRequirement: checked ? report.hasReducedRequirement : false,
                  });
                }}
                className="w-4 h-4 rounded text-[#001E62] dark:text-[#2563EB] focus:ring-[#001E62] border-[#657484]/40 accent-[#001E62] dark:accent-[#2563EB]"
              />
              <span className="text-xs font-semibold text-[#111B1F] dark:text-[#F8FAFC]">
                {t('reports.auxPioneerMonth')}
              </span>
            </label>

            {/* Campo: 50% (mês especial) */}
            <label
              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors select-none ${
                report.isAuxiliaryPioneer
                  ? report.hasReducedRequirement
                    ? 'bg-[#E8EEF8] dark:bg-[#172554] border-[#001E62] dark:border-[#3B82F6] cursor-pointer'
                    : 'bg-[#F0F2F5] dark:bg-[#0B1320] border-[#E1E1E1] dark:border-[#202E42] cursor-pointer'
                  : 'bg-[#F0F2F5]/50 dark:bg-[#0B1320]/60 border-[#E1E1E1] dark:border-[#202E42] opacity-60 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(report.hasReducedRequirement && report.isAuxiliaryPioneer)}
                onChange={(e) => {
                  triggerHaptic(8);
                  const checked = e.target.checked;
                  handleUpdateReport({
                    isAuxiliaryPioneer: checked ? true : report.isAuxiliaryPioneer,
                    hasReducedRequirement: checked,
                  });
                }}
                className="w-4 h-4 rounded text-[#001E62] dark:text-[#2563EB] focus:ring-[#001E62] border-[#657484]/40 accent-[#001E62] dark:accent-[#2563EB]"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#111B1F] dark:text-[#F8FAFC]">
                  {t('reports.special50')}
                </span>
                {!report.isAuxiliaryPioneer && (
                  <span className="text-[10px] text-[#5C6B7E] dark:text-[#94A3B8]">
                    {t('reports.activatesAux')}
                  </span>
                )}
              </div>
            </label>
          </div>
        )}
      </section>

      {/* 📄 REGISTROS DO MÊS */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
            <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              📄 {t('reports.monthEntries', { count: filteredDailyEntries.length })}
            </h2>
          </div>
        </div>

        {filteredDailyEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#5C6B7E] dark:text-[#94A3B8]">
            {t('reports.noEntries')}
          </div>
        ) : (
          <div className="divide-y divide-[#E1E1E1] dark:divide-[#1F2E44]">
            {filteredDailyEntries.map((entry) => {
              const entryMinutes = entry.hours * 60 + (entry.minutes || 0);
              const dayStr = entry.date.slice(8, 10);
              const monthStr = entry.date.slice(5, 7);

              return (
                <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#111B1F] dark:text-[#F8FAFC]">
                        📅 {dayStr}/{monthStr}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                        📚 {entry.bibleStudies || 0}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#001E62] dark:text-[#60A5FA]">
                        ⏰ {entryMinutes > 0 ? formatMinutesToHHMM(entryMinutes) : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => handleStartEditDaily(entry)}
                        title={t('common.edit')}
                        className="p-1 rounded-md text-[#5C6B7E] hover:text-[#001E62] dark:text-[#CBD5E1] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162236] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDaily(entry.id)}
                        title={t('common.delete')}
                        className="p-1 rounded-md text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-[#5C6B7E] dark:text-[#CBD5E1] italic bg-[#F0F2F5]/70 dark:bg-[#0B1320] border border-[#E1E1E1]/50 dark:border-[#202E42] px-2.5 py-1.5 rounded-lg">
                      "{entry.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 📌 REVISITAS DESTE MÊS */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
            <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              📌 {t('reports.revisitsThisMonth', { count: filteredReturnVisits.length })}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setIsNewRevisitModalOpen(true);
            }}
            className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] hover:dark:text-white flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('common.add')}</span>
          </button>
        </div>

        {filteredReturnVisits.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#5C6B7E] dark:text-[#94A3B8]">
            {t('reports.noRevisitsMonth')}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReturnVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] border border-[#E1E1E1] dark:border-[#202E42] space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleVisit(visit)}
                      className="mt-0.5 text-[#001E62] dark:text-[#60A5FA]"
                    >
                      {visit.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#001E62] dark:text-[#60A5FA]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#5C6B7E] dark:text-[#94A3B8]" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          visit.isCompleted
                            ? 'line-through text-[#5C6B7E] dark:text-[#94A3B8]'
                            : 'text-[#111B1F] dark:text-[#F8FAFC]'
                        }`}
                      >
                        • {visit.contactName}
                      </h4>

                      {formatFullAddress(visit) && (
                        <p className="text-[11px] text-[#5C6B7E] dark:text-[#94A3B8] mt-0.5">
                          📍 {formatFullAddress(visit)}
                        </p>
                      )}

                      {(visit.scheduledDate || visit.scheduledTime) && (
                        <p className="text-[11px] font-semibold text-[#001E62] dark:text-[#93C5FD] mt-0.5 flex items-center gap-1">
                          <span>📅</span>
                          <span>
                            {visit.scheduledDate && formatDailyDate(visit.scheduledDate, locale)}
                            {visit.scheduledTime && ` ${t('revisit.atTime')} ${visit.scheduledTime}`}
                          </span>
                        </p>
                      )}

                      {visit.notes && (
                        <p className="text-[11px] text-[#5C6B7E] dark:text-[#CBD5E1] italic mt-0.5">
                          "{visit.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(formatFullAddress(visit) || visit.latitude) && (
                      <button
                        type="button"
                        onClick={() => handleOpenMaps(visit)}
                        title={t('home.openMaps')}
                        className="p-1.5 rounded-lg bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1E3A8A] transition-colors border border-[#001E62]/20 dark:border-[#3B82F6]/40"
                      >
                        <span className="text-sm">🗺️</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteVisit(visit.id)}
                      title={t('common.delete')}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:bg-white dark:hover:bg-[#162236] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📋 BOTÃO PRINCIPAL: COPIAR RELATÓRIO DO MÊS */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic(15);
          setIsShareModalOpen(true);
        }}
        className="w-full py-3.5 px-4 rounded-xl bg-[#001E62] hover:bg-[#001545] dark:bg-[#1D4ED8] hover:dark:bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md dark:shadow-blue-950/40 dark:border dark:border-[#60A5FA]/40 transition-all active:scale-95"
      >
        <ClipboardCopy className="w-5 h-5" />
        <span>📋 {t('reports.copyMonthReport')}</span>
      </button>

      {/* Modal de Copiar Relatório do Mês Inteiro */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        monthKey={currentMonthKey}
        bibleStudies={report.bibleStudies || 0}
        hoursFormatted={formatMinutesToHHMM(totalDailyMinutes)}
        isAuxiliaryPioneer={report.isAuxiliaryPioneer}
        hasReducedRequirement={report.hasReducedRequirement}
        isPublisher={isPublisher}
        userRole={settings.role}
        onUpdateReport={handleUpdateReport}
        notes={report.notes}
        publisherName={settings.publisherName}
      />

      {/* Modal de Nova Revisita Independente */}
      <RevisitModal
        isOpen={isNewRevisitModalOpen}
        onClose={() => setIsNewRevisitModalOpen(false)}
      />

      {/* Modal de Edição / Correção de Lançamento Diário */}
      {editingDailyEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-md border-2 border-[#001E62] dark:border-[#3B82F6] p-4 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-[#001E62] dark:text-[#93C5FD] border-b border-[#001E62]/20 dark:border-[#3B82F6]/30 pb-2 flex items-center justify-between">
              <span>{t('reports.editDailyTitle')}</span>
              <span className="text-[11px] font-normal text-[#5C6B7E] dark:text-[#94A3B8]">
                ID: #{editingDailyEntry.id}
              </span>
            </h3>

            <form onSubmit={handleSaveEditDaily} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
                  {t('reports.dateLabel')}
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
                />
              </div>

              {/* Seletor e Correção de Horas */}
              <div className="space-y-2 bg-[#F0F2F5] dark:bg-[#0B1320] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#202E42]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#111B1F] dark:text-[#CBD5E1]">
                    ⏰ {t('reports.timeHours')}
                  </label>
                  <button
                    type="button"
                    onClick={handleResetEditTime}
                    className="text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900"
                  >
                    ↺ {t('common.reset')}
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={editTimeStr}
                  onChange={(e) => setEditTimeStr(e.target.value)}
                  placeholder="00:00"
                  className="w-full bg-white dark:bg-[#111A29] font-mono text-center text-xl font-bold text-[#001E62] dark:text-[#60A5FA] px-3 py-2 rounded-xl border border-[#001E62]/30 dark:border-[#3B82F6]/50 focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
                />

                {/* Correção de Lançamento: Reduzir / Diminuir tempo */}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                    {t('reports.correctDecrease')}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '-1h', val: -60 },
                      { label: '-30m', val: -30 },
                      { label: '-15m', val: -15 },
                      { label: '-5m', val: -5 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleAdjustEditMinutes(btn.val)}
                        className="py-1 text-[11px] font-bold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 active:scale-95 text-center transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adicionar tempo */}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#001E62] dark:text-[#93C5FD] mb-1">
                    {t('reports.addTime')}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '+5m', val: 5 },
                      { label: '+15m', val: 15 },
                      { label: '+30m', val: 30 },
                      { label: '+1h', val: 60 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleAdjustEditMinutes(btn.val)}
                        className="py-1 text-[11px] font-bold rounded-lg bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1E3A8A] transition-colors border border-[#001E62]/20 dark:border-[#3B82F6]/40 active:scale-95 text-center"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
                  {t('dailyEntry.bibleStudies')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStudies}
                  onChange={(e) => setEditStudies(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
                  {t('reports.notesLabel')}
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDailyEntry(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#657484]/30 dark:border-[#25364E] text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#162236] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#001E62] hover:bg-[#001545] dark:bg-[#1D4ED8] hover:dark:bg-[#2563EB] text-white text-xs font-bold transition-colors active:scale-95 dark:border dark:border-[#60A5FA]/40"
                >
                  {t('reports.saveCorrection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
