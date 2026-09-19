import React, { useState } from 'react';
import {
  BookOpen,

  RotateCcw,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';


import { db } from '../../db/db';
import {
  todayDateString,
  deriveMonthKeyFromDate,
  calculateServiceYearFromDate,
  formatMinutesToHHMM,
  parseHHMMToMinutes,
} from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';

export const RegisterView: React.FC = () => {
  // Estado do Lançamento Diário
  const [date, setDate] = useState(() => todayDateString());
  const [timeInput, setTimeInput] = useState('01:00');
  const [bibleStudies, setBibleStudies] = useState(0);
  const [returnVisitsCount, setReturnVisitsCount] = useState(0);
  const [notes, setNotes] = useState('');

  // Feedbacks
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [visitSaveSuccess, setVisitSaveSuccess] = useState(false);

  // Estado da Nova Revisita (Seção expansível)
  const [isRevisitOpen, setIsRevisitOpen] = useState(false);
  const [revisitName, setRevisitName] = useState('');
  const [revisitAddress, setRevisitAddress] = useState('');
  const [revisitTopic, setRevisitTopic] = useState('');
  const [revisitLastDate, setRevisitLastDate] = useState(() => todayDateString());
  const [revisitPublication, setRevisitPublication] = useState('');
  const [revisitNotes, setRevisitNotes] = useState('');

  // Minutos calculados
  const totalMinutes = parseHHMMToMinutes(timeInput);
  const isHighHours = totalMinutes > 12 * 60;

  // Incrementos Rápidos de Tempo
  const handleAddMinutes = (minsToAdd: number) => {
    triggerHaptic(8);
    const newTotal = totalMinutes + minsToAdd;
    setTimeInput(formatMinutesToHHMM(newTotal));
  };

  // Limpar formulário de lançamento
  const handleClear = () => {
    triggerHaptic(10);
    setDate(todayDateString());
    setTimeInput('01:00');
    setBibleStudies(0);
    setReturnVisitsCount(0);
    setNotes('');
  };

  // Salvar Lançamento Diário
  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(15);

    const monthKey = deriveMonthKeyFromDate(date);
    const serviceYear = calculateServiceYearFromDate(date);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    await db.dailyEntries.add({
      date,
      monthKey,
      serviceYear,
      hours: h,
      minutes: m,
      bibleStudies,
      returnVisitsCount,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // Reseta observações e mantém data
    setNotes('');
  };


  // Abrir Google Maps para endereço
  const handleOpenMaps = (addr: string) => {
    if (!addr.trim()) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Salvar Revisita
  const handleSaveRevisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisitName.trim()) return;

    triggerHaptic(15);
    const monthKey = deriveMonthKeyFromDate(revisitLastDate || todayDateString());

    await db.returnVisits.add({
      contactName: revisitName.trim(),
      monthKey,
      address: revisitAddress.trim() || undefined,
      topic: revisitTopic.trim() || undefined,
      lastVisitDate: revisitLastDate || todayDateString(),
      publication: revisitPublication.trim() || undefined,
      notes: revisitNotes.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setVisitSaveSuccess(true);
    setTimeout(() => setVisitSaveSuccess(false), 3000);

    // Limpa campos da revisita
    setRevisitName('');
    setRevisitAddress('');
    setRevisitTopic('');
    setRevisitPublication('');
    setRevisitNotes('');
  };

  return (
    <div className="space-y-4 pb-6 animate-fade-in">
      {/* 🟢 CARD PRINCIPAL: NOVO LANÇAMENTO */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 shadow-sm border border-[#E9EDEF] dark:border-[#2A3942]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9EDEF] dark:border-[#2A3942]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
            <h2 className="text-sm font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
              Novo Lançamento Diário
            </h2>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-1 text-xs text-[#019444] dark:text-[#01D65A] font-semibold bg-[#01D65A]/10 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvo!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveDaily} className="space-y-4 pt-3.5">
          {/* 📅 Data do Lançamento */}
          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              📅 Data do Serviço
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3.5 py-2.5 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A] transition-colors"
              />
            </div>
          </div>

          {/* ⏱️ Horas do Dia com Incrementos Rápidos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#657484] dark:text-[#8696A0]">
                ⏱️ Tempo no Ministério (hh:mm)
              </label>
              <span className="text-xs text-[#008069] dark:text-[#01D65A] font-bold">
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </span>
            </div>

            {/* Input centralizado formato hh:mm */}
            <div className="relative mb-2">
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="00:00"
                className="w-full text-center font-mono text-2xl font-bold bg-[#F0F2F5] dark:bg-[#111B26] text-[#008069] dark:text-[#01D65A] py-2.5 rounded-xl border-2 border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:border-[#01D65A] tracking-widest"
              />
            </div>

            {/* Botões Rápidos de Incremento */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: '+5min', value: 5 },
                { label: '+10min', value: 10 },
                { label: '+15min', value: 15 },
                { label: '+30min', value: 30 },
                { label: '+1h', value: 60 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => handleAddMinutes(btn.value)}
                  className="py-1.5 text-xs font-bold rounded-lg bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] hover:bg-[#01D65A] hover:text-white transition-colors active:scale-95 border border-[#01D65A]/20"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Aviso de valor alto > 12h */}
            {isHighHours && (
              <div className="mt-2.5 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>⚠️ Atenção: valor alto ({Math.floor(totalMinutes / 60)}h). Confirmar antes de salvar?</span>
              </div>
            )}
          </div>

          {/* Contadores do Dia (Grid 2 colunas com Steppers) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Estudos Bíblicos */}
            <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-2.5 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942]">
              <div className="flex items-center gap-1.5 text-xs text-[#657484] dark:text-[#8696A0] font-semibold mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#008069] dark:text-[#01D65A]" />
                <span>Estudos Bíblicos</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setBibleStudies((p) => Math.max(0, p - 1));
                  }}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-[#1F2C34] text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shadow-xs border border-[#E9EDEF] dark:border-[#2A3942] active:scale-95"
                >
                  -
                </button>
                <span className="font-bold text-base text-slate-800 dark:text-white">
                  {bibleStudies}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setBibleStudies((p) => p + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-[#01D65A] text-white font-bold flex items-center justify-center shadow-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Revisitas Feitas */}
            <div className="bg-[#F0F2F5] dark:bg-[#111B26] p-2.5 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942]">
              <div className="flex items-center gap-1.5 text-xs text-[#657484] dark:text-[#8696A0] font-semibold mb-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#008069] dark:text-[#01D65A]" />
                <span>Revisitas Feitas</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setReturnVisitsCount((p) => Math.max(0, p - 1));
                  }}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-[#1F2C34] text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shadow-xs border border-[#E9EDEF] dark:border-[#2A3942] active:scale-95"
                >
                  -
                </button>
                <span className="font-bold text-base text-slate-800 dark:text-white">
                  {returnVisitsCount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setReturnVisitsCount((p) => p + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-[#01D65A] text-white font-bold flex items-center justify-center shadow-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>


          {/* 📝 Observações do Dia */}
          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              📝 Observações do dia
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Saída de campo com o irmão Carlos..."
              className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A] transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Ações: Limpar e Salvar */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#657484]/30 text-[#657484] dark:text-[#8696A0] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>

            <button
              type="submit"
              className="flex-2 py-2.5 px-4 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Lançamento</span>
            </button>
          </div>
        </form>
      </section>

      {/* 👤 SEÇÃO RECOLHÍVEL: NOVA REVISITA */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 shadow-sm border border-[#E9EDEF] dark:border-[#2A3942]">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            setIsRevisitOpen((p) => !p);
          }}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#008069] dark:text-[#01D65A]" />
            <span className="text-sm font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
              Nova Revisita / Contato
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#657484] dark:text-[#8696A0]">
            <span className="text-xs font-medium">{isRevisitOpen ? 'Recolher' : 'Expandir'}</span>
            {isRevisitOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isRevisitOpen && (
          <form onSubmit={handleSaveRevisit} className="space-y-3.5 pt-4 border-t border-[#E9EDEF] dark:border-[#2A3942] mt-3 animate-fade-in">
            {visitSaveSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-[#019444] dark:text-[#01D65A] font-semibold bg-[#01D65A]/10 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>Revisita cadastrada com sucesso!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                Nome do Morador *
              </label>
              <input
                type="text"
                required
                value={revisitName}
                onChange={(e) => setRevisitName(e.target.value)}
                placeholder="Ex: Dona Maria"
                className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                Endereço
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={revisitAddress}
                  onChange={(e) => setRevisitAddress(e.target.value)}
                  placeholder="Rua das Flores, 123"
                  className="flex-1 bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
                />
                {revisitAddress.trim() && (
                  <button
                    type="button"
                    onClick={() => handleOpenMaps(revisitAddress)}
                    title="Ver no Google Maps"
                    className="p-2.5 rounded-xl bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] hover:bg-[#01D65A] hover:text-white transition-colors border border-[#01D65A]/20"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                  Assunto Tratado
                </label>
                <input
                  type="text"
                  value={revisitTopic}
                  onChange={(e) => setRevisitTopic(e.target.value)}
                  placeholder="Sobre o Reino..."
                  className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                  Data da Visita
                </label>
                <input
                  type="date"
                  value={revisitLastDate}
                  onChange={(e) => setRevisitLastDate(e.target.value)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                Publicação Deixada
              </label>
              <input
                type="text"
                value={revisitPublication}
                onChange={(e) => setRevisitPublication(e.target.value)}
                placeholder="Ex: Livro Seja Feliz para Sempre"
                className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                Anotações
              </label>
              <textarea
                rows={2}
                value={revisitNotes}
                onChange={(e) => setRevisitNotes(e.target.value)}
                placeholder="Disponível às terças pela manhã..."
                className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Revisita</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
