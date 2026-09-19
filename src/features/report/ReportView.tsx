import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Share2,
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
} from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { ShareModal } from './components/ShareModal';
import { RevisitModal } from '../register/RevisitModal';

interface ReportViewProps {
  initialMonthKey?: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ initialMonthKey }) => {
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
    if (window.confirm('Deseja excluir este lançamento diário?')) {
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
  const handleOpenMaps = (addr?: string) => {
    if (!addr) return;
    triggerHaptic(8);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
    if (window.confirm('Excluir esta revisita?')) {
      await db.returnVisits.delete(id);
    }
  };

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* 🔍 BARRA DE BUSCA ESTILO WHATSAPP */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#657484] dark:text-[#8696A0]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar relatório ou revisita..."
          className="w-full bg-white dark:bg-[#1F2C34] text-[#111B1F] dark:text-[#E9EDEF] pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs focus:outline-none focus:ring-2 focus:ring-[#01D65A] shadow-xs placeholder:text-[#657484] dark:placeholder:text-[#8696A0]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#657484] dark:text-[#8696A0] hover:text-[#111B1F] dark:hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      {/* 📅 CARD SELETOR DE MÊS & OPÇÕES TEOCRÁTICAS */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <button
            type="button"
            onClick={() => handleNavigate(-1)}
            className="p-1.5 rounded-lg text-[#657484] hover:text-[#111B1F] dark:text-[#8696A0] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#111B26] transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <label className="text-sm font-extrabold capitalize text-[#111B1F] dark:text-[#E9EDEF] cursor-pointer flex items-center gap-1.5">
            <span>📅 {formatMonthLabel(currentMonthKey)}</span>
            <span className="text-xs font-normal text-[#657484] dark:text-[#8696A0]">
              — {filteredDailyEntries.length} {filteredDailyEntries.length === 1 ? 'registro' : 'registros'}
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
            className="p-1.5 rounded-lg text-[#657484] hover:text-[#111B1F] dark:text-[#8696A0] dark:hover:text-white hover:bg-[#F0F2F5] dark:hover:bg-[#111B26] transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Opções Teocráticas — SOMENTE SE FOR PUBLICADOR NAS CONFIGURAÇÕES */}
        {isPublisher && (
          <div className="space-y-2 pt-1 border-t border-[#E1E1E1]/60 dark:border-[#2A3942]/60 mt-2">
            {/* Campo: Mês como pioneiro auxiliar */}
            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] border border-[#E1E1E1] dark:border-[#2A3942] cursor-pointer hover:border-[#01D65A] transition-colors select-none">
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
                className="w-4 h-4 rounded text-[#01D65A] focus:ring-[#01D65A] border-[#657484]/40 accent-[#01D65A]"
              />
              <span className="text-xs font-semibold text-[#111B1F] dark:text-[#E9EDEF]">
                Mês como pioneiro auxiliar
              </span>
            </label>

            {/* Campo: 50% (mês especial) */}
            <label
              className={`flex items-center gap-2.5 p-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] transition-colors select-none ${
                report.isAuxiliaryPioneer
                  ? 'bg-[#F0F2F5] dark:bg-[#111B26] cursor-pointer hover:border-[#01D65A]'
                  : 'bg-[#F0F2F5]/50 dark:bg-[#111B26]/50 opacity-60 cursor-pointer'
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
                className="w-4 h-4 rounded text-[#01D65A] focus:ring-[#01D65A] border-[#657484]/40 accent-[#01D65A]"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#111B1F] dark:text-[#E9EDEF]">
                  50% (mês especial)
                </span>
                {!report.isAuxiliaryPioneer && (
                  <span className="text-[10px] text-[#657484] dark:text-[#8696A0]">
                    (ativa pioneiro aux.)
                  </span>
                )}
              </div>
            </label>
          </div>
        )}
      </section>

      {/* 📄 REGISTROS DO MÊS (Estilo chat WhatsApp) */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
            <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
              📄 Registros do Mês ({filteredDailyEntries.length})
            </h2>
          </div>
        </div>

        {filteredDailyEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#657484] dark:text-[#8696A0]">
            Nenhum registro encontrado para este período.
          </div>
        ) : (
          <div className="divide-y divide-[#E1E1E1] dark:divide-[#2A3942]">
            {filteredDailyEntries.map((entry) => {
              const entryMinutes = entry.hours * 60 + (entry.minutes || 0);
              const dayStr = entry.date.slice(8, 10);
              const monthStr = entry.date.slice(5, 7);

              return (
                <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#111B1F] dark:text-[#E9EDEF]">
                        📅 {dayStr}/{monthStr}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        📚 {entry.bibleStudies || 0}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#008069] dark:text-[#01D65A]">
                        ⏰ {entryMinutes > 0 ? formatMinutesToHHMM(entryMinutes) : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => handleStartEditDaily(entry)}
                        title="Editar"
                        className="p-1 rounded-md text-[#657484] hover:text-[#111B1F] dark:text-[#8696A0] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDaily(entry.id)}
                        title="Excluir"
                        className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-[#657484] dark:text-[#8696A0] italic bg-[#F0F2F5]/70 dark:bg-[#111B26]/70 px-2.5 py-1 rounded-lg">
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
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
            <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
              📌 Revisitas deste Mês ({filteredReturnVisits.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setIsNewRevisitModalOpen(true);
            }}
            className="text-xs font-bold text-[#019444] dark:text-[#01D65A] flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {filteredReturnVisits.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#657484] dark:text-[#8696A0]">
            Nenhuma revisita registrada neste mês.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReturnVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] border border-[#E1E1E1] dark:border-[#2A3942] space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleVisit(visit)}
                      className="mt-0.5 text-[#01D65A]"
                    >
                      {visit.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#01D65A]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#657484] dark:text-[#8696A0]" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          visit.isCompleted
                            ? 'line-through text-[#657484] dark:text-[#8696A0]'
                            : 'text-[#111B1F] dark:text-[#E9EDEF]'
                        }`}
                      >
                        • {visit.contactName}
                      </h4>

                      {visit.address && (
                        <p className="text-[11px] text-[#657484] dark:text-[#8696A0] mt-0.5">
                          📍 {visit.address}
                        </p>
                      )}

                      {visit.notes && (
                        <p className="text-[11px] text-[#657484] dark:text-[#8696A0] italic mt-0.5">
                          "{visit.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {visit.address && (
                      <button
                        type="button"
                        onClick={() => handleOpenMaps(visit.address)}
                        title="Abrir no Google Maps"
                        className="p-1.5 rounded-lg bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] hover:bg-[#01D65A] hover:text-white transition-colors border border-[#01D65A]/20"
                      >
                        <span className="text-sm">🗺️</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteVisit(visit.id)}
                      title="Excluir"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-white dark:hover:bg-[#1F2C34]"
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

      {/* 📤 BOTÃO PRINCIPAL: COMPARTILHAR MÊS INTEIRO */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic(15);
          setIsShareModalOpen(true);
        }}
        className="w-full py-3.5 px-4 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
      >
        <Share2 className="w-5 h-5" />
        <span>Compartilhar mês inteiro</span>
      </button>

      {/* Modal de Compartilhamento do Mês Inteiro */}
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

      {/* Modal de Edição de Lançamento Diário */}
      {editingDailyEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md border border-[#E1E1E1] dark:border-[#2A3942] p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-[#008069] dark:text-[#01D65A] border-b border-[#E1E1E1] dark:border-[#2A3942] pb-2">
              Editar Registro Diário
            </h3>

            <form onSubmit={handleSaveEditDaily} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                  Horas (hh:mm)
                </label>
                <input
                  type="text"
                  required
                  value={editTimeStr}
                  onChange={(e) => setEditTimeStr(e.target.value)}
                  placeholder="00:00"
                  className="w-full bg-[#F0F2F5] dark:bg-[#111B26] font-mono text-center text-lg font-bold text-[#008069] dark:text-[#01D65A] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                  Estudos Bíblicos
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStudies}
                  onChange={(e) => setEditStudies(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDailyEntry(null)}
                  className="flex-1 py-2 px-3 rounded-xl border border-[#657484]/30 text-xs font-semibold text-[#657484] dark:text-[#8696A0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
