import React, { useState } from 'react';
import { X, User, Check, MapPin, Navigation, Loader2, Clock } from 'lucide-react';

import { triggerHaptic } from '../../../utils/haptics';
import { todayDateString, suggestVisitTime } from '../../../utils/date';
import { getCurrentCoordinates, reverseGeocode, getGoogleMapsUrl, getGeolocationErrorMessage } from '../../../utils/geolocation';

interface NewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    contactName: string;
    address?: string;
    number?: string;
    complement?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    topic?: string;
    publication?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    notes?: string;
  }) => Promise<void>;
}

export const NewVisitModal: React.FC<NewVisitModalProps> = ({ isOpen, onClose, onSave }) => {
  const [contactName, setContactName] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const [topic, setTopic] = useState('');
  const [publication, setPublication] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => todayDateString());
  const [scheduledTime, setScheduledTime] = useState(() => suggestVisitTime());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentLocation = async () => {
    triggerHaptic(10);
    setIsLocating(true);
    setLocationStatus('Obtendo GPS...');

    try {
      const coords = await getCurrentCoordinates();
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);

      const geocode = await reverseGeocode(coords.latitude, coords.longitude);

      if (geocode.address) {
        setAddress(geocode.address);
      }
      if (geocode.number && !number) {
        setNumber(geocode.number);
      }
      if (geocode.city) {
        setCity(geocode.city);
      }

      setLocationStatus('Localização preenchida via GPS!');
      setTimeout(() => setLocationStatus(null), 3500);
    } catch (err: unknown) {
      setLocationStatus(getGeolocationErrorMessage(err));
      setTimeout(() => setLocationStatus(null), 6000);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    triggerHaptic(12);
    setIsSubmitting(true);
    try {
      await onSave({
        contactName: contactName.trim(),
        address: address.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        city: city.trim() || undefined,
        latitude,
        longitude,
        topic: topic.trim() || undefined,
        publication: publication.trim() || undefined,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        notes: notes.trim() || undefined,
      });
      setContactName('');
      setAddress('');
      setNumber('');
      setComplement('');
      setCity('');
      setLatitude(undefined);
      setLongitude(undefined);
      setTopic('');
      setPublication('');
      setScheduledDate(todayDateString());
      setScheduledTime(suggestVisitTime());
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMaps = () => {
    triggerHaptic(8);
    const url = getGoogleMapsUrl({
      address,
      number,
      complement,
      city,
      latitude,
      longitude,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-md border border-[#E9EDEF] dark:border-[#1F2E44] shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Cabeçalho do Modal Midnight Blue */}
        <div className="flex items-center justify-between p-4 border-b border-[#001545] dark:border-[#1F2E44] bg-[#001E62] text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-white/90" />
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
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
              Nome do contato *
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: Dona Maria"
              className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#657484] dark:text-[#CBD5E1]">
                  <MapPin className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                  <span>Rua / Logradouro</span>
                </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1D4ED8] transition-colors text-[11px] font-bold border border-[#001E62]/30 dark:border-[#3B82F6]/40 disabled:opacity-50"
                title="Obter localização atual por GPS"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{isLocating ? 'Obtendo GPS...' : 'Obter GPS'}</span>
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua das Flores"
                className="flex-1 text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
              {(address.trim() || latitude) && (
                <button
                  type="button"
                  onClick={handleOpenMaps}
                  title="Abrir no Google Maps"
                  className="p-2.5 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1D4ED8] transition-colors border border-[#001E62]/20 dark:border-[#3B82F6]/40 shrink-0"
                >
                  <span className="text-base">🗺️</span>
                </button>
              )}
            </div>

            {locationStatus && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 animate-fade-in">
                <span>📍</span>
                <span>{locationStatus}</span>
              </p>
            )}
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
                Número
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ex: 123 ou S/N"
                className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Ex: Apto 102, Bloco B"
                className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo"
              className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
                Assunto tratado
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Reino de Deus"
                className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
                Data prevista
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* Horário previsto e sugestão */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#657484] dark:text-[#CBD5E1]">
                <Clock className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                <span>Horário previsto</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(5);
                  setScheduledTime(suggestVisitTime());
                }}
                className="text-[10px] text-[#001E62] dark:text-[#93C5FD] font-semibold hover:underline"
                title="Sugerir horário"
              >
                Sugerir
              </button>
            </div>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />

            {/* Atalhos rápidos de horário */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="text-[10px] text-[#657484] dark:text-[#94A3B8] font-medium">
                Atalhos:
              </span>
              {['09:30', '10:00', '11:00', '14:30', '16:00'].map((timeOption) => (
                <button
                  key={timeOption}
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setScheduledTime(timeOption);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors border ${
                    scheduledTime === timeOption
                      ? 'bg-[#001E62] text-white dark:bg-[#2563EB] border-[#001E62] dark:border-[#3B82F6] font-bold'
                      : 'bg-[#F0F2F5] dark:bg-[#0B1320] text-[#657484] dark:text-[#CBD5E1] border-[#E9EDEF] dark:border-[#25364E]'
                  }`}
                >
                  {timeOption}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
              Publicação deixada
            </label>
            <input
              type="text"
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              placeholder="Ex: Livro Viver Feliz"
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1">
              Notas adicionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes ou melhor horário para visitar..."
              className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-slate-900 dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E9EDEF] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6] resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#657484]/30 dark:border-[#25364E] text-[#657484] dark:text-[#CBD5E1] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#162236] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#001E62] hover:bg-[#001545] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#2563EB] dark:border dark:border-[#60A5FA]/40 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar Revisita</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
