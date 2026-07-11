/**
 * Detect if the app is running as an installed PWA (standalone mode).
 * Returns true on Android (Chrome PWA), iOS (Safari Add to Home Screen), or TWA.
 */
export function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}
