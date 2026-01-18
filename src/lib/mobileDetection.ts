/**
 * Mobile Detection Utility
 *
 * Centralized mobile detection logic used across the application.
 * Uses a scoring system based on multiple signals to determine mobile status.
 */

/**
 * Check if the device is mobile based on multiple signals.
 * Returns true if at least 2 of the following conditions are met:
 * - User agent indicates mobile device
 * - Touch capability detected
 * - Screen width is below 768px
 */
export function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;

  // Use type assertions for legacy browser properties (vendor, opera)
  const nav = navigator as Navigator & { vendor?: string };
  const win = window as Window & { opera?: string };
  const userAgent = navigator.userAgent || nav.vendor || win.opera || '';

  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isUserAgentMobile = mobileRegex.test(userAgent.toLowerCase());
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  const conditions = [isUserAgentMobile, hasTouch, isSmallScreen];
  return conditions.filter(Boolean).length >= 2;
}

/**
 * Check if debug mobile mode is enabled via window.DEBUG_MOBILE
 */
export function isDebugMobileEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as Window & { DEBUG_MOBILE?: boolean }).DEBUG_MOBILE === true;
}

/**
 * Combined check including debug mode
 */
export function isMobileDevice(): boolean {
  return checkIsMobile() || isDebugMobileEnabled();
}
