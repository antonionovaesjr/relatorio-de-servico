import React, { useState, useEffect } from 'react';
import { WifiOff, Sun, Moon, Plus } from 'lucide-react';
import { BottomNavBar, type TabType } from '../components/navigation/BottomNavBar';
import { triggerHaptic } from '../utils/haptics';
import type { AppTheme } from '../types/models';

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
        return 'Relatórios';
      case 'settings':
        return 'Configurações';
      case 'help':
        return 'Ajuda';
      default:
        return 'Início';
    }
  })();

  // Visibilidade do FAB flutuante de canto (visível em Início e Relatórios)
  const isFabVisible = currentTab === 'home' || currentTab === 'report';

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#111B26] text-[#111B1F] dark:text-[#E9EDEF] flex flex-col antialiased transition-colors duration-200">
      {/* ⚠️ Estado Offline: Banner discreto no topo */}
      {isOffline && (
        <aside aria-label="Aviso de conexão offline" className="bg-[#FFEECD] text-[#594408] text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shadow-sm border-b border-[#E8D19F]">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline — todos os dados salvos localmente</span>
        </aside>
      )}

      {/* Header Superior Estilo WhatsApp */}
      <header className="sticky top-0 z-30 bg-[#008069] dark:bg-[#1F2C34] text-white shadow-sm border-b border-[#006A57] dark:border-[#2A3942] transition-colors">
        <div className="max-w-md w-full mx-auto px-4 pt-[max(env(safe-area-inset-top),10px)] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#01D65A] flex items-center justify-center text-[#111B26] shadow-sm font-extrabold text-xs tracking-wider">
              RS
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                {headerTitle}
              </h1>
              <p className="text-[11px] text-[#A6E9CE] dark:text-[#8696A0] leading-none">
                100% Local & Privado
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
            className="p-2 rounded-full text-[#A6E9CE] hover:text-white dark:text-[#8696A0] dark:hover:text-[#E9EDEF] hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            title="Alternar tema claro/escuro"
            aria-label="Alternar tema claro/escuro"
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-[#01D65A]" />
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

      {/* 🟢 FAB Flutuante (bottom-right) — Visível em Início e Relatórios */}
      {isFabVisible && (
        <button
          onClick={() => {
            triggerHaptic(15);
            onOpenRegisterModal();
          }}
          className={`fixed bottom-20 right-5 z-30 w-14 h-14 rounded-full bg-[#01D65A] hover:bg-[#019444] text-white shadow-lg flex items-center justify-center transition-all duration-200 active:scale-90 focus:outline-none focus:ring-4 focus:ring-[#01D65A]/30 ${
            currentTab === 'report' ? 'ring-2 ring-emerald-400/50' : ''
          }`}
          title="Novo Registro Diário"
          aria-label="Novo Registro Diário"
        >
          <Plus className="w-7 h-7 stroke-[2.8]" />
        </button>
      )}

      {/* Barra de Navegação Inferior Estilo WhatsApp */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={onTabChange}
        onOpenRegisterModal={onOpenRegisterModal}
      />
    </div>
  );
};
