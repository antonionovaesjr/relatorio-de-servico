import React, { useState, useMemo } from 'react';
import { X, Share2, Check, Copy } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import { formatMonthLabel } from '../../../utils/date';

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
  const [localIsAux, setLocalIsAux] = useState<boolean>(Boolean(isAuxiliaryPioneer));
  const [localHasReduced, setLocalHasReduced] = useState<boolean>(Boolean(hasReducedRequirement));
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  React.useEffect(() => {
    setLocalIsAux(Boolean(isAuxiliaryPioneer));
  }, [isAuxiliaryPioneer]);

  React.useEffect(() => {
    setLocalHasReduced(Boolean(hasReducedRequirement));
  }, [hasReducedRequirement]);

  const formattedMonth = formatMonthLabel(monthKey);
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

  // Compilação do texto exato no formato WhatsApp v9
  const previewText = useMemo(() => {
    const lines: string[] = [
      `RELATÓRIOS DE ${uppercaseMonth}`,
      '────────────────────────────────',
      publisherName?.trim() ? `Publicador: ${publisherName.trim()}` : '',
      `Total de estudos: ${bibleStudies}`,
      `Total de horas: ${hoursFormatted}`,
    ].filter(Boolean);

    if (isPublisher) {
      if (localIsAux) {
        lines.push(`Pioneiro auxiliar: ☑ Sim${localHasReduced ? ' (50% — mês especial)' : ''}`);
      } else {
        lines.push(`Pioneiro auxiliar: ☐ Não`);
      }
    } else if (userRole === 'auxiliary_pioneer') {
      lines.push(`Pioneiro auxiliar: ☑ Sim`);
    } else if (userRole === 'regular_pioneer') {
      lines.push(`Pioneiro regular: ☑ Sim`);
    }

    if (notes?.trim()) {
      lines.push(`Observações: ${notes.trim()}`);
    }

    lines.push('────────────────────────────────');
    lines.push('Gerado pelo Relógio de Serviço PWA 🟢');

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
  ]);

  if (!isOpen) return null;

  const handleShare = async () => {
    triggerHaptic(15);
    const title = `Relatório de Serviço — ${formattedMonth}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: previewText,
        });
        onClose();
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: abrir direto no WhatsApp ou copiar
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(previewText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    triggerHaptic(10);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(previewText);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-md border border-[#E1E1E1] dark:border-[#2A3942] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <header className="h-14 bg-[#01D65A] text-white px-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">📤</span>
            <h3 className="text-sm font-bold tracking-tight">
              Compartilhar Relatórios — {formattedMonth}
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
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1.5">
              💬 Prévia do texto compartilhado
            </label>
            <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] border border-[#E1E1E1] dark:border-[#2A3942] text-[#111B1F] dark:text-[#E9EDEF] text-xs font-mono whitespace-pre-wrap leading-relaxed select-text max-h-64 overflow-y-auto">
              {previewText}
            </div>
          </div>

          {/* Opções Teocráticas do Mês — SOMENTE SE FOR PUBLICADOR */}
          {isPublisher && (
            <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] border border-[#E1E1E1] dark:border-[#2A3942] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#008069] dark:text-[#01D65A] uppercase tracking-wider">
                  Neste mês (Publicador)
                </span>
                <span className="text-[10px] text-[#657484] dark:text-[#8696A0]">
                  {formattedMonth}
                </span>
              </div>

              {/* Checkbox: Mês como pioneiro auxiliar */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={localIsAux}
                  onChange={(e) => handleToggleAux(e.target.checked)}
                  className="w-4 h-4 rounded text-[#01D65A] focus:ring-[#01D65A] border-[#657484]/40 accent-[#01D65A]"
                />
                <span className="text-xs font-semibold text-[#111B1F] dark:text-[#E9EDEF]">
                  Mês como pioneiro auxiliar
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
                  className="w-4 h-4 rounded text-[#01D65A] focus:ring-[#01D65A] border-[#657484]/40 accent-[#01D65A]"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#111B1F] dark:text-[#E9EDEF]">
                    50% (mês especial)
                  </span>
                  {!localIsAux && (
                    <span className="text-[10px] text-[#657484] dark:text-[#8696A0]">
                      (ativa pioneiro aux.)
                    </span>
                  )}
                </div>
              </label>
            </div>
          )}

          {copiedFeedback && (
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] text-xs font-semibold">
              <Check className="w-4 h-4" />
              <span>Copiado para a área de transferência!</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl border border-[#657484]/30 bg-[#F0F2F5] dark:bg-[#111B26] hover:bg-slate-200 dark:hover:bg-slate-800 text-[#111B1F] dark:text-[#E9EDEF] text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#657484]/30 text-[#657484] dark:text-[#8696A0] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
