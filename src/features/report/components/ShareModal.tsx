import React, { useState, useMemo } from 'react';
import { X, Check, Copy, ClipboardCheck } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import { formatMonthLabel } from '../../../utils/date';
import { useTranslation } from '../../../i18n/I18nContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  bibleStudies: number;
  hoursFormatted: string;
  isAuxiliaryPioneer: boolean;
  hasReducedRequirement?: boolean;
  isPublisher: boolean;
  userRole?: string;
  onUpdateReport?: (patch: { isAuxiliaryPioneer?: boolean; hasReducedRequirement?: boolean }) => void;
  notes?: string;
  publisherName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  monthKey,
  bibleStudies,
  hoursFormatted,
  isAuxiliaryPioneer,
  hasReducedRequirement = false,
  isPublisher,
  userRole = 'publisher',
  onUpdateReport,
  notes,
  publisherName,
}) => {
  const { t, locale } = useTranslation();
  const [localIsAux, setLocalIsAux] = useState<boolean>(Boolean(isAuxiliaryPioneer));
  const [localHasReduced, setLocalHasReduced] = useState<boolean>(Boolean(hasReducedRequirement));
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  React.useEffect(() => {
    setLocalIsAux(Boolean(isAuxiliaryPioneer));
  }, [isAuxiliaryPioneer]);

  React.useEffect(() => {
    setLocalHasReduced(Boolean(hasReducedRequirement));
  }, [hasReducedRequirement]);

  const formattedMonth = formatMonthLabel(monthKey, locale);
  const uppercaseMonth = formattedMonth.toUpperCase();

  const handleToggleAux = (checked: boolean) => {
    triggerHaptic(8);
    setLocalIsAux(checked);
    const newReduced = checked ? localHasReduced : false;
    if (!checked) {
      setLocalHasReduced(false);
    }
    onUpdateReport?.({ isAuxiliaryPioneer: checked, hasReducedRequirement: newReduced });
  };

  const handleToggleReduced = (checked: boolean) => {
    triggerHaptic(8);
    setLocalHasReduced(checked);
    const newAux = checked ? true : localIsAux;
    if (checked && !localIsAux) {
      setLocalIsAux(true);
    }
    onUpdateReport?.({ isAuxiliaryPioneer: newAux, hasReducedRequirement: checked });
  };

  // Compilação do texto exato para copiar
  const previewText = useMemo(() => {
    const isPioneer =
      userRole === 'regular_pioneer' ||
      userRole === 'auxiliary_pioneer' ||
      (isPublisher && localIsAux);

    const lines: string[] = [
      t('share.template.title', { month: uppercaseMonth }),
      '────────────────────────────────',
      publisherName?.trim() ? t('share.template.publisher', { name: publisherName.trim() }) : '',
      t('share.template.bibleStudies', { count: bibleStudies }),
    ].filter(Boolean);

    if (isPioneer) {
      lines.push(t('share.template.hours', { hours: hoursFormatted }));

      if (isPublisher && localIsAux) {
        lines.push(localHasReduced ? t('share.template.auxYesSpecial') : t('share.template.auxYes'));
      } else if (userRole === 'auxiliary_pioneer') {
        lines.push(t('share.template.auxYes'));
      } else if (userRole === 'regular_pioneer') {
        lines.push(t('share.template.regularYes'));
      }
    }

    if (notes?.trim()) {
      lines.push(t('share.template.remarks', { notes: notes.trim() }));
    }

    lines.push('────────────────────────────────');
    lines.push(t('share.template.watermark'));

    return lines.join('\n');
  }, [
    uppercaseMonth,
    publisherName,
    bibleStudies,
    hoursFormatted,
    isPublisher,
    userRole,
    localIsAux,
    localHasReduced,
    notes,
    t,
  ]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    triggerHaptic(12);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(previewText);
        setCopiedFeedback(true);
        setTimeout(() => setCopiedFeedback(false), 2500);
      } catch {
        // Fallback para textarea temporário caso clipboard API falhe
        const textarea = document.createElement('textarea');
        textarea.value = previewText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedFeedback(true);
        setTimeout(() => setCopiedFeedback(false), 2500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-md border border-[#E1E1E1] dark:border-[#1F2E44] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho Midnight Blue (#001E62) */}
        <header className="h-14 bg-[#001E62] text-white px-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-white/90" />
            <h3 className="text-sm font-bold tracking-tight">
              {t('share.copyTitle', { month: formattedMonth })}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] mb-1.5">
              {t('share.previewLabel')}
            </label>
            <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] border border-[#E1E1E1] dark:border-[#25364E] text-[#111B1F] dark:text-[#F8FAFC] text-xs font-mono whitespace-pre-wrap leading-relaxed select-text max-h-60 overflow-y-auto">
              {previewText}
            </div>
          </div>

          {/* Opções Teocráticas do Mês — SOMENTE SE FOR PUBLICADOR */}
          {isPublisher && (
            <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] border border-[#E1E1E1] dark:border-[#25364E] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#001E62] dark:text-[#93C5FD] uppercase tracking-wider">
                  {t('share.thisMonthPublisher')}
                </span>
                <span className="text-[10px] text-[#657484] dark:text-[#94A3B8]">
                  {formattedMonth}
                </span>
              </div>

              {/* Checkbox: Mês como pioneiro auxiliar */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={localIsAux}
                  onChange={(e) => handleToggleAux(e.target.checked)}
                  className="w-4 h-4 rounded text-[#001E62] dark:text-[#3B82F6] focus:ring-[#001E62] border-[#657484]/40 accent-[#001E62] dark:accent-[#3B82F6]"
                />
                <span className="text-xs font-semibold text-[#111B1F] dark:text-[#F8FAFC]">
                  {t('share.monthAsAux')}
                </span>
              </label>

              {/* Checkbox: 50% (mês especial) */}
              <label
                className={`flex items-center gap-2.5 cursor-pointer select-none transition-opacity ${
                  localIsAux ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={localHasReduced && localIsAux}
                  onChange={(e) => handleToggleReduced(e.target.checked)}
                  className="w-4 h-4 rounded text-[#001E62] dark:text-[#3B82F6] focus:ring-[#001E62] border-[#657484]/40 accent-[#001E62] dark:accent-[#3B82F6]"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#111B1F] dark:text-[#F8FAFC]">
                    {t('share.special50')}
                  </span>
                  {!localIsAux && (
                    <span className="text-[10px] text-[#657484] dark:text-[#94A3B8]">
                      {t('share.enablesAux')}
                    </span>
                  )}
                </div>
              </label>
            </div>
          )}

          {copiedFeedback && (
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] text-xs font-bold border border-[#001E62]/30 dark:border-[#3B82F6]/40 animate-pulse">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('share.copiedNotice')}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-3 px-4 rounded-xl bg-[#001E62] hover:bg-[#001545] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#2563EB] dark:border dark:border-[#60A5FA]/40 text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t('share.copiedButton')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('share.copyButton')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-[#657484]/30 dark:border-[#25364E] text-[#657484] dark:text-[#CBD5E1] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#162236] transition-colors active:scale-95"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
