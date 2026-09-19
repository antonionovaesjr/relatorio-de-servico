import React, { useState } from 'react';
import { ArrowLeft, Check, MapPin, User, Calendar, FileText, Ban } from 'lucide-react';
import { db } from '../../db/db';
import { todayDateString, deriveMonthKeyFromDate } from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';

interface RevisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (revisitName: string) => void;
}

export const RevisitModal: React.FC<RevisitModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [contactName, setContactName] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => todayDateString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOpenMaps = () => {
    if (!address.trim()) return;
    triggerHaptic(8);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    triggerHaptic(15);
    setIsSubmitting(true);

    try {
      const monthKey = deriveMonthKeyFromDate(scheduledDate || todayDateString());
      await db.returnVisits.add({
        contactName: contactName.trim(),
        monthKey,
        address: address.trim() || undefined,
        scheduledDate: scheduledDate || undefined,
        notes: notes.trim(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (onSaved) {
        onSaved(contactName.trim());
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-md border border-[#E1E1E1] dark:border-[#1F2E44] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 🟦 Cabeçalho Midnight Blue (#001E62) — altura 56px */}
        <header className="h-14 bg-[#001E62] text-white px-4 flex items-center justify-between shrink-0 shadow-sm">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              onClose();
            }}
            className="flex items-center gap-1 text-white/90 hover:text-white text-xs font-bold transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </button>

          <h2 className="text-base font-bold tracking-tight text-white">
            {t('revisit.modalTitle')}
          </h2>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !contactName.trim()}
            className="flex items-center gap-1 text-white/90 hover:text-white text-xs font-bold transition-opacity disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('common.save')}</span>
          </button>
        </header>

        {/* Conteúdo do Formulário */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* 👤 Nome do contato */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
              <User className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
              <span>{t('revisit.contactName')}</span>
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={t('revisit.contactPlaceholder')}
              className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />
          </div>

          {/* 📍 Endereço com botão Maps */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
              <span>{t('revisit.address')}</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('revisit.addressPlaceholder')}
                className="flex-1 text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
              <button
                type="button"
                onClick={handleOpenMaps}
                disabled={!address.trim()}
                title={t('home.openMaps')}
                className="px-3 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1D4ED8] transition-colors border border-[#001E62]/30 dark:border-[#3B82F6]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span className="text-base">🗺️</span>
              </button>
            </div>
            <p className="text-[10px] text-[#657484] dark:text-[#94A3B8] mt-1">
              {t('revisit.openMapsHint')}
            </p>
          </div>

          {/* 📅 Data prevista */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
              <span>{t('revisit.scheduledDate')}</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />
          </div>

          {/* 📝 Notas (opcional) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
              <FileText className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
              <span>{t('revisit.notes')}</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('revisit.notesPlaceholder')}
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6] resize-none"
            />
          </div>

          {/* Botões de Ação Inferiores */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !contactName.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-[#001E62] hover:bg-[#001545] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#2563EB] dark:border dark:border-[#60A5FA]/40 text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('revisit.saveRevisit')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                onClose();
              }}
              className="py-3 px-4 rounded-xl border border-[#657484]/30 dark:border-[#25364E] text-[#657484] dark:text-[#CBD5E1] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#162236] transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{t('common.cancel')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
