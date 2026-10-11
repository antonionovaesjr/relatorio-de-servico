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

  const root = document.documentElement;
  root.classList.remove('env-dev');

  // Mantém sempre o tema Midnight Blue original (#001E62)
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = '#001E62';
  }

  const favicons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
  const prodFaviconUrl = `${import.meta.env.BASE_URL}favicon.svg`;
  favicons.forEach((fav) => {
    fav.href = prodFaviconUrl;
  });
}
