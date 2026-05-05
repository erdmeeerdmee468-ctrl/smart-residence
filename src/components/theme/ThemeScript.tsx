/** Blocking script: syncs <html class="dark"> before first paint to avoid flash */
export function ThemeScript() {
  const code = `
(function(){
  try {
    var k = 'smart-residence-theme';
    var s = localStorage.getItem(k);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = s === 'dark' || (s !== 'light' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
