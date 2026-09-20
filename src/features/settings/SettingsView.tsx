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
  Type,
  Trash2,
} from 'lucide-react';

import {
  db,
  useUserSettings,
  exportDatabaseToJson,
  downloadBackupFile,
  importDatabaseFromJson,
  clearDatabase,
} from '../../db/db';
import type { UserSettings, UserRole, AppTheme, AppLanguage, AppFontSize } from '../../types/models';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';
import { requestNotificationPermission } from '../../utils/notifications';
import { usePWAInstall } from '../../utils/usePWAInstall';

interface SettingsViewProps {
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange }) => {
  const { t } = useTranslation();
  const settings = useUserSettings();
  const { canInstall, isInstalled, installApp } = usePWAInstall();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isClearDbModalOpen, setIsClearDbModalOpen] = useState(false);
  const [clearDbSuccess, setClearDbSuccess] = useState<string | null>(null);

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
          text: 'Arquivo de backup dos relatórios de serviço.',
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

  // Confirmação de limpeza da base de dados
  const handleConfirmClearDb = async () => {
    triggerHaptic(20);
    try {
      await clearDatabase();
      setIsClearDbModalOpen(false);
      setClearDbSuccess(t('settings.clearDbSuccess'));
      setTimeout(() => setClearDbSuccess(null), 3500);
    } catch (error) {
      console.error('Erro ao limpar base de dados:', error);
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
      {/* 🟦 PERFIL */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('settings.publisherProfile')}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar com overlay de câmera */}
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            {settings.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt="Foto do perfil"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#001E62] dark:border-[#3B82F6] shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#001E62] dark:bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xl border-2 border-[#001E62] dark:border-[#3B82F6] shadow-sm">
                {settings.publisherName ? settings.publisherName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#001E62] dark:bg-[#2563EB] text-white shadow-xs">
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
            <label className="block text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
              {t('settings.publisherName')}
            </label>
            <input
              type="text"
              value={settings.publisherName}
              onChange={(e) => updateSettings({ publisherName: e.target.value })}
              placeholder={t('settings.namePlaceholder')}
              className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-sm focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
            />
          </div>
        </div>
      </section>

      {/* 🔤 TAMANHO DA FONTE */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('settings.fontSizeSection')}
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'small', label: t('settings.fontSmall'), size: '14px' },
            { id: 'normal', label: t('settings.fontNormal'), size: '16px' },
            { id: 'large', label: t('settings.fontLarge'), size: '18px' },
            { id: 'xlarge', label: t('settings.fontXLarge'), size: '20px' },
          ].map((f) => {
            const isSelected = (settings.fontSize || 'normal') === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  updateSettings({ fontSize: f.id as AppFontSize });
                }}
                className={`py-2.5 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#001E62] text-white border-[#001E62] dark:bg-[#1D4ED8] dark:border-[#60A5FA] dark:text-white shadow-sm dark:shadow-blue-900/50'
                    : 'bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] border-[#E1E1E1] dark:border-[#202E42] hover:dark:bg-[#162236] hover:dark:border-[#3B82F6]/50'
                }`}
              >
                <Type className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">{f.label}</span>
                <span className="text-[9px] text-[#657484] dark:text-[#94A3B8] font-medium">{f.size}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🏷️ DESIGNAÇÃO ATUAL */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('settings.roleSection')}
          </h2>
        </div>

        <div className="space-y-2">
          {[
            { id: 'publisher', label: t('roles.publisher') },
            { id: 'auxiliary_pioneer', label: t('roles.auxiliary') },
            { id: 'regular_pioneer', label: t('roles.regular') },
          ].map((item) => {
            const isSelected = settings.role === item.id;
            return (
              <label
                key={item.id}
                onClick={() => handleRoleChange(item.id as UserRole)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#E8EEF8] dark:bg-[#172554] border-[#001E62] dark:border-[#3B82F6] font-bold text-[#001E62] dark:text-white shadow-xs'
                    : 'bg-[#F0F2F5] dark:bg-[#0B1320] border-[#E1E1E1] dark:border-[#202E42] text-[#111B1F] dark:text-[#F8FAFC] hover:dark:bg-[#162236] hover:dark:border-[#3B82F6]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#001E62] bg-[#001E62] dark:border-[#60A5FA] dark:bg-[#3B82F6]'
                        : 'border-[#657484]/50 dark:border-slate-500'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs">{item.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#001E62] dark:text-[#60A5FA] stroke-[2.5]" />}
              </label>
            );
          })}
        </div>
      </section>

      {/* 📅 PERÍODO DA DESIGNAÇÃO & METAS (se pioneiro) */}
      {settings.role !== 'publisher' && (
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
            <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              📅 Período da Designação
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
                <Calendar className="w-3 h-3 text-[#001E62] dark:text-[#60A5FA]" />
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
                className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
                <Calendar className="w-3 h-3 text-[#001E62] dark:text-[#60A5FA]" />
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
                className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA] disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1">
              <Clock className="w-3 h-3 text-[#001E62] dark:text-[#60A5FA]" />
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
                        ? 'bg-[#001E62] text-white border-[#001E62] dark:bg-[#1D4ED8] dark:border-[#60A5FA] shadow-sm'
                        : 'bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] border-[#E1E1E1] dark:border-[#202E42] hover:dark:bg-[#162236]'
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
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            🌐 {t('settings.languageLabel')}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'pt-BR', label: '🇧🇷 Português' },
            { id: 'en-US', label: '🇺🇸 English' },
            { id: 'es-ES', label: '🇪🇸 Español' },
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
                    ? 'bg-[#001E62] text-white border-[#001E62] dark:bg-[#1D4ED8] dark:border-[#60A5FA] shadow-sm'
                    : 'bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] border-[#E1E1E1] dark:border-[#202E42] hover:dark:bg-[#162236]'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 🔔 NOTIFICAÇÕES & LEMBRETES */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            🔔 {t('settings.notificationsSection')}
          </h2>
        </div>

        {/* Checkbox: Lembrar de enviar relatório no final do mês */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] border border-[#E1E1E1] dark:border-[#202E42] cursor-pointer select-none transition-colors hover:border-[#001E62]/40 dark:hover:border-[#3B82F6]/50">
          <input
            type="checkbox"
            checked={settings.remindReportEndOfMonth !== false}
            onChange={async (e) => {
              triggerHaptic(8);
              const checked = e.target.checked;
              if (checked) {
                await requestNotificationPermission();
              }
              updateSettings({ remindReportEndOfMonth: checked });
            }}
            className="mt-0.5 w-4 h-4 rounded text-[#001E62] dark:text-[#3B82F6] focus:ring-[#001E62] border-[#657484]/40 accent-[#001E62] dark:accent-[#3B82F6]"
          />
          <div className="flex-1">
            <span className="text-xs font-bold text-[#111B1F] dark:text-[#F8FAFC] block">
              {t('settings.remindReportEndOfMonthLabel')}
            </span>
            <span className="text-[11px] text-[#657484] dark:text-[#94A3B8] block mt-0.5 leading-relaxed">
              {t('settings.remindReportEndOfMonthDesc')}
            </span>
          </div>
        </label>

        {/* Notificação de Revisitas */}
        <div className="pt-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#5C6B7E] dark:text-[#CBD5E1] mb-1.5">
            <Bell className="w-3.5 h-3.5 text-[#001E62] dark:text-[#60A5FA]" />
            <span>⏳ {t('settings.notificationsLabel')}:</span>
          </label>
          <select
            value={settings.revisitNotificationDays || 1}
            onChange={(e) => {
              triggerHaptic(8);
              updateSettings({ revisitNotificationDays: parseInt(e.target.value, 10) });
            }}
            className="w-full bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E1E1E1] dark:border-[#25364E] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#001E62] dark:focus:border-[#60A5FA]"
          >
            <option value={1} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">{t('settings.notif1Day')}</option>
            <option value={2} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">{t('settings.notif2Days')}</option>
            <option value={3} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">3 dias antes</option>
            <option value={4} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">4 dias antes</option>
            <option value={5} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">5 dias antes</option>
            <option value={6} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">6 dias antes</option>
            <option value={7} className="bg-white dark:bg-[#111A29] text-[#111B1F] dark:text-[#F8FAFC]">7 dias antes</option>
          </select>
          <p className="text-[11px] text-[#657484] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
            Gera lembrete nativo via Service Worker local sem necessidade de conexão externa.
          </p>
        </div>
      </section>

      {/* 🌓 TEMA */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            🌓 {t('settings.themeLabel')}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: t('settings.themeLight'), icon: Sun },
            { id: 'dark', label: t('settings.themeDark'), icon: Moon },
            { id: 'system', label: t('settings.themeSystem'), icon: Smartphone },
          ].map((themeItem) => {
            const Icon = themeItem.icon;
            const isSelected = currentTheme === themeItem.id;
            return (
              <button
                key={themeItem.id}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onThemeChange(themeItem.id as AppTheme);
                  updateSettings({ theme: themeItem.id as AppTheme });
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#001E62] text-white border-[#001E62] dark:bg-[#1D4ED8] dark:border-[#60A5FA] shadow-sm'
                    : 'bg-[#F0F2F5] dark:bg-[#0B1320] text-[#111B1F] dark:text-[#F8FAFC] border-[#E1E1E1] dark:border-[#202E42] hover:dark:bg-[#162236]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{themeItem.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 📱 APLICATIVO WEB (PWA) */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            📱 Aplicativo (PWA)
          </h2>
        </div>

        {isInstalled ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Aplicativo instalado como WebApp nativo na tela inicial!</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#5C6B7E] dark:text-[#94A3B8] leading-relaxed">
              Instale na tela inicial do seu celular para abri-lo como aplicativo nativo em tela cheia e com o ícone oficial (sem o mini-logo do navegador no canto).
            </p>

            {canInstall && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  installApp();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#001E62] hover:bg-[#001545] dark:bg-[#1D4ED8] dark:hover:bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo Oficial</span>
              </button>
            )}

            <div className="p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] border border-[#E1E1E1] dark:border-[#202E42] text-[11px] text-[#5C6B7E] dark:text-[#94A3B8] space-y-1.5">
              <p className="font-semibold text-[#111B1F] dark:text-[#F8FAFC]">
                💡 Como garantir o ícone limpo do aplicativo:
              </p>
              <p>
                <strong>No Android (Chrome):</strong> Toque no menu (3 pontinhos) e escolha <strong className="text-[#001E62] dark:text-[#60A5FA]">"Instalar aplicativo"</strong> (e não apenas "Adicionar à tela inicial"). Dessa forma, o Android cria o WebAPK oficial com o ícone original do app.
              </p>
              <p>
                <strong>No iPhone (Safari):</strong> Toque no botão <strong className="text-[#001E62] dark:text-[#60A5FA]">Compartilhar</strong> (quadrado com seta para cima) e escolha <strong className="text-[#001E62] dark:text-[#60A5FA]">"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 💾 BACKUP */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#60A5FA]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('settings.backupSection')}
          </h2>
        </div>

        {/* Switch Backup Agendado */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] border border-[#E1E1E1] dark:border-[#202E42]">
          <div>
            <span className="text-xs font-semibold text-[#111B1F] dark:text-[#F8FAFC] block">
              Backup agendado
            </span>
            <span className="text-[11px] text-[#657484] dark:text-[#94A3B8]">
              🔔 Notificação semanal para salvar seus dados
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleScheduledBackup}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.scheduledBackupEnabled ? 'bg-[#001E62] dark:bg-[#2563EB]' : 'bg-[#657484]/40 dark:bg-slate-700'
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
            className="py-2.5 px-3 rounded-xl bg-[#001E62] hover:bg-[#001545] dark:bg-[#1D4ED8] hover:dark:bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all dark:border dark:border-[#60A5FA]/40"
          >
            <Download className="w-4 h-4" />
            <span>{t('settings.makeBackup')}</span>
          </button>

          <button
            type="button"
            onClick={handleShareBackup}
            className="py-2.5 px-3 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] hover:bg-[#001E62] hover:text-white hover:dark:bg-[#1E3A8A] border border-[#001E62]/30 dark:border-[#3B82F6]/50 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar</span>
          </button>
        </div>

        {/* Restaurar Backup */}
        <div className="pt-2 border-t border-[#E1E1E1] dark:border-[#1F2E44]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 rounded-xl bg-[#F0F2F5] dark:bg-[#0B1320] hover:bg-slate-200 dark:hover:bg-[#162236] text-[#111B1F] dark:text-[#F8FAFC] border border-[#E1E1E1] dark:border-[#202E42] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{t('settings.restoreBackup')} (.rsvpwa / .json)</span>
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
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] text-xs font-semibold border border-[#001E62]/30 dark:border-[#3B82F6]/50">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{backupSuccess}</span>
          </div>
        )}
      </section>

      {/* 🗑️ BASE DE DADOS — LIMPAR DADOS */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
            {t('settings.databaseSection')}
          </h2>
        </div>

        <p className="text-xs text-[#5C6B7E] dark:text-[#94A3B8] leading-relaxed">
          {t('settings.databaseDesc')}
        </p>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(12);
            setIsClearDbModalOpen(true);
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 dark:border-rose-500/50 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('settings.clearDbButton')}</span>
        </button>

        {clearDbSuccess && (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{clearDbSuccess}</span>
          </div>
        )}
      </section>

      {/* 🔒 PRIVACIDADE — 100% LOCAL */}
      <section className="bg-[#E8EEF8]/60 dark:bg-[#0E1A2D] rounded-xl p-4 border border-[#001E62]/20 dark:border-[#223B60] space-y-2">
        <div className="flex items-center gap-2 text-[#001E62] dark:text-[#93C5FD]">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            🔒 PRIVACIDADE — 100% LOCAL
          </h3>
        </div>

        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E2E8F0] leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">🟦</span>
            <span><strong className="text-[#001E62] dark:text-white">Armazenamento:</strong> IndexedDB (Dexie.js) — 100% no seu dispositivo.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">🟦</span>
            <span><strong className="text-[#001E62] dark:text-white">Compartilhamento:</strong> Cópia de texto direta para a área de transferência.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">🟦</span>
            <span><strong className="text-[#001E62] dark:text-white">Backup:</strong> Arquivo <code>.rsvpwa</code> protegido e offline.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">🟦</span>
            <span><strong className="text-[#001E62] dark:text-white">Notificações:</strong> Service Worker local sem conexão externa.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-rose-500 font-bold">🔴</span>
            <span><strong className="text-[#001E62] dark:text-white">Nenhuma chamada de rede externa:</strong> Zero servidores de dados.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-rose-500 font-bold">🔴</span>
            <span><strong className="text-[#001E62] dark:text-white">Zero rastreamento:</strong> Sem Google Analytics, sem telemetria, sem cookies.</span>
          </li>
        </ul>
      </section>

      {/* Modal de Alerta de Confirmação de Restauração */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-sm border border-red-500/40 dark:border-red-500/50 p-4 shadow-2xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111B1F] dark:text-[#F8FAFC]">
                ⚠️ Restaurar sobrescreve TODOS os dados!
              </h3>
              <p className="text-xs text-[#5C6B7E] dark:text-[#94A3B8] mt-1 leading-relaxed">
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
                className="flex-1 py-2 px-3 rounded-xl border border-[#657484]/30 dark:border-[#25364E] text-xs font-semibold text-[#657484] dark:text-[#CBD5E1]"
              >
                {t('common.cancel')}
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

      {/* Modal de Confirmação para Limpar Base de Dados */}
      {isClearDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111A29] rounded-2xl w-full max-w-sm border border-rose-500/50 p-4 shadow-2xl space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#111B1F] dark:text-[#F8FAFC]">
                {t('settings.clearDbModalTitle')}
              </h3>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                {t('settings.clearDbModalWarning')}
              </p>
              <p className="text-xs text-[#5C6B7E] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                {t('settings.clearDbModalMessage')}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setIsClearDbModalOpen(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-[#657484]/30 dark:border-[#25364E] text-xs font-semibold text-[#657484] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#162236] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearDb}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('settings.clearDbModalConfirm')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
