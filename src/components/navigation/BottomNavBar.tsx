import React from 'react';
import { Home, FilePenLine, Plus, Settings, HelpCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { useTranslation } from '../../i18n/I18nContext';

export type TabType = 'home' | 'report' | 'settings' | 'help';

interface BottomNavBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenRegisterModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  onOpenRegisterModal,
}) => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111A29] border-t border-[#DDE3EA] dark:border-[#1F2E44] pb-[env(safe-area-inset-bottom,10px)] transition-colors duration-200 shadow-lg">
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-between relative">
        {/* 🏠 Início */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('home');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'home' ? 'text-[#001E62] dark:text-[#60A5FA]' : 'text-[#5C6B7E] dark:text-[#94A3B8]'
          }`}
          aria-label={t('nav.home')}
        >
          <div className="p-1">
            <Home
              className={`w-6 h-6 transition-all ${
                currentTab === 'home'
                  ? 'stroke-[2.5] stroke-[#001E62] dark:stroke-[#60A5FA]'
                  : 'stroke-[1.8] stroke-current'
              }`}
            />
          </div>
          {currentTab === 'home' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              {t('nav.home')}
            </span>
          )}
        </button>

        {/* 📝 Registros */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('report');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'report' ? 'text-[#001E62] dark:text-[#60A5FA]' : 'text-[#5C6B7E] dark:text-[#94A3B8]'
          }`}
          aria-label={t('nav.reports')}
        >
          <div className="p-1">
            <FilePenLine
              className={`w-6 h-6 transition-all ${
                currentTab === 'report'
                  ? 'stroke-[2.5] stroke-[#001E62] dark:stroke-[#60A5FA]'
                  : 'stroke-[1.8] stroke-current'
              }`}
            />
          </div>
          {currentTab === 'report' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              {t('nav.reports')}
            </span>
          )}
        </button>

        {/* ╋ FAB Central Elevado */}
        <div className="flex-1 flex items-center justify-center -mt-6">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onOpenRegisterModal();
            }}
            className="w-14 h-14 rounded-full bg-[#001E62] hover:bg-[#001545] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#2563EB] shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 ring-4 ring-white dark:ring-[#111A29]"
            title={t('nav.newEntry')}
            aria-label={t('nav.newEntry')}
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* ⚙️ Configurações */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('settings');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'settings' ? 'text-[#001E62] dark:text-[#60A5FA]' : 'text-[#5C6B7E] dark:text-[#94A3B8]'
          }`}
          aria-label={t('nav.settings')}
        >
          <div className="p-1">
            <Settings
              className={`w-6 h-6 transition-all ${
                currentTab === 'settings'
                  ? 'stroke-[2.5] stroke-[#001E62] dark:stroke-[#60A5FA]'
                  : 'stroke-[1.8] stroke-current'
              }`}
            />
          </div>
          {currentTab === 'settings' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              {t('nav.settings')}
            </span>
          )}
        </button>

        {/* ℹ️ Ajuda */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('help');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'help' ? 'text-[#001E62] dark:text-[#60A5FA]' : 'text-[#5C6B7E] dark:text-[#94A3B8]'
          }`}
          aria-label={t('nav.help')}
        >
          <div className="p-1">
            <HelpCircle
              className={`w-6 h-6 transition-all ${
                currentTab === 'help'
                  ? 'stroke-[2.5] stroke-[#001E62] dark:stroke-[#60A5FA]'
                  : 'stroke-[1.8] stroke-current'
              }`}
            />
          </div>
          {currentTab === 'help' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              {t('nav.help')}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
