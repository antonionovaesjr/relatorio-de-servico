import React, { useState, useEffect } from 'react';
import { useUserSettings, ensureSettings, db } from './db/db';
import type { AppTheme } from './types/models';
import type { TabType } from './components/navigation/BottomNavBar';
import { Layout } from './app/Layout';
import { HomeView } from './features/home/HomeView';
import { ReportView } from './features/report/ReportView';
import { DailyEntryModal } from './features/register/DailyEntryModal';
import { SettingsView } from './features/settings/SettingsView';
import { HelpView } from './features/help/HelpView';
import { getMonthKey } from './utils/date';
import { I18nProvider } from './i18n/I18nContext';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>(() => getMonthKey(new Date()));
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const settings = useUserSettings();
  const [activeTheme, setActiveTheme] = useState<AppTheme>('light');

  // Inicializa o banco de dados
  useEffect(() => {
    ensureSettings();
  }, []);

  // Sincroniza o tema selecionado
  useEffect(() => {
    if (settings.theme) {
      setActiveTheme(settings.theme);
    }
  }, [settings.theme]);

  // Sincroniza o tamanho da fonte
  useEffect(() => {
    const size = settings.fontSize || 'normal';
    document.documentElement.setAttribute('data-font-size', size);
  }, [settings.fontSize]);

  // Aplica classe 'dark' no documento
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        activeTheme === 'dark' || (activeTheme === 'system' && mediaQuery.matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [activeTheme]);

  // Alternar tema via botão rápido do Header
  const handleToggleTheme = async () => {
    const nextTheme: AppTheme = activeTheme === 'dark' ? 'light' : 'dark';
    setActiveTheme(nextTheme);
    await db.settings.put({
      ...settings,
      theme: nextTheme,
      updatedAt: new Date().toISOString(),
    });
  };

  // Navegação cruzada a partir do Gráfico de Barras da Home
  const handleGoToMonth = (monthKey: string) => {
    setSelectedReportMonth(monthKey);
    setCurrentTab('report');
  };

  // Navegação cruzada a partir do card "Próxima revisita" da Home
  const handleGoToVisits = () => {
    setCurrentTab('report');
  };

  return (
    <I18nProvider language={settings.language || 'pt-BR'}>
      <Layout
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentTheme={activeTheme}
        onToggleTheme={handleToggleTheme}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
      >
        {currentTab === 'home' && (
          <HomeView
            onGoToMonth={handleGoToMonth}
            onGoToVisits={handleGoToVisits}
          />
        )}
        {currentTab === 'report' && (
          <ReportView
            key={selectedReportMonth}
            initialMonthKey={selectedReportMonth}
          />
        )}
        {currentTab === 'settings' && (
          <SettingsView
            currentTheme={activeTheme}
            onThemeChange={(theme) => setActiveTheme(theme)}
          />
        )}
        {currentTab === 'help' && <HelpView />}
      </Layout>

      {/* Modal ✏️ Novo Registro Diário (estilo "Nova Conversa" WhatsApp) */}
      <DailyEntryModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </I18nProvider>
  );
};

export default App;
