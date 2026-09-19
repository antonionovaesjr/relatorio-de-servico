import React from 'react';
import {
  HelpCircle,
  Home,
  PlusCircle,
  ClipboardList,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export const HelpView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* Cabeçalho */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] flex items-center justify-center font-bold">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#111B1F] dark:text-[#F8FAFC]">
            {t('help.headerTitle')}
          </h1>
          <p className="text-xs text-[#657484] dark:text-[#94A3B8]">
            {t('help.headerDesc')}
          </p>
        </div>
      </section>

      {/* 🏠 INÍCIO */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <Home className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('help.sectionHome')}
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E2E8F0] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.homePoint1Title')}</strong> {t('help.homePoint1Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.homePoint2Title')}</strong> {t('help.homePoint2Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.homePoint3Title')}</strong> {t('help.homePoint3Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.homePoint4Title')}</strong> {t('help.homePoint4Text')}</span>
          </li>
        </ul>
      </section>

      {/* ✏️ REGISTRO */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <PlusCircle className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('help.sectionRegister')}
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E2E8F0] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.registerPoint1Title')}</strong> {t('help.registerPoint1Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.registerPoint2Title')}</strong> {t('help.registerPoint2Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.registerPoint3Title')}</strong> {t('help.registerPoint3Text')}</span>
          </li>
        </ul>
      </section>

      {/* 📋 RELATÓRIO */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <ClipboardList className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('help.sectionReports')}
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E2E8F0] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.reportsPoint1Title')}</strong> {t('help.reportsPoint1Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.reportsPoint2Title')}</strong> {t('help.reportsPoint2Text')}</span>
          </li>
        </ul>
      </section>

      {/* 👤 CONFIGURAÇÕES */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#1F2E44] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#1F2E44]">
          <User className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
          <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
            {t('help.sectionSettings')}
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E2E8F0] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.settingsPoint1Title')}</strong> {t('help.settingsPoint1Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.settingsPoint2Title')}</strong> {t('help.settingsPoint2Text')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
            <span><strong className="text-[#111B1F] dark:text-white">{t('help.settingsPoint3Title')}</strong> {t('help.settingsPoint3Text')}</span>
          </li>
        </ul>
      </section>

      {/* 🔒 PRIVACIDADE */}
      <section className="bg-[#E8EEF8]/60 dark:bg-[#172554]/50 rounded-xl p-4 border border-[#001E62]/20 dark:border-[#3B82F6]/30 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-[#001E62] dark:text-[#60A5FA] shrink-0 mt-0.5" />
        <p className="text-xs text-[#111B1F] dark:text-[#F8FAFC] leading-relaxed">
          <strong className="text-[#001E62] dark:text-[#93C5FD]">{t('help.sectionPrivacyTitle')}</strong> {t('help.sectionPrivacyText')}
        </p>
      </section>
    </div>
  );
};
