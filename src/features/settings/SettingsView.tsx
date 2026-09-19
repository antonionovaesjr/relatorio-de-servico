import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Calendar,
  Clock,
  Bell,
  Sun,
  Moon,
  Smartphone,
  Download,
  Share2,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Check,
} from 'lucide-react';

import {
  db,
  useUserSettings,
  exportDatabaseToJson,
  downloadBackupFile,
  importDatabaseFromJson,
} from '../../db/db';
import type { UserSettings, UserRole, AppTheme, AppLanguage } from '../../types/models';
import { triggerHaptic } from '../../utils/haptics';

interface SettingsViewProps {
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange }) => {
  const settings = useUserSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Atualização atômica das configurações
  const updateSettings = async (patch: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...settings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.settings.put(updated);
  };

  // Upload de Foto de Avatar (DataURL local)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic(10);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateSettings({ avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Alterar Papel / Designação
  const handleRoleChange = (role: UserRole) => {
    triggerHaptic(10);
    const regularPioneerConfig =
      role === 'regular_pioneer'
        ? settings.regularPioneerConfig || {
            startMonthYear: new Date().toISOString().slice(0, 7),
            monthlyTargetHours: 50,
          }
        : settings.regularPioneerConfig;

    const auxiliaryPioneerConfig =
      role === 'auxiliary_pioneer'
        ? settings.auxiliaryPioneerConfig || {
            startMonthYear: new Date().toISOString().slice(0, 7),
            monthlyTargetHours: 30,
          }
        : settings.auxiliaryPioneerConfig;

    updateSettings({
      role,
      regularPioneerConfig,
      auxiliaryPioneerConfig,
    });
  };

  // Backup Manual gerando .rsvpwa
  const handleExportBackup = async () => {
    triggerHaptic(15);
    try {
      const json = await exportDatabaseToJson();
      downloadBackupFile(json);
      setBackupSuccess('Arquivo de backup (.rsvpwa) gerado com sucesso!');
      setTimeout(() => setBackupSuccess(null), 3500);
    } catch {
      setBackupSuccess('Erro ao gerar o backup.');
      setTimeout(() => setBackupSuccess(null), 3500);
    }
  };

  // Compartilhar backup via Web Share API
  const handleShareBackup = async () => {
    triggerHaptic(15);
    try {
      const json = await exportDatabaseToJson();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `backup-relatorio-${dateStr}.rsvpwa`;
      const file = new File([json], filename, { type: 'application/json' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup Relatório de Serviço PWA',
          text: 'Arquivo de backup criptografado dos relatórios de serviço.',
        });
      } else {
        // Fallback para download direto
        downloadBackupFile(json);
        setBackupSuccess('Arquivo de backup (.rsvpwa) baixado para compartilhar.');
        setTimeout(() => setBackupSuccess(null), 3500);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setBackupSuccess('Não foi possível compartilhar o arquivo.');
      setTimeout(() => setBackupSuccess(null), 3500);
    }
  };

  // Leitura do arquivo selecionado para restore
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic(12);

    try {
      const text = await file.text();
      JSON.parse(text); // Validação básica
      setPendingFileContent(text);
      setIsRestoreModalOpen(true);
    } catch {
      alert('Arquivo inválido: não foi possível ler este arquivo de backup.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirmação de restauração
  const handleConfirmRestore = async () => {
    if (!pendingFileContent) return;
    triggerHaptic(15);

    try {
      await importDatabaseFromJson(pendingFileContent);
      setIsRestoreModalOpen(false);
      setPendingFileContent(null);
      setBackupSuccess('Dados restaurados com sucesso!');
      setTimeout(() => setBackupSuccess(null), 4000);
    } catch {
      alert('Falha ao restaurar dados: verifique a integridade do arquivo.');
    }
  };

  // Toggle do switch de notificação de backup agendado
  const handleToggleScheduledBackup = async () => {
    triggerHaptic(10);
    const newValue = !settings.scheduledBackupEnabled;
    if (newValue && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    await updateSettings({ scheduledBackupEnabled: newValue });
  };

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* 🟢 PERFIL */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            🟢 Perfil
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar com overlay de câmera */}
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            {settings.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt="Foto do perfil"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#01D65A] shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#008069] dark:bg-[#005C4B] text-white flex items-center justify-center font-bold text-xl border-2 border-[#01D65A] shadow-sm">
                {settings.publisherName ? settings.publisherName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#01D65A] text-white shadow-xs">
              <Camera className="w-3 h-3" />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              Nome do Publicador
            </label>
            <input
              type="text"
              value={settings.publisherName}
              onChange={(e) => updateSettings({ publisherName: e.target.value })}
              placeholder="Ex: João Silva"
              className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-sm focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
            />
          </div>
        </div>
      </section>

      {/* 🏷️ DESIGNAÇÃO ATUAL */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            🏷️ Designação Atual
          </h2>
        </div>

        <div className="space-y-2">
          {[
            { id: 'publisher', label: 'Publicador' },
            { id: 'auxiliary_pioneer', label: 'Pioneiro Auxiliar' },
            { id: 'regular_pioneer', label: 'Pioneiro Regular' },
          ].map((item) => {
            const isSelected = settings.role === item.id;
            return (
              <label
                key={item.id}
                onClick={() => handleRoleChange(item.id as UserRole)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#E1FFD2]/60 dark:bg-[#005C4B]/40 border-[#01D65A] font-bold text-[#111B1F] dark:text-[#E9EDEF]'
                    : 'bg-[#F0F2F5] dark:bg-[#111B26] border-[#E1E1E1] dark:border-[#2A3942] text-[#657484] dark:text-[#8696A0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#01D65A] bg-[#01D65A]' : 'border-[#657484]/50'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs">{item.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#019444] dark:text-[#01D65A]" />}
              </label>
            );
          })}
        </div>
      </section>

      {/* 📅 PERÍODO DA DESIGNAÇÃO & METAS (se pioneiro) */}
      {settings.role !== 'publisher' && (
        <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
            <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
              📅 Período da Designação
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                <Calendar className="w-3 h-3 text-[#01D65A]" />
                <span>Início:</span>
              </label>
              <input
                type="date"
                value={
                  settings.role === 'regular_pioneer'
                    ? settings.regularPioneerConfig?.startMonthYear ? `${settings.regularPioneerConfig.startMonthYear}-01` : ''
                    : settings.auxiliaryPioneerConfig?.startMonthYear ? `${settings.auxiliaryPioneerConfig.startMonthYear}-01` : ''
                }
                onChange={(e) => {
                  const ym = e.target.value.slice(0, 7);
                  if (settings.role === 'regular_pioneer') {
                    updateSettings({
                      regularPioneerConfig: {
                        startMonthYear: ym,
                        monthlyTargetHours: settings.regularPioneerConfig?.monthlyTargetHours || 50,
                      },
                    });
                  } else {
                    updateSettings({
                      auxiliaryPioneerConfig: {
                        startMonthYear: ym,
                        endMonthYear: settings.auxiliaryPioneerConfig?.endMonthYear,
                        monthlyTargetHours: settings.auxiliaryPioneerConfig?.monthlyTargetHours || 30,
                      },
                    });
                  }
                }}
                className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
                <Calendar className="w-3 h-3 text-[#01D65A]" />
                <span>Fim (opcional):</span>
              </label>
              <input
                type="date"
                value={
                  settings.role === 'auxiliary_pioneer' && settings.auxiliaryPioneerConfig?.endMonthYear
                    ? `${settings.auxiliaryPioneerConfig.endMonthYear}-01`
                    : ''
                }
                onChange={(e) => {
                  const ym = e.target.value ? e.target.value.slice(0, 7) : undefined;
                  if (settings.role === 'auxiliary_pioneer') {
                    updateSettings({
                      auxiliaryPioneerConfig: {
                        startMonthYear: settings.auxiliaryPioneerConfig?.startMonthYear || new Date().toISOString().slice(0, 7),
                        endMonthYear: ym,
                        monthlyTargetHours: settings.auxiliaryPioneerConfig?.monthlyTargetHours || 30,
                      },
                    });
                  }
                }}
                disabled={settings.role === 'regular_pioneer'}
                className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs focus:outline-none focus:ring-2 focus:ring-[#01D65A] disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-[#657484] dark:text-[#8696A0] mb-1">
              <Clock className="w-3 h-3 text-[#01D65A]" />
              <span>Horas por Mês:</span>
            </label>
            <div className="flex gap-2">
              {(settings.role === 'regular_pioneer' ? [50, 35, 70] : [30, 15]).map((hrs) => {
                const currentVal =
                  settings.role === 'regular_pioneer'
                    ? settings.regularPioneerConfig?.monthlyTargetHours ?? 50
                    : settings.auxiliaryPioneerConfig?.monthlyTargetHours ?? 30;
                const isSelected = currentVal === hrs;

                return (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      if (settings.role === 'regular_pioneer') {
                        updateSettings({
                          regularPioneerConfig: {
                            startMonthYear: settings.regularPioneerConfig?.startMonthYear || new Date().toISOString().slice(0, 7),
                            monthlyTargetHours: hrs,
                          },
                        });
                      } else {
                        updateSettings({
                          auxiliaryPioneerConfig: {
                            startMonthYear: settings.auxiliaryPioneerConfig?.startMonthYear || new Date().toISOString().slice(0, 7),
                            endMonthYear: settings.auxiliaryPioneerConfig?.endMonthYear,
                            monthlyTargetHours: hrs,
                          },
                        });
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      isSelected
                        ? 'bg-[#01D65A] text-white border-[#01D65A]'
                        : 'bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] border-[#E1E1E1] dark:border-[#2A3942]'
                    }`}
                  >
                    {hrs}h {hrs === 15 ? '(mês especial)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 🌐 IDIOMA */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            🌐 Idioma
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'pt-BR', label: '🇧🇷 PT-BR' },
            { id: 'en-US', label: '🇺🇸 EN-US' },
            { id: 'es-ES', label: '🇪🇸 ES-ES' },
          ].map((lang) => {
            const isSelected = (settings.language || 'pt-BR') === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  updateSettings({ language: lang.id as AppLanguage });
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-[#01D65A] text-white border-[#01D65A]'
                    : 'bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] border-[#E1E1E1] dark:border-[#2A3942]'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 🔔 NOTIFICAÇÃO DE REVISITA (1 A 7 DIAS) */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            🔔 Notificação de Revisita
          </h2>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#657484] dark:text-[#8696A0] mb-1.5">
            <Bell className="w-3.5 h-3.5 text-[#01D65A]" />
            <span>⏳ Lembrar com antecedência:</span>
          </label>
          <select
            value={settings.revisitNotificationDays || 1}
            onChange={(e) => {
              triggerHaptic(8);
              updateSettings({ revisitNotificationDays: parseInt(e.target.value, 10) });
            }}
            className="w-full bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#2A3942] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#01D65A]"
          >
            <option value={1}>1 dia antes</option>
            <option value={2}>2 dias antes</option>
            <option value={3}>3 dias antes</option>
            <option value={4}>4 dias antes</option>
            <option value={5}>5 dias antes</option>
            <option value={6}>6 dias antes</option>
            <option value={7}>7 dias antes</option>
          </select>
          <p className="text-[10px] text-[#657484] dark:text-[#8696A0] mt-1">
            Gera lembrete nativo via Service Worker local sem necessidade de conexão externa.
          </p>
        </div>
      </section>

      {/* 🌓 TEMA */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            🌓 Tema Visual
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Claro', icon: Sun },
            { id: 'dark', label: 'Escuro', icon: Moon },
            { id: 'system', label: 'Sistema', icon: Smartphone },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onThemeChange(t.id as AppTheme);
                  updateSettings({ theme: t.id as AppTheme });
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#01D65A] text-white border-[#01D65A]'
                    : 'bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] border-[#E1E1E1] dark:border-[#2A3942]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 💾 BACKUP */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            💾 Backup & Restauração
          </h2>
        </div>

        {/* Switch Backup Agendado */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] border border-[#E1E1E1] dark:border-[#2A3942]">
          <div>
            <span className="text-xs font-semibold text-[#111B1F] dark:text-[#E9EDEF] block">
              Backup agendado
            </span>
            <span className="text-[10px] text-[#657484] dark:text-[#8696A0]">
              🔔 Notificação semanal para salvar seus dados
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleScheduledBackup}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.scheduledBackupEnabled ? 'bg-[#01D65A]' : 'bg-[#657484]/40'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.scheduledBackupEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Botões de Ação de Backup */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-[#01D65A] hover:bg-[#019444] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Backup Manual</span>
          </button>

          <button
            type="button"
            onClick={handleShareBackup}
            className="py-2.5 px-3 rounded-xl bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] hover:bg-[#01D65A] hover:text-white border border-[#01D65A]/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar</span>
          </button>
        </div>

        {/* Restaurar Backup */}
        <div className="pt-2 border-t border-[#E1E1E1] dark:border-[#2A3942]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 rounded-xl bg-[#F0F2F5] dark:bg-[#111B26] hover:bg-slate-200 dark:hover:bg-slate-800 text-[#111B1F] dark:text-[#E9EDEF] border border-[#E1E1E1] dark:border-[#2A3942] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Restaurar Backup... (.rsvpwa ou .json)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".rsvpwa,.json"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>

        {backupSuccess && (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>{backupSuccess}</span>
          </div>
        )}
      </section>

      {/* 🔒 PRIVACIDADE — 100% LOCAL (Card estilo WhatsApp) */}
      <section className="bg-[#E1FFD2]/40 dark:bg-[#005C4B]/20 rounded-xl p-4 border border-[#01D65A]/40 space-y-2">
        <div className="flex items-center gap-2 text-[#008069] dark:text-[#01D65A]">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            🔒 PRIVACIDADE — 100% LOCAL
          </h3>
        </div>

        <ul className="space-y-1 text-xs text-[#111B1F] dark:text-[#E9EDEF] leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-[#01D65A] font-bold">🟢</span>
            <span><strong>Armazenamento:</strong> IndexedDB (Dexie.js) — 100% no seu dispositivo.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#01D65A] font-bold">🟢</span>
            <span><strong>Compartilhamento:</strong> Direto no aparelho via WhatsApp ou cópia.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#01D65A] font-bold">🟢</span>
            <span><strong>Backup:</strong> Arquivo <code>.rsvpwa</code> protegido e offline.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#01D65A] font-bold">🟢</span>
            <span><strong>Notificações:</strong> Service Worker local sem conexão externa.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-red-500 font-bold">🔴</span>
            <span><strong>Nenhuma chamada de rede externa:</strong> Zero servidores de dados.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-red-500 font-bold">🔴</span>
            <span><strong>Zero rastreamento:</strong> Sem Google Analytics, sem telemetria, sem cookies.</span>
          </li>
        </ul>
      </section>

      {/* Modal de Alerta de Confirmação de Restauração */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1F2C34] rounded-2xl w-full max-w-sm border border-red-500/40 p-4 shadow-2xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111B1F] dark:text-[#E9EDEF]">
                ⚠️ Restaurar sobrescreve TODOS os dados!
              </h3>
              <p className="text-xs text-[#657484] dark:text-[#8696A0] mt-1 leading-relaxed">
                A restauração substituirá todos os registros e revisitas atuais pelos dados contidos no arquivo selecionado.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setPendingFileContent(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-[#657484]/30 text-xs font-semibold text-[#657484] dark:text-[#8696A0]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Sim, restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
