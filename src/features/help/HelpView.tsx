import React from 'react';
import {
  HelpCircle,
  MessageSquare,
  PlusCircle,
  Paperclip,
  User,
  ShieldCheck,
} from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-3.5 pb-6 select-none animate-fade-in">
      {/* Cabeçalho */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E1FFD2] dark:bg-[#005C4B]/60 text-[#008069] dark:text-[#01D65A] flex items-center justify-center font-bold">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#111B1F] dark:text-[#E9EDEF]">
            ℹ️ Ajuda — Como Usar o Relógio de Serviço
          </h1>
          <p className="text-xs text-[#657484] dark:text-[#8696A0]">
            Guia rápido do Relógio de Serviço PWA (v9)
          </p>
        </div>
      </section>

      {/* 💬 INÍCIO */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <MessageSquare className="w-4 h-4 text-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            💬 INÍCIO
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E9EDEF] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Resumo anual:</strong> Cards com estudos, horas (hh:mm), dias e horas restantes.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Progresso da designação:</strong> Exibido automaticamente para pioneiros regulares.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Gráfico de barras:</strong> Toque na barra do mês para abrir os registros correspondentes.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>FAB verde (➕):</strong> No centro da barra e no canto inferior direito para abrir o Novo Registro.</span>
          </li>
        </ul>
      </section>

      {/* ✏️ REGISTRO */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <PlusCircle className="w-4 h-4 text-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            ✏️ REGISTRO
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E9EDEF] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Data completa:</strong> Escolha qualquer dia no calendário nativo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Horas:</strong> Digite <code>hh:mm</code> (ex: <code>4:15</code>) ou decimal (ex: <code>4,25</code>) + use os botões rápidos de incremento.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>⛔ Compartilhamento diário:</strong> Desativado para registros individuais; utilize a aba Relatórios para consolidar o mês.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>📌 Nova revisita:</strong> Abre em janela independente sobreposta para cadastro ágil do morador.</span>
          </li>
        </ul>
      </section>

      {/* 📎 RELATÓRIOS */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <Paperclip className="w-4 h-4 text-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            📎 RELATÓRIOS
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E9EDEF] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Lista de registros:</strong> Estilo de lista de conversas com dia, estudos e horas.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>Checkboxes teocráticos:</strong> Mês como pioneiro auxiliar e 50% requerida.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>📤 Compartilhar mês inteiro:</strong> Botão verde que compila o resumo e a discriminação dos dias.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>🗺️ Google Maps:</strong> Ícone de mapa verde para abrir trajetos diretamente.</span>
          </li>
        </ul>
      </section>

      {/* 👤 CONFIGURAÇÕES */}
      <section className="bg-white dark:bg-[#1F2C34] rounded-xl p-4 border border-[#E1E1E1] dark:border-[#2A3942] shadow-sm space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E1E1E1] dark:border-[#2A3942]">
          <User className="w-4 h-4 text-[#01D65A]" />
          <h2 className="text-xs font-bold text-[#008069] dark:text-[#01D65A] tracking-wider uppercase">
            👤 CONFIGURAÇÕES
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-[#111B1F] dark:text-[#E9EDEF] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span>Nome do publicador, foto de perfil e designação atual.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span>Idioma, tema (Claro/Escuro/Sistema) e notificações de revisita (1 a 7 dias).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#01D65A] font-bold">•</span>
            <span><strong>💾 Backup & Restauração:</strong> Crie arquivos <code>.rsvpwa</code>, compartilhe ou restaure a qualquer momento.</span>
          </li>
        </ul>
      </section>

      {/* 🔒 PRIVACIDADE */}
      <section className="bg-[#E1FFD2]/40 dark:bg-[#005C4B]/20 rounded-xl p-4 border border-[#01D65A]/30 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-[#008069] dark:text-[#01D65A] shrink-0 mt-0.5" />
        <p className="text-xs text-[#111B1F] dark:text-[#E9EDEF] leading-relaxed">
          <strong>🔒 100% Local & Privado:</strong> Seus dados ficam salvos exclusivamente no armazenamento do seu dispositivo. Sem chamadas externas, sem rastreadores.
        </p>
      </section>
    </div>
  );
};
