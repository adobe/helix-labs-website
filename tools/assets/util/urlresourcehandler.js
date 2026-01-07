import PromisePool from './promisepool.js';

// The proxy is a shared external service and can time out or throttle under high parallelism.
// Keep this conservative to reduce false image-load failures on large crawls.
const LOAD_URLS_CONCURRENCY = 20;
const CORS_PROXY_URL = 'https://little-forest-58aa.david8603.workers.dev/?url=';

// Set to false for debugging direct requests (requires CORS browser extension)
const USE_CORS_PROXY = true;

/**
 * Class which maintains that we dont load too many image
 * URLs and also that we dont fetch too many URLs similtaneously.
 *
 * If we need to delay time between url fetches, it could be added
 * here also.
 */
class UrlResourceHandler {
  static #promisePool;

  static #useProxy = USE_CORS_PROXY;

  static #abortSignal = null;

  static initialize() {
    this.#promisePool = new PromisePool(LOAD_URLS_CONCURRENCY, 'URL Loading Pool');
  }

  /**
   * Enable or disable CORS proxy for all fetch requests.
   * @param {boolean} enabled - Whether to use the proxy
   */
  static setProxyEnabled(enabled) {
    this.#useProxy = enabled;
  }

  /**
   * Check if proxy is currently enabled.
   * @returns {boolean} Whether proxy is enabled
   */
  static isProxyEnabled() {
    return this.#useProxy;
  }

  /**
   * Provide a global abort signal for all requests (per-run).
   * @param {AbortSignal|null} signal
   */
  static setAbortSignal(signal) {
    this.#abortSignal = signal || null;
  }

  static #composeAbortSignal(signalA, signalB) {
    const a = signalA || null;
    const b = signalB || null;
    if (!a && !b) return undefined;
    if (a && !b) return a;
    if (b && !a) return b;

    // Use AbortSignal.any if available.
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
      return AbortSignal.any([a, b]);
    }

    // Fallback: create a new controller that aborts when either input aborts.
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (a.aborted || b.aborted) {
      abort();
      return controller.signal;
    }
    a.addEventListener('abort', abort, { once: true });
    b.addEventListener('abort', abort, { once: true });
    return controller.signal;
  }

  /**
   * Wraps a URL with the CORS proxy if proxy mode is enabled.
   * Skips proxy for same-origin requests.
   * @param {string|URL} url - The URL to potentially wrap
   * @returns {string} The original or proxied URL
   */
  static #getProxiedUrl(url) {
    if (!this.#useProxy) {
      return url;
    }
    
    const urlString = url instanceof URL ? url.href : url;
    
    // Skip proxy for same-origin requests
    try {
      const targetUrl = new URL(urlString);
      const currentOrigin = window.location.origin;
      
      if (targetUrl.origin === currentOrigin) {
        return urlString;
      }
      
      // TEMPORARY CHECK: Validate that cross-origin requests are allowed
      // Only sitemap.xml and robots.txt should come from external domains
      const siteUrl = document.getElementById('site-url')?.value;
      if (siteUrl) {
        const siteOrigin = new URL(siteUrl).origin;
        const isSiteUrl = targetUrl.origin === siteOrigin;
        const isSitemapOrRobots = targetUrl.pathname.endsWith('/sitemap.xml') 
          || targetUrl.pathname.endsWith('/robots.txt')
          || targetUrl.pathname.includes('/sitemap');
        
        if (!isSiteUrl && !isSitemapOrRobots) {
          // eslint-disable-next-line no-console
          console.error(`[PROXY ERROR] Attempting to proxy URL that is not from site origin: ${urlString}`);
          // eslint-disable-next-line no-console
          console.error(`  Site URL: ${siteUrl}`);
          // eslint-disable-next-line no-console
          console.error(`  Target URL: ${urlString}`);
          // eslint-disable-next-line no-console
          console.error('  This URL should have been transformed to the internal site domain.');
          throw new Error(`Invalid proxy request: ${urlString} is not from site origin ${siteOrigin}`);
        }
      }
    } catch (error) {
      // Re-throw validation errors
      if (error.message.startsWith('Invalid proxy request:')) {
        throw error;
      }
      // Invalid URL, let it fail naturally
    }
    
    return `${CORS_PROXY_URL}${encodeURIComponent(urlString)}`;
  }

  /**
   * used for loading img elements.
   */
  static async run(task) {
    return this.#promisePool.run(task);
  }

  /**
   * Fetch a URL, optionally through the CORS proxy.
   * @param {string|URL} url - The URL to fetch
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<Response>} The fetch response
   */
  static async fetch(url, options) {
    const fetchUrl = this.#getProxiedUrl(url);
    const mergedSignal = this.#composeAbortSignal(options?.signal, this.#abortSignal);
    const mergedOptions = mergedSignal ? { ...(options || {}), signal: mergedSignal } : options;
    return this.#promisePool.run(async () => fetch(fetchUrl, mergedOptions));
  }

  /**
   * Get a URL suitable for direct use (e.g., in img.src), proxied if needed.
   * @param {string|URL} url - The URL to potentially proxy
   * @returns {string} The original or proxied URL
   */
  static getImageUrl(url) {
    return this.#getProxiedUrl(url);
  }
}

export default UrlResourceHandler;
