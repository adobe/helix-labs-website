import PromisePool from './promisepool.js';

const LOAD_URLS_CONCURRENCY = 50;

/**
 * Class which maintains that we dont load too many image
 * URLs and also that we dont fetch too many URLs similtaneously.
 *
 * If we need to delay time between url fetches, it could be added
 * here also.
 */
class UrlResourceHandler {
  static #promisePool;

  static initialize() {
    this.#promisePool = new PromisePool(LOAD_URLS_CONCURRENCY, 'URL Loading Pool');
  }

  /**
   * used for loading img elements.
   */
  static async run(task) {
    return this.#promisePool.run(task);
  }

  static async fetch(url, options) {
    return this.#promisePool.run(async () => fetch(url, options));
  }
}

export default UrlResourceHandler;
