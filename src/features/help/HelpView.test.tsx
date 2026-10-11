// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HelpView } from './HelpView';
import { I18nProvider } from '../../i18n/I18nContext';

describe('HelpView - FAQ por Designação', () => {
  afterEach(() => {
    cleanup();
  });
  it('deve renderizar o cabeçalho de FAQ e as abas de categoria', () => {
    render(
      <I18nProvider language="pt-BR">
        <HelpView />
      </I18nProvider>
    );

    expect(screen.getByText('Ajuda & Dúvidas Frequentes (FAQ)')).toBeTruthy();
    expect(screen.getByText('✨ Todas')).toBeTruthy();
    expect(screen.getByText('👤 Publicador')).toBeTruthy();
    expect(screen.getByText('🏃 Pioneiro Auxiliar')).toBeTruthy();
    expect(screen.getByText('🎖️ Pioneiro Regular')).toBeTruthy();
    expect(screen.getByText('💡 Geral')).toBeTruthy();
  });

  it('deve permitir filtrar dúvidas de Pioneiro Regular e alternar expansão do acordeão', () => {
    render(
      <I18nProvider language="pt-BR">
        <HelpView />
      </I18nProvider>
    );

    // Clica no filtro de Pioneiro Regular
    const regularBtn = screen.getByText('🎖️ Pioneiro Regular');
    fireEvent.click(regularBtn);

    // Deve exibir perguntas do pioneiro regular
    const question = screen.getByText('Como funciona a Barra Dupla (Dual-Bar) na tela Início do Pioneiro Regular?');
    expect(question).toBeTruthy();

    // Expande a pergunta clicando nela
    fireEvent.click(question);

    // Verifica que o conteúdo da resposta é exibido
    expect(screen.getByText(/Barra 1 — Progresso Anual/)).toBeTruthy();
    expect(screen.getByText(/Barra 2 — Progresso Mensal/)).toBeTruthy();
  });

  it('deve filtrar dúvidas de Publicador e exibir explicação sobre participação', () => {
    render(
      <I18nProvider language="pt-BR">
        <HelpView />
      </I18nProvider>
    );

    const publisherBtn = screen.getByText('👤 Publicador');
    fireEvent.click(publisherBtn);

    expect(screen.getByText('Como o aplicativo funciona para o Publicador?')).toBeTruthy();
    expect(screen.getByText('Por que a tela Início não exibe barra de meta de horas?')).toBeTruthy();
  });
});
