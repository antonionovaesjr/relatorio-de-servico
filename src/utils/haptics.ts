export function triggerHaptic(duration = 12): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Falha silenciosa em navegadores sem suporte
    }
  }
}
