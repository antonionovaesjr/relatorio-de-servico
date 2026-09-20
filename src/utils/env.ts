/**
 * Detecta se a aplicação está rodando em ambiente de desenvolvimento
 * (localhost, 127.0.0.1 ou IPs de rede local 192.168.x.x, 10.x.x.x, etc.)
 */
export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    import.meta.env.DEV ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.16.') ||
    host.startsWith('172.17.') ||
    host.startsWith('172.18.') ||
    host.startsWith('172.19.') ||
    host.startsWith('172.2') ||
    host.startsWith('172.3') ||
    host.endsWith('.local')
  );
}

/**
 * Aplica os ajustes visuais dependendo do ambiente:
 * - DEV (localhost ou 192.168.x.x): Paleta roxa e Favicon vermelho
 * - PRODUÇÃO: Paleta Midnight Blue e Favicon oficial
 */
export function applyEnvironmentVisuals(): void {
  if (typeof document === 'undefined') return;

  const isDev = isDevEnvironment();
  const root = document.documentElement;

  if (isDev) {
    root.classList.add('env-dev');

    // Troca o Favicon para Vermelho em todos os links de favicon
    const favicons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
    const devFaviconUrl = `${import.meta.env.BASE_URL}favicon-dev.svg`;
    favicons.forEach((fav) => {
      fav.href = devFaviconUrl;
    });

    // Se não houver link rel="icon", cria um
    if (favicons.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = devFaviconUrl;
      document.head.appendChild(link);
    }

    // Atualiza theme-color para Roxo na barra do navegador móvel
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = '#6B21A8';
    }

    // Prefixa título com [DEV]
    if (!document.title.startsWith('[DEV]')) {
      document.title = `[DEV] ${document.title}`;
    }
  } else {
    root.classList.remove('env-dev');

    // Mantém o Favicon original Midnight Blue
    const favicons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
    const prodFaviconUrl = `${import.meta.env.BASE_URL}favicon.svg`;
    favicons.forEach((fav) => {
      fav.href = prodFaviconUrl;
    });

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = '#001E62';
    }

    if (document.title.startsWith('[DEV] ')) {
      document.title = document.title.replace('[DEV] ', '');
    }
  }
}
