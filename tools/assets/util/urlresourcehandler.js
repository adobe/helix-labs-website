import PromisePool from './promisepool.js';

const LOAD_URLS_CONCURRENCY = 50;
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
   * Wraps a URL with the CORS proxy if proxy mode is enabled.
   * @param {string|URL} url - The URL to potentially wrap
   * @returns {string} The original or proxied URL
   */
  static #getProxiedUrl(url) {
    if (!this.#useProxy) {
      return url;
    }
    const urlString = url instanceof URL ? url.href : url;
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
    return this.#promisePool.run(async () => fetch(fetchUrl, options));
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
