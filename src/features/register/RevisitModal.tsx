import React, { useState } from 'react';
import { ArrowLeft, Check, MapPin, User, Calendar, Clock, FileText, Ban, Navigation, Loader2 } from 'lucide-react';
import { db } from '../../db/db';
import { todayDateString, deriveMonthKeyFromDate, suggestVisitTime } from '../../utils/date';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';
import { getCurrentCoordinates, reverseGeocode, getGoogleMapsUrl, getGeolocationErrorMessage } from '../../utils/geolocation';

interface RevisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (revisitName: string) => void;
}

export const RevisitModal: React.FC<RevisitModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [contactName, setContactName] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const [scheduledDate, setScheduledDate] = useState(() => todayDateString());
  const [scheduledTime, setScheduledTime] = useState(() => suggestVisitTime());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentLocation = async () => {
    triggerHaptic(10);
    setIsLocating(true);
    setLocationStatus(t('revisit.gettingLocation'));

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

      setLocationStatus(t('revisit.locationSuccess'));
      setTimeout(() => setLocationStatus(null), 3500);
    } catch (err: unknown) {
      setLocationStatus(getGeolocationErrorMessage(err));
      setTimeout(() => setLocationStatus(null), 6000);
    } finally {
      setIsLocating(false);
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
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        city: city.trim() || undefined,
        latitude,
        longitude,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
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

          {/* 📍 Endereço com botão GPS e Maps */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1]">
                <MapPin className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                <span>{t('revisit.address')}</span>
              </label>

              {/* Botão Obter Localização Atual */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1D4ED8] transition-colors text-[11px] font-bold border border-[#001E62]/30 dark:border-[#3B82F6]/40 disabled:opacity-50"
                title={t('revisit.getLocation')}
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{isLocating ? t('revisit.gettingLocation') : t('revisit.getLocation')}</span>
              </button>
            </div>

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
                disabled={!address.trim() && !latitude}
                title={t('home.openMaps')}
                className="px-3 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white dark:hover:bg-[#1D4ED8] transition-colors border border-[#001E62]/30 dark:border-[#3B82F6]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              >
                <span className="text-base">🗺️</span>
              </button>
            </div>

            {locationStatus && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 animate-fade-in">
                <span>📍</span>
                <span>{locationStatus}</span>
              </p>
            )}
          </div>

          {/* 🔢 Número e Complemento */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
                {t('revisit.number')}
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder={t('revisit.numberPlaceholder')}
                className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
                {t('revisit.complement')}
              </label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder={t('revisit.complementPlaceholder')}
                className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* 🏙️ Cidade */}
          <div>
            <label className="block text-xs font-semibold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
              {t('revisit.city')}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('revisit.cityPlaceholder')}
              className="w-full text-sm bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
            />
          </div>

          {/* 📅 Data e Horário Previstos */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                <span>{t('revisit.scheduledDate')}</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#111B1F] dark:text-[#CBD5E1]">
                  <Clock className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
                  <span>{t('revisit.scheduledTime')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setScheduledTime(suggestVisitTime());
                  }}
                  className="text-[10px] text-[#001E62] dark:text-[#93C5FD] font-semibold hover:underline"
                  title={t('revisit.suggestTimeHint')}
                >
                  {t('revisit.suggest')}
                </button>
              </div>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full text-xs bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* Atalhos rápidos de horário */}
          <div className="flex items-center gap-1.5 flex-wrap -mt-1">
            <span className="text-[10px] text-[#5C6B7E] dark:text-[#94A3B8] font-medium">
              {t('revisit.quickHours')}:
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
                    : 'bg-[#F0F2F5] dark:bg-[#0B1320] text-[#5C6B7E] dark:text-[#CBD5E1] border-[#E1E1E1] dark:border-[#25364E] hover:border-[#001E62]/40'
                }`}
              >
                {timeOption}
              </button>
            ))}
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
