export function fadeIn(element, { duration = 400, delay = 0 } = {}) {
  if (!element || typeof element.animate !== 'function') return null;

  return element.animate(
    [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration, delay, easing: 'ease-out', fill: 'both' },
  );
}
