import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db/db';
import { compileReportShareText, shareReportData } from './share';
import type { MonthlyReport, DailyEntry } from '../types/models';

describe('Agregação de Estudos Bíblicos no Relatório de Serviço', () => {
  const testMonthKey = '2026-10';
  const testServiceYear = 2027;

  beforeEach(async () => {
    await db.dailyEntries.clear();
    await db.monthlyReports.clear();
    await db.settings.clear();
  });

  it('deve agregar estudos bíblicos a partir de registro diário injetado artificialmente e gerar "Total de estudos: 3"', async () => {
    // 1. Injeção artificial de registro diário no IndexedDB (Dexie) com bibleStudies: 3
    const injectedEntry: Omit<DailyEntry, 'id'> = {
      date: '2026-10-04',
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 2,
      minutes: 0,
      bibleStudies: 3,
      notes: 'Estudo artificial de teste',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.dailyEntries.add(injectedEntry as DailyEntry);

    // 2. Consulta dos registros no IndexedDB
    const dailyEntries = await db.dailyEntries
      .where('monthKey')
      .equals(testMonthKey)
      .toArray();

    expect(dailyEntries).toHaveLength(1);
    expect(dailyEntries[0].bibleStudies).toBe(3);

    // 3. Montagem do relatório do mês
    const report: MonthlyReport = {
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 2,
      bibleStudies: 0, // Simula valor não inicializado ou zero
      notes: '',
      isAuxiliaryPioneer: false,
      hasReducedRequirement: false,
      creditHours: 0,
      updatedAt: new Date().toISOString(),
    };

    // 4. Execução da função que monta o Template Literal
    const shareText = compileReportShareText({
      report,
      dailyEntries,
    });

    // 5. Critério de Aceitação / Hard Fail:
    // Deve conter 'Total de estudos: 3'
    expect(shareText).toContain('Total de estudos: 3');

    // Hard fail se o texto retornar 0 ou omitir
    expect(shareText).not.toContain('Total de estudos: 0');
    expect(shareText).toMatch(/Total de estudos:\s*3/);
  });

  it('não deve permitir que dbReport com bibleStudies: 0 mascare os estudos lançados no dia (prevenção da regressão 0 ?? computedStudies)', async () => {
    // 1. Injeta registro diário com 3 estudos
    await db.dailyEntries.add({
      date: '2026-10-05',
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 3,
      minutes: 15,
      bibleStudies: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DailyEntry);

    // 2. Injeta registro mensal com bibleStudies: 0 no banco (cenário exato que causava a regressão)
    await db.monthlyReports.put({
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 3.25,
      bibleStudies: 0,
      notes: 'Nota existente',
      isAuxiliaryPioneer: false,
      hasReducedRequirement: false,
      creditHours: 0,
      updatedAt: new Date().toISOString(),
    });

    const entries = await db.dailyEntries.where('monthKey').equals(testMonthKey).toArray();
    const dbReport = await db.monthlyReports.get(testMonthKey);

    // Agregação iterativa (reduce e Math.max)
    const dailySum = entries.reduce((acc, cur) => acc + (cur.bibleStudies || 0), 0);
    const dailyMax = entries.reduce((acc, cur) => Math.max(acc, cur.bibleStudies || 0), 0);
    const effectiveStudies = Math.max(dbReport?.bibleStudies ?? 0, dailySum, dailyMax);

    const shareText = compileReportShareText({
      report: {
        ...dbReport!,
        bibleStudies: effectiveStudies,
      },
      dailyEntries: entries,
    });

    // HARD FAIL se retornar 0
    if (shareText.includes('Total de estudos: 0')) {
      throw new Error('HARD FAIL: A string compartilhada retornou "Total de estudos: 0" mesmo com registro diário de 3 estudos!');
    }

    if (!shareText.includes('Total de estudos: 3')) {
      throw new Error(`HARD FAIL: Esperava "Total de estudos: 3", mas obteve: \n${shareText}`);
    }

    expect(shareText).toContain('Total de estudos: 3');
  });

  it('deve agregar múltiplos lançamentos diários com estudos usando .reduce() somando para Total de estudos: 3', async () => {
    // Lançamento 1: 1 estudo
    await db.dailyEntries.add({
      date: '2026-10-02',
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 1,
      minutes: 0,
      bibleStudies: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DailyEntry);

    // Lançamento 2: 2 estudos
    await db.dailyEntries.add({
      date: '2026-10-10',
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 2,
      minutes: 0,
      bibleStudies: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DailyEntry);

    const entries = await db.dailyEntries.where('monthKey').equals(testMonthKey).toArray();

    const report: MonthlyReport = {
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 3,
      bibleStudies: 0,
      notes: '',
      isAuxiliaryPioneer: false,
      hasReducedRequirement: false,
      creditHours: 0,
      updatedAt: new Date().toISOString(),
    };

    const shareText = compileReportShareText({
      report,
      dailyEntries: entries,
    });

    expect(shareText).toContain('Total de estudos: 3');
    expect(shareText).not.toContain('Total de estudos: 0');
  });

  it('deve preparar os dados corretamente para o fallback de clipboard em shareReportData', async () => {
    await db.dailyEntries.add({
      date: '2026-10-15',
      monthKey: testMonthKey,
      serviceYear: testServiceYear,
      hours: 4,
      minutes: 0,
      bibleStudies: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DailyEntry);

    const entries = await db.dailyEntries.where('monthKey').equals(testMonthKey).toArray();
    let writtenText = '';
    const originalNavigator = globalThis.navigator;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).navigator = {
      clipboard: {
        writeText: async (text: string) => {
          writtenText = text;
        },
      },
    };

    const result = await shareReportData({
      report: {
        monthKey: testMonthKey,
        serviceYear: testServiceYear,
        hours: 4,
        bibleStudies: 0,
        notes: '',
        isAuxiliaryPioneer: false,
        hasReducedRequirement: false,
        creditHours: 0,
        updatedAt: new Date().toISOString(),
      },
      dailyEntries: entries,
    });

    expect(result.success).toBe(true);
    expect(writtenText).toContain('Total de estudos: 3');
    expect(writtenText).not.toContain('Total de estudos: 0');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).navigator = originalNavigator;
  });
});
