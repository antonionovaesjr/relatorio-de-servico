import { test, expect } from '@playwright/test';

test.describe('Tela Início - Card de Progresso Dual-Bar', () => {
  test('deve exibir barra anual (azul) e mensal (#6E1996) com 10:00 faltam para pioneiro regular de 50h com 40h cumpridas', async ({ page }) => {
    await page.goto('/');

    // Injeta estado teocrático no IndexedDB
    await page.evaluate(async () => {
      const dbRequest = window.indexedDB.open('RelatorioServicoDB');
      await new Promise<void>((resolve, reject) => {
        dbRequest.onsuccess = () => {
          const idb = dbRequest.result;
          const transaction = idb.transaction(['settings', 'monthlyReports'], 'readwrite');
          const settingsStore = transaction.objectStore('settings');
          const reportsStore = transaction.objectStore('monthlyReports');

          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const monthKey = `${y}-${m}`;
          const serviceYear = now.getMonth() + 1 >= 9 ? y + 1 : y;

          settingsStore.put({
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
          });

          reportsStore.put({
            monthKey,
            serviceYear,
            hours: 40,
            bibleStudies: 3,
            notes: 'Teste E2E',
            isAuxiliaryPioneer: false,
            hasReducedRequirement: false,
            creditHours: 0,
            updatedAt: new Date().toISOString(),
          });

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
        dbRequest.onerror = () => reject(dbRequest.error);
      });
    });

    await page.reload();

    const progressCard = page.locator('[data-testid="progress-card"]');
    await expect(progressCard).toBeVisible();

    const remainingLabel = page.locator('[data-testid="monthly-remaining-label"]');
    await expect(remainingLabel).toContainText('10:00 faltam');

    const monthlyBar = page.locator('[data-testid="monthly-progress-bar"]');
    await expect(monthlyBar).toHaveCSS('background-color', 'rgb(110, 25, 150)');
  });
});
