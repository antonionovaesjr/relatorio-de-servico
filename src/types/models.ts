export type UserRole = 'publisher' | 'auxiliary_pioneer' | 'regular_pioneer';
export type AppTheme = 'system' | 'light' | 'dark';
export type AppLanguage = 'pt-BR' | 'en-US' | 'es-ES';

export interface RegularPioneerConfig {
  startMonthYear: string; // "YYYY-MM"
  monthlyTargetHours: number; // ex: 35 ou 50
}

export interface AuxiliaryPioneerConfig {
  startMonthYear: string; // "YYYY-MM"
  endMonthYear?: string; // "YYYY-MM" (opcional)
  monthlyTargetHours: number; // ex: 30 ou 15
}

export interface UserSettings {
  id: string; // 'current_user' (singleton)
  publisherName: string;
  avatarUrl?: string;
  role: UserRole;
  regularPioneerConfig?: RegularPioneerConfig;
  auxiliaryPioneerConfig?: AuxiliaryPioneerConfig;
  theme: AppTheme;
  language: AppLanguage;
  revisitNotificationDays: number; // 1, 2 ou 3 dias
  scheduledBackupEnabled: boolean;
  updatedAt: string;
}

export interface DailyEntry {
  id?: number; // Auto-increment PK
  date: string; // "YYYY-MM-DD" definida pelo usuário
  monthKey: string; // "YYYY-MM" (derivada da date)
  serviceYear: number; // Ano de serviço derivado (Set-Ago)
  hours: number; // Horas inteiras (ex: 4)
  minutes: number; // Minutos (ex: 15)
  bibleStudies: number; // Estudos bíblicos dirigidos no dia
  placements?: number; // Publicações entregues
  videoShowings?: number; // Vídeos mostrados
  returnVisitsCount?: number; // Revisitas feitas no dia
  notes?: string; // Anotações do dia de campo
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  monthKey: string; // PK: "YYYY-MM" (ex: "2026-09")
  serviceYear: number; // ex: 2027 (Set/2026 a Ago/2027)
  bibleStudies: number | null;
  hours: number | null;
  notes: string;
  isAuxiliaryPioneer: boolean; // Condição A (Publicador marcando aux no mês)
  hasReducedRequirement: boolean; // Condição B (50% do requisito)
  updatedAt: string;
}

export interface ReturnVisit {
  id?: number; // Auto-increment PK
  monthKey: string; // Index: "YYYY-MM"
  contactName: string;
  address?: string; // Endereço para abrir no Google Maps [ 🗺️ ]
  topic?: string; // Assunto abordado
  lastVisitDate?: string; // Última visita "YYYY-MM-DD"
  publication?: string; // Publicação deixada
  notes: string; // Anotações gerais
  scheduledDate?: string; // "YYYY-MM-DD"
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseExportData {
  version: number;
  exportedAt: string;
  settings: UserSettings[];
  monthlyReports: MonthlyReport[];
  returnVisits: ReturnVisit[];
  dailyEntries: DailyEntry[];
}
