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
import { useTranslation } from '../../i18n/I18nContext';
import { RevisitModal } from './RevisitModal';
import { ModalPortal } from '../../components/common/ModalPortal';

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
  const { t } = useTranslation();
  const settings = useUserSettings();

  // Estado do Lançamento
  const [date, setDate] = useState(() => todayDateString());
  const [studies, setStudies] = useState(0);
  const [timeInput, setTimeInput] = useState('00:00');
  const [notes, setNotes] = useState('');
  const [isTimeInvalid, setIsTimeInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ao abrir o modal para novo registro, a data sugerida é a atual e a hora vem 00:00
  React.useEffect(() => {
    if (isOpen) {
      setDate(todayDateString());
      setTimeInput('00:00');
      setStudies(0);
      setNotes('');
      setIsTimeInvalid(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

  // Ajuste rápido de minutos (incremento ou decremento/correção)
  const handleAdjustMinutes = (mins: number) => {
    triggerHaptic(8);
    const parsed = tryParseTimeToMinutes(timeInput);
    const currentMins = parsed.isValid ? parsed.minutes : 0;
    const nextMins = Math.max(0, currentMins + mins);
    setTimeInput(formatMinutesToHHMM(nextMins));
    setIsTimeInvalid(false);
  };

  // Zerar horas para correção imediata
  const handleResetTime = () => {
    triggerHaptic(10);
    setTimeInput('00:00');
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
      <ModalPortal isOpen={isOpen}>
        <div className="fixed inset-0 z-[100] w-screen h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-modal-backdrop overflow-y-auto">
          <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-md border-2 border-[#001E62] dark:border-[#3B82F6] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] my-auto animate-modal-card">
            {/* 🟦 Cabeçalho Midnight Blue (#001E62) — altura 56px */}
            <header className="h-14 bg-[#001E62] dark:bg-[#0C1527] text-white px-4 flex items-center justify-between shrink-0 shadow-sm border-b dark:border-[#1E2D48]">
              <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                onClose();
              }}
              className="flex items-center gap-1 text-white/90 hover:text-white text-xs font-bold transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.cancel')}</span>
            </button>

            <h2 className="text-base font-bold tracking-tight text-white">
              {t('dailyEntry.modalTitleNew')}
            </h2>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-white/90 hover:text-white text-xs font-bold transition-opacity disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('common.save')}</span>
            </button>
          </header>

          {/* Conteúdo Formulário */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {/* 🗓️ Data */}
            <div className="bg-[#F0F2F5] dark:bg-[#0B1320] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#202E42]">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                <span>🗓️ {t('dailyEntry.serviceDate')}</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E1E1E1] dark:border-[#25364E] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
              />
            </div>

            {/* 📝 Estudos bíblicos */}
            <div className="bg-[#F0F2F5] dark:bg-[#0B1320] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#202E42] overflow-hidden">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                <span>📝 {t('dailyEntry.bibleStudies')}</span>
              </label>
              <div className="flex items-center justify-between gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setStudies((p) => Math.max(0, p - 1));
                  }}
                  className="shrink-0 w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
                  aria-label="Diminuir estudos"
                >
                  -
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={studies}
                  onChange={(e) => setStudies(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="min-w-0 flex-1 bg-white dark:bg-[#111A29] text-center font-bold text-lg text-[#111B1F] dark:text-[#F8FAFC] h-10 py-1 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#60A5FA] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setStudies((p) => p + 1);
                  }}
                  className="shrink-0 w-10 h-10 rounded-xl bg-[#001E62] dark:bg-[#1D4ED8] hover:bg-[#001545] dark:hover:bg-[#2563EB] text-white font-bold text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
                  aria-label="Aumentar estudos"
                >
                  +
                </button>
              </div>
            </div>

            {/* Opção teocrática rápida para Publicador neste mês */}
            {settings.role === 'publisher' && (
              <div className={`flex items-center justify-between p-2.5 rounded-xl border select-none transition-colors ${
                monthReport?.isAuxiliaryPioneer
                  ? 'bg-[#E8EEF8] dark:bg-[#172554] border-[#001E62] dark:border-[#3B82F6]'
                  : 'bg-[#F0F2F5] dark:bg-[#0B1320] border-[#E1E1E1] dark:border-[#202E42]'
              }`}>
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
                    className="w-4 h-4 rounded text-[#001E62] dark:text-[#2563EB] focus:ring-[#001E62] border-[#657484]/40 accent-[#001E62] dark:accent-[#2563EB]"
                  />
                  <span className="text-xs font-semibold text-[#111B1F] dark:text-[#F8FAFC]">
                    {t('dailyEntry.auxPioneerThisMonth')}
                  </span>
                </label>
                {monthReport?.isAuxiliaryPioneer && (
                  <span className="text-[10px] text-[#001E62] dark:text-[#93C5FD] font-bold">
                    {monthReport.hasReducedRequirement ? t('dailyEntry.reducedTag') : t('dailyEntry.standardTag')}
                  </span>
                )}
              </div>
            )}

            {/* ⏰ Horas (se pioneiro ou publicador no mês como auxiliar) */}
            {isPioneerThisMonth ? (
              <div className="bg-[#F0F2F5] dark:bg-[#0B1320] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#202E42] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1]">
                    <Clock className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                    <span>⏰ {t('dailyEntry.hoursLabel')}</span>
                  </label>
                  <span className="text-[11px] text-[#5C6B7E] dark:text-[#94A3B8]">
                    {t('dailyEntry.hoursPlaceholder')}
                  </span>
                </div>

                {/* Input editável central com destaque e botão rápido de zerar */}
                <div className="relative">
                  <input
                    type="text"
                    value={timeInput}
                    onChange={handleTimeChange}
                    onBlur={handleTimeBlur}
                    placeholder="00:00"
                    className={`w-full text-center font-mono text-2xl font-bold py-2 rounded-xl border-2 transition-colors ${
                      isTimeInvalid
                        ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 dark:border-red-600'
                        : 'border-[#001E62]/30 dark:border-[#3B82F6]/50 bg-white dark:bg-[#111A29] text-[#001E62] dark:text-[#60A5FA] focus:border-[#001E62] dark:focus:border-[#60A5FA]'
                    } focus:outline-none tracking-widest`}
                  />
                  {timeInput !== '00:00' && (
                    <button
                      type="button"
                      onClick={handleResetTime}
                      title={t('dailyEntry.resetTime')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-bold rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-900"
                    >
                      {t('dailyEntry.resetTime')}
                    </button>
                  )}
                  {isTimeInvalid && (
                    <p className="text-[10px] text-red-500 font-semibold text-center mt-1">
                      {t('dailyEntry.invalidFormat')}
                    </p>
                  )}
                </div>

                {/* Correção de Lançamento: Reduzir / Corrigir tempo */}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400 mb-1 flex items-center justify-between">
                    <span>{t('dailyEntry.quickCorrections')}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '-1h', val: -60 },
                      { label: '-30min', val: -30 },
                      { label: '-15min', val: -15 },
                      { label: '-5min', val: -5 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleAdjustMinutes(btn.val)}
                        className="py-1 text-[11px] font-bold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 active:scale-95 text-center transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adição Rápida de tempo */}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#001E62] dark:text-[#93C5FD] mb-1">
                    <span>{t('dailyEntry.addHours')}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
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
                        onClick={() => handleAdjustMinutes(btn.val)}
                        className="py-1 text-[11px] font-bold rounded-lg bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1E3A8A] transition-colors border border-[#001E62]/30 dark:border-[#3B82F6]/40 active:scale-95 text-center"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F0F2F5] dark:bg-[#0B1320] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#202E42] text-xs text-[#5C6B7E] dark:text-[#CBD5E1] leading-relaxed">
                {t('dailyEntry.publisherNotice')}
              </div>
            )}

            {/* 📝 Observações */}
            <div className="bg-[#F0F2F5] dark:bg-[#0B1320] p-3 rounded-xl border border-[#E1E1E1] dark:border-[#202E42]">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                <span>📝 {t('dailyEntry.dayNotes')}</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('dailyEntry.dayNotesPlaceholder')}
                className="w-full bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E1E1E1] dark:border-[#25364E] text-xs focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA] resize-none"
              />
            </div>

            {/* Ações: Salvar e Limpar */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-[#001E62] hover:bg-[#001545] dark:bg-[#1D4ED8] hover:dark:bg-[#2563EB] text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 dark:border dark:border-[#60A5FA]/40"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{t('dailyEntry.saveEntry')}</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="py-3 px-4 rounded-xl bg-transparent border-2 border-[#001E62] dark:border-[#3B82F6]/60 text-[#001E62] dark:text-[#93C5FD] hover:bg-[#E8EEF8]/40 dark:hover:bg-[#172554] text-xs font-bold transition-colors active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('dailyEntry.clearBtn')}</span>
              </button>
            </div>

            {/* ⛔ Aviso de Compartilhamento */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>⛔ {t('dailyEntry.sharingUnavailableNotice')}</strong> {t('dailyEntry.sharingUnavailableDetails')} <strong>{t('dailyEntry.reportsTabName')}</strong>.
              </span>
            </div>

            {/* Feedback se acabou de cadastrar revisita */}
            {revisitCreatedName && (
              <div className="flex items-center gap-1.5 text-xs text-[#001E62] dark:text-[#93C5FD] font-semibold bg-[#E8EEF8] dark:bg-[#172554] p-2 rounded-xl border border-[#001E62]/30 dark:border-[#3B82F6]/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('dailyEntry.revisitSavedSuccess', { name: revisitCreatedName })}</span>
              </div>
            )}

            {/* 📌 Botão para Nova Janela de Revisita Independente */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setIsRevisitModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] hover:bg-slate-200 dark:hover:bg-[#162236] border-2 border-dashed border-[#001E62] dark:border-[#3B82F6]/60 text-[#001E62] dark:text-[#93C5FD] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dailyEntry.independentRevisitBtn')}</span>
            </button>
            </div>
          </div>
        </div>
      </ModalPortal>

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
