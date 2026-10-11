import React, { useState } from 'react';
import {
  HelpCircle,
  Home,
  PlusCircle,
  ClipboardList,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Award,
  Calendar,
  Share2,
  Clock,
  MapPin,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { triggerHaptic } from '../../utils/haptics';

type FaqCategory = 'all' | 'publisher' | 'auxiliary' | 'regular' | 'general';

interface FaqItem {
  id: string;
  category: 'publisher' | 'auxiliary' | 'regular' | 'general';
  icon: React.ReactNode;
  question: string;
  badgeLabel: string;
  badgeClass: string;
  answer: React.ReactNode;
}

export const HelpView: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('pub-1');

  const faqItems: FaqItem[] = [
    // 👤 PUBLICADOR
    {
      id: 'pub-1',
      category: 'publisher',
      icon: <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
      question: 'Como o aplicativo funciona para o Publicador?',
      badgeLabel: 'Publicador',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
      answer: (
        <div className="space-y-2">
          <p>
            Como publicador, sua participação no ministério <strong>não possui uma meta de horas obrigatória</strong>.
            O aplicativo foca naquilo que é essencial para o relatório mensal:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
            <li><strong>Participação no mês:</strong> Indica automaticamente <em>"Participei no ministério: Sim"</em> quando há atividade registrada.</li>
            <li><strong>Estudos Bíblicos:</strong> Registra e soma os estudos bíblicos conduzidos no mês.</li>
            <li><strong>Controle pessoal opcional:</strong> Você pode usar o cronômetro e registrar horas e minutos de campo para seu próprio acompanhamento se desejar.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'pub-2',
      category: 'publisher',
      icon: <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
      question: 'Por que a tela Início não exibe barra de meta de horas?',
      badgeLabel: 'Publicador',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
      answer: (
        <p>
          Para manter sua experiência leve e livre de cobranças desnecessárias, as barras de metas de horas são exibidas
          apenas quando você serve como <strong>Pioneiro Auxiliar</strong> ou <strong>Pioneiro Regular</strong>. Como publicador,
          a tela Início apresenta os dias em que pregou no mês, média de tempo, estudos bíblicos, lembrete da próxima revisita e o gráfico histórico de meses anteriores.
        </p>
      ),
    },
    {
      id: 'pub-3',
      category: 'publisher',
      icon: <Award className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
      question: 'Posso usar o campo "Crédito de Horas" como publicador?',
      badgeLabel: 'Publicador',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
      answer: (
        <p>
          <strong>Não.</strong> Conforme as orientações teocráticas, a provisão de crédito de horas é exclusiva para <strong>Pioneiros Regulares</strong> que
          participam de designações específicas (como Escola de Pioneiro ou projetos do LDC/Betel) ou em casos especiais autorizados pela Comissão de Serviço da Congregação.
          Por esse motivo, na aba <strong>Registro</strong> esse campo fica desabilitado para o perfil de publicador.
        </p>
      ),
    },
    {
      id: 'pub-4',
      category: 'publisher',
      icon: <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
      question: 'Como envio meu relatório mensal ao secretário da congregação?',
      badgeLabel: 'Publicador',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
      answer: (
        <p>
          No fim do mês, acesse a aba <strong>Relatórios</strong> e toque no botão <strong>Compartilhar</strong> (ou Copiar).
          O aplicativo monta automaticamente o texto padronizado informando: <em>"Participei no ministério: Sim"</em>, total de estudos bíblicos,
          horas cumpridas (para seu controle) e observações, com botão direto para enviar via <strong>WhatsApp</strong> ou copiar para outro aplicativo.
        </p>
      ),
    },

    // 🏃 PIONEIRO AUXILIAR
    {
      id: 'aux-1',
      category: 'auxiliary',
      icon: <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      question: 'Como ativo o modo Pioneiro Auxiliar no aplicativo?',
      badgeLabel: 'Pioneiro Auxiliar',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border border-sky-200 dark:border-sky-800',
      answer: (
        <div className="space-y-2">
          <p>Você pode ativar o serviço de pioneiro auxiliar de duas maneiras convenientes:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
            <li><strong>Perfil Fixo:</strong> Em <strong>Configurações &gt; Designação Teocrática</strong>, selecione <em>"Pioneiro Auxiliar"</em>.</li>
            <li><strong>Mês a Mês:</strong> Deixe seu perfil como Publicador e marque a caixinha <em>"Serviu como pioneiro auxiliar neste mês?"</em> na aba <strong>Relatórios</strong> ou no modal de lançamento diário (ideal para meses de férias, visita do superintendente de circuito ou época do Memorial).</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'aux-2',
      category: 'auxiliary',
      icon: <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      question: 'Como alternar entre a meta de 30 horas e a de 15 horas?',
      badgeLabel: 'Pioneiro Auxiliar',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border border-sky-200 dark:border-sky-800',
      answer: (
        <p>
          Na aba <strong>Relatórios</strong> (ou ao registrar um dia), marque a opção <strong>"Requisito reduzido (15h)"</strong> nos meses em que houver provisão especial
          (como no mês da visita do superintendente de circuito ou em março/abril na época do Memorial). A barra de progresso da tela Início e os cálculos de horas restantes
          se ajustarão instantaneamente para o alvo de 15 horas.
        </p>
      ),
    },
    {
      id: 'aux-3',
      category: 'auxiliary',
      icon: <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      question: 'O que a barra de progresso da tela Início mostra para o pioneiro auxiliar?',
      badgeLabel: 'Pioneiro Auxiliar',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border border-sky-200 dark:border-sky-800',
      answer: (
        <p>
          Ela exibe a barra azul do mês atual indicando a porcentagem já cumprida da sua meta (30h ou 15h) e um contador inteligente:
          por exemplo, <strong>"10:00 faltam"</strong>. Assim que você alcança ou ultrapassa a meta do mês, a barra exibe o badge positivo <strong>"Meta Atingida!"</strong> (sem números negativos).
        </p>
      ),
    },
    {
      id: 'aux-4',
      category: 'auxiliary',
      icon: <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      question: 'O Pioneiro Auxiliar tem direito a crédito de horas?',
      badgeLabel: 'Pioneiro Auxiliar',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border border-sky-200 dark:border-sky-800',
      answer: (
        <p>
          <strong>Não.</strong> Todo o tempo relatado pelo pioneiro auxiliar deve ser de atividade direta no ministério de campo. Por isso,
          o campo de créditos de horas permanece desabilitado na aba Registro.
        </p>
      ),
    },

    // 🎖️ PIONEIRO REGULAR
    {
      id: 'reg-1',
      category: 'regular',
      icon: <Award className="w-4 h-4 text-[#0B4C8C] dark:text-blue-400" />,
      question: 'Como funciona a Barra Dupla (Dual-Bar) na tela Início do Pioneiro Regular?',
      badgeLabel: 'Pioneiro Regular',
      badgeClass: 'bg-indigo-100 text-[#0B4C8C] dark:bg-indigo-950 dark:text-blue-300 border border-indigo-200 dark:border-indigo-800 font-bold',
      answer: (
        <div className="space-y-2">
          <p>
            O pioneiro regular conta com o card exclusivo <strong>Dual-Bar</strong>, que exibe simultaneamente duas visões essenciais para não precisar fazer cálculos manuais:
          </p>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#001E62] dark:bg-[#3B82F6] shrink-0 mt-1" />
              <div>
                <strong>Barra 1 — Progresso Anual (Azul Midnight):</strong> Acompanha o ano de serviço teocrático (setembro a agosto) rumo ao requisito anual de <strong>600 horas</strong>, mostrando as horas já acumuladas no ano e quanto falta.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B4C8C] shrink-0 mt-1" />
              <div>
                <strong>Barra 2 — Progresso Mensal (Azul #0B4C8C):</strong> Acompanha o alvo mensal de <strong>50 horas</strong>, somando automaticamente suas horas de pregação com os créditos teocráticos do mês e informando exatamente quanto falta (ex: <em>"10:00 faltam"</em>).
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'reg-2',
      category: 'regular',
      icon: <BookOpen className="w-4 h-4 text-[#0B4C8C] dark:text-blue-400" />,
      question: 'Quando e como usar o campo "Crédito de Horas"?',
      badgeLabel: 'Pioneiro Regular',
      badgeClass: 'bg-indigo-100 text-[#0B4C8C] dark:bg-indigo-950 dark:text-blue-300 border border-indigo-200 dark:border-indigo-800 font-bold',
      answer: (
        <div className="space-y-2">
          <p>
            Na aba <strong>Registro</strong>, o campo de crédito fica liberado com atalhos rápidos (<code>+15h</code>, <code>+30h</code> e <code>Zerar</code>).
            O crédito é uma provisão concedida a pioneiros regulares em circunstâncias específicas avaliadas e registradas com a Comissão de Serviço da Congregação:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
            <li><strong>🎓 Escola do Serviço de Pioneiro:</strong> Crédito fixo concedido no relatório do mês em que você cursa a escola.</li>
            <li><strong>🏗️ Projetos do LDC e Betel Temporário:</strong> Voluntários aprovados apoiando projetos de construção teocrática ou servindo temporariamente em Betel.</li>
            <li><strong>🩺 Enfermidade Grave ou Imprevistos Sérios:</strong> Consideração especial avaliada pelos anciãos dispensando a recuperação das horas faltantes no ano.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'reg-3',
      category: 'regular',
      icon: <Calendar className="w-4 h-4 text-[#0B4C8C] dark:text-blue-400" />,
      question: 'O crédito de horas entra na barra anual e nos gráficos?',
      badgeLabel: 'Pioneiro Regular',
      badgeClass: 'bg-indigo-100 text-[#0B4C8C] dark:bg-indigo-950 dark:text-blue-300 border border-indigo-200 dark:border-indigo-800 font-bold',
      answer: (
        <p>
          <strong>Sim!</strong> Todo crédito de horas aprovado é somado automaticamente no mês vigente. Ele reflete imediatamente na
          <strong> barra de progresso mensal</strong>, no <strong>acumulado anual de horas</strong> e no <strong>gráfico de horas por mês</strong>,
          garantindo que sua contagem real de horas no ano de serviço esteja sempre precisa.
        </p>
      ),
    },
    {
      id: 'reg-4',
      category: 'regular',
      icon: <Share2 className="w-4 h-4 text-[#0B4C8C] dark:text-blue-400" />,
      question: 'Como o relatório do pioneiro regular é compartilhado?',
      badgeLabel: 'Pioneiro Regular',
      badgeClass: 'bg-indigo-100 text-[#0B4C8C] dark:bg-indigo-950 dark:text-blue-300 border border-indigo-200 dark:border-indigo-800 font-bold',
      answer: (
        <p>
          Ao tocar em <strong>Compartilhar Relatório</strong>, o aplicativo discrimina com total transparência para o secretário:
          <strong> Total de horas</strong> (soma considerada), <strong>Horas no ministério</strong> (pregação de campo),
          <strong> Crédito de horas</strong> (quando houver) e o número de <strong>Estudos Bíblicos</strong> ativos.
        </p>
      ),
    },

    // 💡 GERAL
    {
      id: 'gen-1',
      category: 'general',
      icon: <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      question: 'O aplicativo funciona sem sinal de internet (offline)?',
      badgeLabel: 'Geral',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      answer: (
        <p>
          <strong>Sim, 100% offline!</strong> O aplicativo é um PWA moderno instalado no seu aparelho. Você pode usar o cronômetro,
          lançar horas diárias e gerenciar revisitas mesmo em locais rurais sem nenhuma cobertura de celular ou sinal de internet. Todos os dados são salvos localmente no banco de dados seguro do seu dispositivo (IndexedDB).
        </p>
      ),
    },
    {
      id: 'gen-2',
      category: 'general',
      icon: <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      question: 'Como funciona a captura de GPS e horário nas Revisitas?',
      badgeLabel: 'Geral',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      answer: (
        <div className="space-y-2">
          <p>Ao cadastrar ou atualizar uma revisita:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
            <li>Toque em <strong>"Obter GPS"</strong>: O app captura as coordenadas de satélite do local onde você está e preenche o nome da rua e cidade automaticamente.</li>
            <li>Toque em <strong>"Sugerir Horário"</strong>: O app sugere o próximo horário redondo conveniente para seu retorno (ex: 10:30, 15:00).</li>
            <li>No dia da revisita, basta tocar no ícone de mapa (🗺️) para abrir a rota direta no <strong>Google Maps</strong>.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'gen-3',
      category: 'general',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      question: 'Meus dados, nomes de pessoas e anotações são confidenciais?',
      badgeLabel: 'Geral',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      answer: (
        <p>
          <strong>Privacidade total!</strong> O aplicativo não possui servidores na nuvem, não armazena nomes em bancos de dados remotos e não coleta qualquer informação pessoal.
          Seus dados e notas de revisitas ficam armazenados exclusivamente no seu próprio celular ou tablet.
        </p>
      ),
    },
    {
      id: 'gen-4',
      category: 'general',
      icon: <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      question: 'Como não perder meus dados ao trocar de celular ou formatar?',
      badgeLabel: 'Geral',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      answer: (
        <p>
          Acesse a aba <strong>Configurações &gt; Backup &amp; Restauração</strong> e toque em <strong>"Fazer Backup (.rsvpwa)"</strong>.
          Guarde esse arquivo em um local seguro (como Google Drive, email pessoal ou WhatsApp). Quando trocar de celular, instale o aplicativo e toque em <strong>"Restaurar Backup"</strong> para recuperar todos os seus registros instantaneamente.
        </p>
      ),
    },
  ];

  const filteredFaqs = faqItems.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const toggleFaq = (id: string) => {
    triggerHaptic(6);
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 pb-8 select-none animate-fade-in">
      {/* Cabeçalho */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E8EEF8] dark:bg-[#172554] text-[#001E62] dark:text-[#93C5FD] flex items-center justify-center font-bold shrink-0">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#0A111E] dark:text-[#F8FAFC]">
            Ajuda &amp; Dúvidas Frequentes (FAQ)
          </h1>
          <p className="text-xs text-[#5C6B7E] dark:text-[#CBD5E1]">
            Guia rápido e tira-dúvidas por designação teocrática
          </p>
        </div>
      </section>

      {/* 📖 FAQ INTERATIVO POR DESIGNAÇÃO */}
      <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
            <h2 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              Perguntas Frequentes por Designação
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[#5C6B7E] dark:text-[#CBD5E1]">
            {filteredFaqs.length} {filteredFaqs.length === 1 ? 'dúvida' : 'dúvidas'}
          </span>
        </div>

        {/* Filtros por Categoria (Abas) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#001E62] text-white dark:bg-[#3B82F6]'
                : 'bg-[#F4F6F9] dark:bg-[#162234] text-[#5C6B7E] dark:text-[#CBD5E1] hover:bg-[#E8EEF8]'
            }`}
          >
            ✨ Todas
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedCategory('publisher');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'publisher'
                ? 'bg-[#001E62] text-white dark:bg-[#3B82F6]'
                : 'bg-[#F4F6F9] dark:bg-[#162234] text-[#5C6B7E] dark:text-[#CBD5E1] hover:bg-[#E8EEF8]'
            }`}
          >
            👤 Publicador
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedCategory('auxiliary');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'auxiliary'
                ? 'bg-[#001E62] text-white dark:bg-[#3B82F6]'
                : 'bg-[#F4F6F9] dark:bg-[#162234] text-[#5C6B7E] dark:text-[#CBD5E1] hover:bg-[#E8EEF8]'
            }`}
          >
            🏃 Pioneiro Auxiliar
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedCategory('regular');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'regular'
                ? 'bg-[#001E62] text-white dark:bg-[#3B82F6]'
                : 'bg-[#F4F6F9] dark:bg-[#162234] text-[#5C6B7E] dark:text-[#CBD5E1] hover:bg-[#E8EEF8]'
            }`}
          >
            🎖️ Pioneiro Regular
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedCategory('general');
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === 'general'
                ? 'bg-[#001E62] text-white dark:bg-[#3B82F6]'
                : 'bg-[#F4F6F9] dark:bg-[#162234] text-[#5C6B7E] dark:text-[#CBD5E1] hover:bg-[#E8EEF8]'
            }`}
          >
            💡 Geral
          </button>
        </div>

        {/* Lista Accordion de Perguntas */}
        <div className="space-y-2 pt-1">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-xl border border-[#DDE3EA] dark:border-[#202E42] bg-[#F4F6F9] dark:bg-[#0B1320] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="p-1 rounded-md bg-white dark:bg-[#162234] shadow-xs mt-0.5 shrink-0">
                      {faq.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${faq.badgeClass}`}>
                          {faq.badgeLabel}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-[#0A111E] dark:text-[#F8FAFC] leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[#5C6B7E] dark:text-[#CBD5E1] shrink-0 p-1">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-[#4A5568] dark:text-[#CBD5E1] leading-relaxed border-t border-[#DDE3EA]/60 dark:border-[#202E42]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 🧭 GUIA RÁPIDO DAS ABAS DO APLICATIVO */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-[#5C6B7E] dark:text-[#94A3B8] uppercase tracking-wider px-1">
          Referência Rápida de Telas
        </h2>

        {/* 🏠 INÍCIO */}
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <Home className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
            <h3 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              {t('help.sectionHome')}
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-[#0A111E] dark:text-[#E2E8F0] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.homePoint1Title')}</strong> {t('help.homePoint1Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.homePoint2Title')}</strong> {t('help.homePoint2Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.homePoint3Title')}</strong> {t('help.homePoint3Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.homePoint4Title')}</strong> {t('help.homePoint4Text')}</span>
            </li>
          </ul>
        </section>

        {/* ✏️ REGISTRO */}
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <PlusCircle className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
            <h3 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              {t('help.sectionRegister')}
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-[#0A111E] dark:text-[#E2E8F0] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.registerPoint1Title')}</strong> {t('help.registerPoint1Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.registerPoint2Title')}</strong> {t('help.registerPoint2Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.registerPoint3Title')}</strong> {t('help.registerPoint3Text')}</span>
            </li>
          </ul>
        </section>

        {/* 📋 RELATÓRIO */}
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <ClipboardList className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
            <h3 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              {t('help.sectionReports')}
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-[#0A111E] dark:text-[#E2E8F0] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.reportsPoint1Title')}</strong> {t('help.reportsPoint1Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.reportsPoint2Title')}</strong> {t('help.reportsPoint2Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.reportsPoint3Title')}</strong> {t('help.reportsPoint3Text')}</span>
            </li>
          </ul>
        </section>

        {/* 👤 CONFIGURAÇÕES */}
        <section className="bg-white dark:bg-[#111A29] rounded-xl p-4 border border-[#DDE3EA] dark:border-[#1F2E44] shadow-sm space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#DDE3EA] dark:border-[#1F2E44]">
            <User className="w-4 h-4 text-[#001E62] dark:text-[#93C5FD]" />
            <h3 className="text-xs font-bold text-[#001E62] dark:text-[#93C5FD] tracking-wider uppercase">
              {t('help.sectionSettings')}
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-[#0A111E] dark:text-[#E2E8F0] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.settingsPoint1Title')}</strong> {t('help.settingsPoint1Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.settingsPoint2Title')}</strong> {t('help.settingsPoint2Text')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#001E62] dark:text-[#60A5FA] font-bold">•</span>
              <span><strong className="text-[#0A111E] dark:text-white">{t('help.settingsPoint3Title')}</strong> {t('help.settingsPoint3Text')}</span>
            </li>
          </ul>
        </section>

        {/* 🔒 PRIVACIDADE */}
        <section className="bg-[#E8EEF8]/60 dark:bg-[#172554]/50 rounded-xl p-4 border border-[#001E62]/20 dark:border-[#3B82F6]/30 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#001E62] dark:text-[#60A5FA] shrink-0 mt-0.5" />
          <p className="text-xs text-[#0A111E] dark:text-[#F8FAFC] leading-relaxed">
            <strong className="text-[#001E62] dark:text-[#93C5FD]">{t('help.sectionPrivacyTitle')}</strong> {t('help.sectionPrivacyText')}
          </p>
        </section>
      </div>
    </div>
  );
};
