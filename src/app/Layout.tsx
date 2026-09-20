import React, { useState, useEffect } from 'react';
import { WifiOff, Sun, Moon } from 'lucide-react';
import { BottomNavBar, type TabType } from '../components/navigation/BottomNavBar';
import { triggerHaptic } from '../utils/haptics';
import type { AppTheme } from '../types/models';
import { useTranslation } from '../i18n/I18nContext';
import { isDevEnvironment } from '../utils/env';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentTheme: AppTheme;
  onToggleTheme: () => void;
  onOpenRegisterModal: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  currentTheme,
  onToggleTheme,
  onOpenRegisterModal,
}) => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Título do cabeçalho conforme a aba
  const headerTitle = (() => {
    switch (currentTab) {
      case 'report':
        return t('nav.reports');
      case 'settings':
        return t('nav.settings');
      case 'help':
        return t('nav.help');
      default:
        return t('nav.home');
    }
  })();

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0A111E] text-[#0A111E] dark:text-[#F8FAFC] flex flex-col antialiased transition-colors duration-200">
      {/* ⚠️ Estado Offline: Banner discreto no topo */}
      {isOffline && (
        <aside aria-label="Aviso de conexão offline" className="bg-[#FFEECD] text-[#594408] text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shadow-sm border-b border-[#E8D19F]">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t('common.offlineMsg')}</span>
        </aside>
      )}

      {/* Header Superior Midnight Blue */}
      <header className="sticky top-0 z-30 bg-[#001E62] text-white shadow-md border-b border-[#001545] dark:border-[#1F2E44] transition-colors">
        <div className="max-w-md w-full mx-auto px-4 pt-[max(env(safe-area-inset-top),10px)] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-[#001E62] flex items-center justify-center shadow-sm font-extrabold text-xs tracking-wider">
              RS
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
                <span>{headerTitle}</span>
                {isDevEnvironment() && (
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600 text-white tracking-widest shadow-xs">
                    DEV
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-[#CBD8EE] dark:text-[#93C5FD] leading-none">
                {t('common.privateNotice')}
              </p>
            </div>
          </div>

          {/* Switch Rápido de Tema */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              onToggleTheme();
            }}
            className="p-2 rounded-full text-[#CBD8EE] hover:text-white hover:bg-white/10 transition-colors"
            title={t('common.toggleTheme')}
            aria-label={t('common.toggleTheme')}
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-300" />
            ) : (
              <Moon className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Container de Conteúdo */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 pt-3 pb-24">
        {children}
      </main>

      {/* Barra de Navegação Inferior Estilo WhatsApp */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={onTabChange}
        onOpenRegisterModal={onOpenRegisterModal}
      />
    </div>
  );
};
