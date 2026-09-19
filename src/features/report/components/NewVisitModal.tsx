import React, { useState } from 'react';
import { X, User, Check, MapPin } from 'lucide-react';

import { triggerHaptic } from '../../../utils/haptics';
import { todayDateString } from '../../../utils/date';

interface NewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    contactName: string;
    address?: string;
    topic?: string;
    publication?: string;
    scheduledDate?: string;
    notes?: string;
  }) => Promise<void>;
}

export const NewVisitModal: React.FC<NewVisitModalProps> = ({ isOpen, onClose, onSave }) => {
  const [contactName, setContactName] = useState('');
  const [address, setAddress] = useState('');
  const [topic, setTopic] = useState('');
  const [publication, setPublication] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => todayDateString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    triggerHaptic(12);
    setIsSubmitting(true);
    try {
      await onSave({
        contactName: contactName.trim(),
        address: address.trim() || undefined,
        topic: topic.trim() || undefined,
        publication: publication.trim() || undefined,
        scheduledDate: scheduledDate || undefined,
        notes: notes.trim() || undefined,
      });
      setContactName('');
      setAddress('');
      setTopic('');
      setPublication('');
      setScheduledDate(todayDateString());
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMaps = () => {
    if (!address.trim()) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md border border-[#E9EDEF] dark:border-[#2A3942] shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-[#E9EDEF] dark:border-[#2A3942] bg-[#008069] dark:bg-[#1F2C34] text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#01D65A]" />
            <h3 className="text-sm font-bold tracking-tight">
              Nova Revisita / Contato
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              Nome do contato *
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: Dona Maria"
              className="w-full text-sm bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              Endereço
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua das Flores, 123"
                className="flex-1 text-sm bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
              {address.trim() && (
                <button
                  type="button"
                  onClick={handleOpenMaps}
                  title="Abrir no Google Maps"
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
                Assunto tratado
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Reino de Deus"
                className="w-full text-xs bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                Data prevista
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              Publicação deixada
            </label>
            <input
              type="text"
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              placeholder="Ex: Livro Viver Feliz"
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              Notas adicionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes ou melhor horário para visitar..."
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#111B26] text-slate-900 dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#2A3942] focus:outline-none focus:ring-2 focus:ring-[#01D65A] resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#657484]/30 text-[#657484] dark:text-[#8696A0] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Revisita</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
