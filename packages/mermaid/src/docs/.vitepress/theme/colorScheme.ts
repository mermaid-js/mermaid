const isDark = (root: HTMLElement) => root.classList.contains('dark');

/**
 * Calls `onChange` when the page switches between light and dark mode.
 * Other attribute writes on `<html>` (VitePress's `lang`, browser extensions) are ignored,
 * so they cannot trigger re-render loops.
 * @returns a function that stops watching.
 */
export const watchColorScheme = (
  onChange: (dark: boolean) => void,
  root: HTMLElement = document.documentElement
): (() => void) => {
  let dark = isDark(root);
  const observer = new MutationObserver(() => {
    if (isDark(root) !== dark) {
      dark = !dark;
      onChange(dark);
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
