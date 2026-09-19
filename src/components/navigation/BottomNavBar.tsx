import React from 'react';
import { MessageSquare, Paperclip, Plus, User, HelpCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

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
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1F2C34] border-t border-[#E1E1E1] dark:border-[#2A3942] pb-[env(safe-area-inset-bottom,10px)] transition-colors duration-200 shadow-md">
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-between relative">
        {/* 💬 Início */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('home');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'home' ? 'text-[#01D65A]' : 'text-[#657484] dark:text-[#8696A0]'
          }`}
          aria-label="Início"
        >
          <div className="p-1">
            <MessageSquare
              className={`w-6 h-6 transition-all ${
                currentTab === 'home'
                  ? 'fill-[#01D65A] stroke-[#01D65A]'
                  : 'fill-none stroke-current'
              }`}
            />
          </div>
          {currentTab === 'home' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              Início
            </span>
          )}
        </button>

        {/* 📎 Relatórios */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('report');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'report' ? 'text-[#01D65A]' : 'text-[#657484] dark:text-[#8696A0]'
          }`}
          aria-label="Relatórios"
        >
          <div className="p-1">
            <Paperclip
              className={`w-6 h-6 transition-all ${
                currentTab === 'report'
                  ? 'stroke-[2.8] stroke-[#01D65A]'
                  : 'stroke-[1.8] stroke-current'
              }`}
            />
          </div>
          {currentTab === 'report' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              Relatórios
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
            className="w-14 h-14 rounded-full bg-[#01D65A] hover:bg-[#019444] text-white shadow-lg flex items-center justify-center transition-all duration-200 active:scale-90 ring-4 ring-white dark:ring-[#1F2C34]"
            title="Novo Registro Diário"
            aria-label="Novo Registro Diário"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* 👤 Configurações */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onTabChange('settings');
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 ${
            currentTab === 'settings' ? 'text-[#01D65A]' : 'text-[#657484] dark:text-[#8696A0]'
          }`}
          aria-label="Configurações"
        >
          <div className="p-1">
            <User
              className={`w-6 h-6 transition-all ${
                currentTab === 'settings'
                  ? 'fill-[#01D65A] stroke-[#01D65A]'
                  : 'fill-none stroke-current'
              }`}
            />
          </div>
          {currentTab === 'settings' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              Configurações
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
            currentTab === 'help' ? 'text-[#01D65A]' : 'text-[#657484] dark:text-[#8696A0]'
          }`}
          aria-label="Ajuda"
        >
          <div className="p-1">
            <HelpCircle
              className={`w-6 h-6 transition-all ${
                currentTab === 'help'
                  ? 'fill-[#01D65A] text-white stroke-[#01D65A]'
                  : 'fill-none stroke-current'
              }`}
            />
          </div>
          {currentTab === 'help' && (
            <span className="text-[10px] font-bold tracking-tight animate-fade-in">
              Ajuda
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
