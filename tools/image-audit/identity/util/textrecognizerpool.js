import Tesseract from 'tesseract.js';
import PromisePool from '../../util/promisepool.js';

class TextRecognizerPool {
  #idleWorkers = [];

  #busyWorkers = new Set();

  #lang;

  #inactivityTimeout = 60000; // 60 seconds

  #recognitionTimeout = 40000; // 40 seconds

  #inactivityTimer;

  #promisePool;

  constructor(languages = ['eng'], concurrency = 10) {
    this.#lang = languages.join('+'); // Combine languages for Tesseract
    this.#promisePool = new PromisePool(concurrency, 'OCR Pool');
  }

  async #createWorker() {
    return Tesseract.createWorker(this.#lang);
  }

  async #getWorker() {
    if (this.#idleWorkers.length > 0) {
      const worker = this.#idleWorkers.pop();
      this.#busyWorkers.add(worker);
      this.#resetInactivityTimer();
      return worker;
    }
    const newWorker = await this.#createWorker();
    this.#busyWorkers.add(newWorker);
    this.#resetInactivityTimer();
    return newWorker;
  }

  #releaseWorker(worker) {
    this.#busyWorkers.delete(worker);
    this.#idleWorkers.push(worker);
    this.#resetInactivityTimer();
  }

  #terminateAllWorkers() {
    clearTimeout(this.#inactivityTimer);
    [...this.#idleWorkers, ...this.#busyWorkers].forEach((worker) => worker.terminate());
    this.#idleWorkers = [];
    this.#busyWorkers.clear();
  }

  #resetInactivityTimer() {
    clearTimeout(this.#inactivityTimer);
    if (this.#busyWorkers.size === 0) {
      this.#inactivityTimer = setTimeout(() => this
        .#terminateAllWorkers(), this.#inactivityTimeout);
    }
  }

  async recognize(imageElement) {
    return this.#promisePool.run(async () => this.#recognize(imageElement));
  }

  async #recognize(imageElement) {
    const worker = await this.#getWorker();

    // Recognition promise
    const recognitionPromise = worker.recognize(imageElement);

    // Timeout promise that rejects if recognition takes too long
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        worker.terminate(); // Terminate the worker after timeout
        // eslint-disable-next-line no-console
        console.warn(`Recognition of ${imageElement.src} timed out after 20 seconds`);
        reject(new Error(`Recognition of ${imageElement.src} timed out after 20 seconds`));
      }, this.#recognitionTimeout); // 20 seconds timeout

      // Cancel the timeout if the recognition finishes in time
      recognitionPromise.finally(() => clearTimeout(timeoutId));
    });

    try {
      // Race between the recognition process and the timeout
      return await Promise.race([recognitionPromise, timeoutPromise]);
    } finally {
      // Release the worker back to the pool
      this.#releaseWorker(worker);
    }
  }
}

export default TextRecognizerPool;
