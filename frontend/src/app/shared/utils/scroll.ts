export function scrollToTop(): void {
  queueMicrotask(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
