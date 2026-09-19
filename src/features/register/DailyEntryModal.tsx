import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Calendar,
  BookOpen,
  Clock,
  FileText,
  Trash2,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, useUserSettings } from '../../db/db';
import {
  todayDateString,
  deriveMonthKeyFromDate,
  calculateServiceYearFromDate,
  formatMinutesToHHMM,
  tryParseTimeToMinutes,
} from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { RevisitModal } from './RevisitModal';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const settings = useUserSettings();

  // Estado do Lançamento
  const [date, setDate] = useState(() => todayDateString());
  const [studies, setStudies] = useState(0);
  const [timeInput, setTimeInput] = useState('01:00');
  const [notes, setNotes] = useState('');
  const [isTimeInvalid, setIsTimeInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do Modal Secundário de Revisita
  const [isRevisitModalOpen, setIsRevisitModalOpen] = useState(false);
  const [revisitCreatedName, setRevisitCreatedName] = useState<string | null>(null);

  // Mês correspondente à data selecionada
  const selectedMonthKey = deriveMonthKeyFromDate(date);
  const monthReport = useLiveQuery(
    () => (isOpen ? db.monthlyReports.get(selectedMonthKey) : undefined),
    [isOpen, selectedMonthKey]
  );

  if (!isOpen) return null;

  // Verificação de Pioneiro (Designação fixa ou publicador atuando como auxiliar neste mês)
  const isPioneerThisMonth = settings.role !== 'publisher' || Boolean(monthReport?.isAuxiliaryPioneer);

  // Parser do tempo
  const parsedTime = tryParseTimeToMinutes(timeInput);
  const totalMinutes = parsedTime.isValid ? parsedTime.minutes : 0;

  // Manipulação de Horas manual
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTimeInput(val);
    const parsed = tryParseTimeToMinutes(val);
    if (!parsed.isValid && val.trim() !== '') {
      setIsTimeInvalid(true);
    } else {
      setIsTimeInvalid(false);
    }
  };

  const handleTimeBlur = () => {
    const parsed = tryParseTimeToMinutes(timeInput);
    if (!parsed.isValid) {
      setIsTimeInvalid(true);
      setTimeInput('00:00');
      setTimeout(() => setIsTimeInvalid(false), 2000);
    } else {
      setIsTimeInvalid(false);
      // Se digitou número decimal como 4.25 ou 4,25, formata para 4:15
      setTimeInput(formatMinutesToHHMM(parsed.minutes));
    }
  };

  // Botões Rápidos de Incremento
  const handleIncrementMinutes = (mins: number) => {
    triggerHaptic(8);
    const parsed = tryParseTimeToMinutes(timeInput);
    const currentMins = parsed.isValid ? parsed.minutes : 0;
    const nextMins = currentMins + mins;
    setTimeInput(formatMinutesToHHMM(nextMins));
    setIsTimeInvalid(false);
  };

  // Limpar campos
  const handleClear = () => {
    triggerHaptic(10);
    setDate(todayDateString());
    setStudies(0);
    setTimeInput('00:00');
    setNotes('');
    setIsTimeInvalid(false);
  };

  // Salvar registro diário
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic(15);
    setIsSubmitting(true);

    try {
      const monthKey = deriveMonthKeyFromDate(date);
      const serviceYear = calculateServiceYearFromDate(date);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      await db.dailyEntries.add({
        date,
        monthKey,
        serviceYear,
        hours: isPioneerThisMonth ? h : 0,
        minutes: isPioneerThisMonth ? m : 0,
        bibleStudies: studies,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (onSaved) {
        onSaved();
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md border border-[#E1E1E1] dark:border-[#2A3942] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* 🟢 Cabeçalho verde (#01D65A) — altura 56px */}
          <header className="h-14 bg-[#01D65A] text-white px-4 flex items-center justify-between shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                onClose();
              }}
              className="flex items-center gap-1 text-white hover:text-white/80 text-xs font-bold transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancelar</span>
            </button>

            <h2 className="text-base font-bold tracking-tight text-white">
              Novo Registro
            </h2>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-white hover:text-white/80 text-xs font-bold transition-opacity disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar</span>
            </button>
          </header>

          {/* Conteúdo Formulário */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {/* 🗓️ Data */}
            <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942]">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#E9EDEF] mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#01D65A]" />
                <span>🗓️ Data do Serviço</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#1F2C34] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-lg border border-[#E1E1E1] dark:border-[#2A3942] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
            </div>

            {/* 📝 Estudos bíblicos */}
            <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942]">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#E9EDEF] mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#01D65A]" />
                <span>📝 Estudos Bíblicos</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setStudies((p) => Math.max(0, p - 1));
                  }}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-[#1F2C34] text-[#111B1F] dark:text-[#E9EDEF] font-bold text-lg flex items-center justify-center border border-[#E1E1E1] dark:border-[#2A3942] active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={studies}
                  onChange={(e) => setStudies(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="flex-1 bg-white dark:bg-[#1F2C34] text-center font-bold text-base text-[#111B1F] dark:text-[#E9EDEF] py-1.5 rounded-lg border border-[#E1E1E1] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setStudies((p) => p + 1);
                  }}
                  className="w-9 h-9 rounded-lg bg-[#01D65A] text-white font-bold text-lg flex items-center justify-center shadow-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Opção teocrática rápida para Publicador neste mês */}
            {settings.role === 'publisher' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] border border-[#E1E1E1] dark:border-[#2A3942] select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(monthReport?.isAuxiliaryPioneer)}
                    onChange={async (e) => {
                      triggerHaptic(8);
                      const isAux = e.target.checked;
                      await db.monthlyReports.put({
                        monthKey: selectedMonthKey,
                        serviceYear: calculateServiceYearFromDate(date),
                        bibleStudies: monthReport?.bibleStudies ?? 0,
                        hours: monthReport?.hours ?? 0,
                        notes: monthReport?.notes ?? '',
                        isAuxiliaryPioneer: isAux,
                        hasReducedRequirement: isAux ? (monthReport?.hasReducedRequirement ?? false) : false,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="w-4 h-4 rounded text-[#01D65A] focus:ring-[#01D65A] border-[#657484]/40 accent-[#01D65A]"
                  />
                  <span className="text-xs font-semibold text-[#111B1F] dark:text-[#E9EDEF]">
                    Mês como pioneiro auxiliar
                  </span>
                </label>
                {monthReport?.isAuxiliaryPioneer && (
                  <span className="text-[10px] text-[#008069] dark:text-[#01D65A] font-bold">
                    {monthReport.hasReducedRequirement ? '15h (50%)' : '30h'}
                  </span>
                )}
              </div>
            )}

            {/* ⏰ Horas (se pioneiro ou publicador no mês como auxiliar) */}
            {isPioneerThisMonth ? (
              <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#E9EDEF]">
                    <Clock className="w-3.5 h-3.5 text-[#01D65A]" />
                    <span>⏰ Horas</span>
                  </label>
                  <span className="text-[11px] text-[#657484] dark:text-[#8696A0]">
                    Digite hh:mm ou decimal
                  </span>
                </div>

                {/* Input editável central */}
                <div>
                  <input
                    type="text"
                    value={timeInput}
                    onChange={handleTimeChange}
                    onBlur={handleTimeBlur}
                    placeholder="00:00"
                    className={`w-full text-center font-mono text-2xl font-bold py-2 rounded-xl border-2 transition-colors ${
                      isTimeInvalid
                        ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-[#01D65A]/40 bg-white dark:bg-[#1F2C34] text-[#008069] dark:text-[#01D65A] focus:border-[#01D65A]'
                    } focus:outline-none tracking-widest`}
                  />
                  {isTimeInvalid && (
                    <p className="text-[10px] text-red-500 font-semibold text-center mt-1">
                      Formato inválido. Use hh:mm (ex: 4:15) ou decimal (ex: 4,25).
                    </p>
                  )}
                </div>

                {/* Botões Rápidos */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { label: '+5min', val: 5 },
                    { label: '+10min', val: 10 },
                    { label: '+15min', val: 15 },
                    { label: '+30min', val: 30 },
                    { label: '+1h', val: 60 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleIncrementMinutes(btn.val)}
                      className="py-1.5 text-[11px] font-bold rounded-lg bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] hover:bg-[#019444] hover:text-white transition-colors border border-[#01D65A] active:scale-95 text-center"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs text-[#657484] dark:text-[#8696A0]">
                ℹ️ Como publicador, o relatório oficial requer apenas confirmação de atividade e estudos bíblicos. Horas são computadas para pioneiros.
              </div>
            )}

            {/* 📝 Observações */}
            <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942]">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#E9EDEF] mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#01D65A]" />
                <span>📝 Observações do Dia</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Saída de campo com irmão Lucas..."
                className="w-full bg-white dark:bg-[#1F2C34] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-lg border border-[#E1E1E1] dark:border-[#2A3942] text-xs focus:outline-none focus:ring-2 focus:ring-[#01D65A] resize-none"
              />
            </div>

            {/* Ações: Salvar e Limpar */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar Registro</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="py-3 px-4 rounded-xl bg-transparent border-2 border-[#01D65A] text-[#008069] dark:text-[#01D65A] hover:bg-[#E1FFD2]/40 text-xs font-bold transition-colors active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar</span>
              </button>
            </div>

            {/* ⛔ Aviso de Compartilhamento */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>⛔ Compartilhamento diário indisponível:</strong> Para compartilhar o relatório consolidado, acesse a aba <strong>📎 Relatórios</strong>.
              </span>
            </div>

            {/* Feedback se acabou de cadastrar revisita */}
            {revisitCreatedName && (
              <div className="flex items-center gap-1.5 text-xs text-[#019444] dark:text-[#01D65A] font-semibold bg-[#E1FFD2]/60 dark:bg-[#005C4B]/40 p-2 rounded-xl border border-[#01D65A]/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Revisita para "{revisitCreatedName}" cadastrada com sucesso!</span>
              </div>
            )}

            {/* 📌 Botão para Nova Janela de Revisita Independente */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setIsRevisitModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] hover:bg-slate-200 dark:hover:bg-slate-800 border-2 border-dashed border-[#01D65A] text-[#008069] dark:text-[#01D65A] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>📌 Cadastrar revisita a fazer (Nova janela)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📌 Janela Independente de Nova Revisita (Overlay sobreposto) */}
      <RevisitModal
        isOpen={isRevisitModalOpen}
        onClose={() => setIsRevisitModalOpen(false)}
        onSaved={(name) => {
          setRevisitCreatedName(name);
          setTimeout(() => setRevisitCreatedName(null), 4000);
        }}
      />
    </>
  );
};
