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

  it('deve exibir o card Registro e Correção com histórico cronológico a partir de f623326', () => {
    render(
      <I18nProvider language="pt-BR">
        <HelpView />
      </I18nProvider>
    );

    const changelogSection = screen.getByTestId('changelog-section');
    expect(changelogSection).toBeTruthy();
    expect(screen.getByText('Desde 19/09/2026')).toBeTruthy();
    expect(screen.getByText('#f623326')).toBeTruthy();
    expect(screen.getByText('Visual Modernizado e Suporte a Novos Idiomas')).toBeTruthy();
    expect(screen.getByText(/O aplicativo recebeu um novo layout limpo/)).toBeTruthy();
  });

  it('deve filtrar itens por Melhoria e por Correção no card Registro e Correção', () => {
    render(
      <I18nProvider language="pt-BR">
        <HelpView />
      </I18nProvider>
    );

    // Filtro de Correções
    const fixFilterBtn = screen.getByText(/🛠️ Correções/);
    fireEvent.click(fixFilterBtn);

    // Deve exibir itens de correção
    expect(screen.getByText('Harmonização de Cores nas Bordas das Telas')).toBeTruthy();
    expect(screen.getByText('Contagem Correta de Estudos Bíblicos ao Compartilhar')).toBeTruthy();
    expect(screen.getByText('Preservação do Tema Original Midnight Blue')).toBeTruthy();

    // Não deve exibir melhorias quando filtrado por correções
    expect(screen.queryByText('Visual Modernizado e Suporte a Novos Idiomas')).toBeNull();

    // Filtro de Melhorias
    const improvementFilterBtn = screen.getByText(/✨ Melhorias/);
    fireEvent.click(improvementFilterBtn);

    expect(screen.getByText('Visual Modernizado e Suporte a Novos Idiomas')).toBeTruthy();
    expect(screen.getByText('Barra Dupla de Progresso na Tela Inicial (Dual-Bar)')).toBeTruthy();
    expect(screen.queryByText('Harmonização de Cores nas Bordas das Telas')).toBeNull();

    // Voltar para Todas (específico do changelog: Todas (11))
    const allFilterBtn = screen.getByText(/^Todas \(\d+\)$/);
    fireEvent.click(allFilterBtn);

    expect(screen.getByText('Visual Modernizado e Suporte a Novos Idiomas')).toBeTruthy();
    expect(screen.getByText('Harmonização de Cores nas Bordas das Telas')).toBeTruthy();
  });
});
