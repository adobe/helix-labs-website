import Tesseract from 'tesseract.js';
import PromisePool from '../../util/promisepool.js';

class TextRecognizerPool {
  #lang;

  #recognitionTimeout = 40000; // 40 seconds

  #promisePool;

  constructor(languages = ['eng'], concurrency = 5) {
    this.#lang = languages.join('+'); // Combine languages for Tesseract
    this.#promisePool = new PromisePool(concurrency, 'OCR Pool');
  }

  async recognize(imageElement) {
    return this.#promisePool.run(async () => this.#recognize(imageElement));
  }

  async #recognize(imageElement) {
    // Do not re-use workers. They learn and bloat.
    // https://github.com/naptha/tesseract.js/blob/master/docs/workers_vs_schedulers.md#reusing-workers-in-nodejs-server-code
    const worker = await Tesseract.createWorker(this.#lang);
    let terminated = false;

    try {
      const recognitionPromise = worker.recognize(imageElement);

      // Timeout promise that rejects if recognition takes too long
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(async () => {
          terminated = true;
          await worker.terminate();
          // eslint-disable-next-line no-console
          console.warn(`Recognition of ${imageElement.src} timed out after ${this.recognitionTimeout / 1000} seconds`);
          reject(new Error(`Recognition of ${imageElement.src} timed out after ${this.recognitionTimeout / 1000} seconds`));
        }, this.#recognitionTimeout);

        // Cancel the timeout if the recognition finishes in time
        recognitionPromise.finally(() => clearTimeout(timeoutId));
      });

      return await Promise.race([recognitionPromise, timeoutPromise]);
    } finally {
      if (!terminated) await worker.terminate();
    }
  }
}

export default TextRecognizerPool;
