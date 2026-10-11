// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { db } from '../../db/db';
import { HomeView } from './HomeView';
import { I18nProvider } from '../../i18n/I18nContext';
import { getMonthKey, calculateServiceYear } from '../../utils/date';
import type { UserSettings, MonthlyReport } from '../../types/models';

describe('HomeView - Dual-Bar Progress Card (Injeção fake-indexeddb)', () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.monthlyReports.clear();
    await db.dailyEntries.clear();
    await db.returnVisits.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('deve injetar estado de Pioneiro Regular com meta de 50h, 40h cumpridas e exibir "10:00 faltam" e a barra #0B4C8C', async () => {
    const currentMonthKey = getMonthKey(new Date());
    const serviceYear = calculateServiceYear(currentMonthKey);

    // 1. Injeção de estado no fake-indexeddb: Pioneiro Regular com meta de 50h
    const userSettings: UserSettings = {
      id: 'current_user',
      publisherName: 'Antonio Novaes',
      role: 'regular_pioneer',
      regularPioneerConfig: {
        startMonthYear: `${serviceYear - 1}-09`,
        monthlyTargetHours: 50,
      },
      theme: 'system',
      language: 'pt-BR',
      revisitNotificationDays: 3,
      scheduledBackupEnabled: true,
      updatedAt: new Date().toISOString(),
    };
    await db.settings.put(userSettings);

    // 2. Injeção de relatório de 40h no mês atual vigente
    const monthReport: MonthlyReport = {
      monthKey: currentMonthKey,
      serviceYear,
      hours: 40,
      bibleStudies: 3,
      notes: 'Mês quase concluído',
      isAuxiliaryPioneer: false,
      hasReducedRequirement: false,
      creditHours: 0,
      updatedAt: new Date().toISOString(),
    };
    await db.monthlyReports.put(monthReport);

    // 3. Renderização do componente HomeView
    render(
      <I18nProvider language="pt-BR">
        <HomeView onGoToMonth={() => {}} onGoToVisits={() => {}} />
      </I18nProvider>
    );

    // 4. Aguarda sincronização do useLiveQuery e carregamento do card
    await waitFor(() => {
      expect(screen.getByTestId('progress-card')).toBeTruthy();
    });

    // 5. Validação da barra anual (Azul)
    const annualSection = screen.getByTestId('annual-progress-section');
    expect(annualSection).toBeTruthy();
    const annualBar = screen.getByTestId('annual-progress-bar');
    expect(annualBar.className).toContain('bg-[#001E62]');

    // 6. Validação da barra mensal com cor exata #0B4C8C
    const monthlySection = screen.getByTestId('monthly-progress-section');
    expect(monthlySection).toBeTruthy();
    const monthlyBar = screen.getByTestId('monthly-progress-bar');
    const styleAttr = monthlyBar.getAttribute('style') || '';
    expect(styleAttr.toLowerCase()).toMatch(/background-color:\s*(#0b4c8c|rgb\(11,\s*76,\s*140\))/);

    // 7. Validação do texto correspondente a "10:00 faltam"
    const remainingLabel = screen.getByTestId('monthly-remaining-label');
    expect(remainingLabel).toBeTruthy();
    expect(remainingLabel.textContent).toContain('10:00 faltam');
  });

  it('deve usar azul padrão para Pioneiro Auxiliar (garantindo que #0B4C8C é exclusivo do Pioneiro Regular)', async () => {
    const currentMonthKey = getMonthKey(new Date());
    const serviceYear = calculateServiceYear(currentMonthKey);

    // 1. Injeção de estado no fake-indexeddb: Pioneiro Auxiliar
    const userSettings: UserSettings = {
      id: 'current_user',
      publisherName: 'Antonio Novaes',
      role: 'auxiliary_pioneer',
      theme: 'system',
      language: 'pt-BR',
      revisitNotificationDays: 3,
      scheduledBackupEnabled: true,
      updatedAt: new Date().toISOString(),
    };
    await db.settings.put(userSettings);

    const monthReport: MonthlyReport = {
      monthKey: currentMonthKey,
      serviceYear,
      hours: 18,
      bibleStudies: 1,
      notes: '',
      isAuxiliaryPioneer: true,
      hasReducedRequirement: false,
      creditHours: 0,
      updatedAt: new Date().toISOString(),
    };
    await db.monthlyReports.put(monthReport);

    render(
      <I18nProvider language="pt-BR">
        <HomeView onGoToMonth={() => {}} onGoToVisits={() => {}} />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('progress-card')).toBeTruthy();
    });

    const monthlyBar = screen.getByTestId('monthly-progress-bar');
    // Deve conter classe azul padrão e NÃO conter style de background-color #0B4C8C
    expect(monthlyBar.className).toContain('bg-[#001E62]');
    const styleAttr = monthlyBar.getAttribute('style') || '';
    expect(styleAttr.toLowerCase()).not.toContain('#0b4c8c');
  });
});
