import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import type {
  UserSettings,
  MonthlyReport,
  ReturnVisit,
  DailyEntry,
  DatabaseExportData,
} from '../types/models';

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'current_user',
  publisherName: '',
  role: 'publisher',
  theme: 'light',
  language: 'pt-BR',
  fontSize: 'normal',
  revisitNotificationDays: 1,
  scheduledBackupEnabled: false,
  updatedAt: new Date().toISOString(),
};


export class MinistryDatabase extends Dexie {
  settings!: Table<UserSettings, string>;
  monthlyReports!: Table<MonthlyReport, string>;
  returnVisits!: Table<ReturnVisit, number>;
  dailyEntries!: Table<DailyEntry, number>;

  constructor() {
    super('MinistryReportDB');

    // Versão 1 com índices originais
    this.version(1).stores({
      settings: 'id',
      monthlyReports: 'monthKey, serviceYear, updatedAt',
      returnVisits: '++id, monthKey, isCompleted, scheduledDate',
    });

    // Versão 2 adicionando tabela de lançamentos diários
    this.version(2).stores({
      settings: 'id',
      monthlyReports: 'monthKey, serviceYear, updatedAt',
      returnVisits: '++id, monthKey, isCompleted, scheduledDate',
      dailyEntries: '++id, date, monthKey, serviceYear',
    });

    // Popula o banco com configurações iniciais caso seja um novo banco
    this.on('populate', () => {
      this.settings.add(DEFAULT_SETTINGS);
    });
  }
}

export const db = new MinistryDatabase();

// Inicialização segura das configurações fora de qualquer render/liveQuery
export async function ensureSettings(): Promise<UserSettings> {
  try {
    const existing = await db.settings.get('current_user');
    if (existing) {
      return existing;
    }
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error);
    return DEFAULT_SETTINGS;
  }
}

// Hook reativo seguro (READ-ONLY) para consumir configurações
export function useUserSettings(): UserSettings {
  const settings = useLiveQuery(async () => {
    const s = await db.settings.get('current_user');
    return s ?? DEFAULT_SETTINGS;
  }, []);

  return settings ?? DEFAULT_SETTINGS;
}

// Exportação completa do banco de dados para backup em JSON
export async function exportDatabaseToJson(): Promise<string> {
  const [settings, monthlyReports, returnVisits, dailyEntries] = await Promise.all([
    db.settings.toArray(),
    db.monthlyReports.toArray(),
    db.returnVisits.toArray(),
    db.dailyEntries.toArray(),
  ]);

  const exportData: DatabaseExportData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    monthlyReports,
    returnVisits,
    dailyEntries,
  };

  return JSON.stringify(exportData, null, 2);
}

// Download do arquivo de backup no dispositivo
export function downloadBackupFile(jsonString: string): void {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `backup-relatorio-${dateStr}.rsvpwa`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// Importação transacional atômica a partir do JSON
export async function importDatabaseFromJson(jsonString: string): Promise<void> {
  const parsed = JSON.parse(jsonString) as DatabaseExportData;

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.monthlyReports)) {
    throw new Error('Arquivo JSON de backup inválido.');
  }

  await db.transaction(
    'rw',
    db.settings,
    db.monthlyReports,
    db.returnVisits,
    db.dailyEntries,
    async () => {
      await db.settings.clear();
      await db.monthlyReports.clear();
      await db.returnVisits.clear();
      await db.dailyEntries.clear();

      if (parsed.settings && parsed.settings.length > 0) {
        await db.settings.bulkPut(parsed.settings);
      } else {
        await db.settings.put(DEFAULT_SETTINGS);
      }
      if (parsed.monthlyReports && parsed.monthlyReports.length > 0) {
        await db.monthlyReports.bulkPut(parsed.monthlyReports);
      }
      if (parsed.returnVisits && parsed.returnVisits.length > 0) {
        await db.returnVisits.bulkPut(parsed.returnVisits);
      }
      if (parsed.dailyEntries && parsed.dailyEntries.length > 0) {
        await db.dailyEntries.bulkPut(parsed.dailyEntries);
      }
    }
  );
}

// Limpeza atômica da base de dados e restauração das configurações padrão
export async function clearDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    db.settings,
    db.monthlyReports,
    db.returnVisits,
    db.dailyEntries,
    async () => {
      await db.settings.clear();
      await db.monthlyReports.clear();
      await db.returnVisits.clear();
      await db.dailyEntries.clear();
      await db.settings.put({
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
    }
  );
}
