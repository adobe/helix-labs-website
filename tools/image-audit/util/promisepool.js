/**
 * A class that manages a pool of promises with a maximum concurrency limit.
 * It controls how many promises are running at any time, and queues any additional promises.
 */
/* eslint-disable no-console */
class PromisePool {
  #maxConcurrency;

  #queue = [];

  #activeCount = 0;

  #activeTasks = [];

  #debugpool;

  #timer;

  #timerActive = false;

  #poolName;

  #awaitingFinish;

  #errorHandler;

  #queueEmptyResolver;

  constructor(maxConcurrency, poolName = 'PromisePool', debugpool = false, errorHandler = (error) => this.#defaultErrorHandler(error)) {
    this.#errorHandler = errorHandler;
    this.#maxConcurrency = maxConcurrency;
    this.#debugpool = debugpool;
    this.#poolName = `${poolName} Pool`;
    this.#awaitingFinish = 0;
    this.#queueEmptyResolver = null;

    this.activateTimer();
  }

  // eslint-disable-next-line class-methods-use-this
  #defaultErrorHandler(error) {
    console.error('Unresolved error during promise', error);
  }

  activateTimer() {
    if (!this.#timerActive && this.#debugpool) {
      this.#timerActive = true;
      console.debug(`${this.#poolName} created with maxConcurrency ${this.#maxConcurrency}`);
      this.#timer = setInterval(() => {
        if (this.#activeTasks.length === 0
          && this.#queue.length === 0
          && this.#awaitingFinish === 0) {
          clearInterval(this.#timer);
          this.#timerActive = false;
        }
        console.debug(`${this.#poolName}: ${this.#activeTasks.length} active tasks, ${this.#queue.length} queued tasks, ${this.#awaitingFinish} processes awaiting finish`);
      }, 1000);
    }
  }

  #notifyQueueEmpty() {
    if (this.#queueEmptyResolver) {
      this.#queueEmptyResolver();
    }
  }

  async run(task) {
    if (this.#awaitingFinish) {
      const error = Error('Cannot run new tasks while waiting for all tasks to settle');
      this.#errorHandler(error);
      return Promise.reject(error);
    }

    if (task.constructor.name !== 'AsyncFunction') {
      const error = Error(`Task ${task} must be an async function`);
      this.#errorHandler(error);
      return Promise.reject(error);
    }

    this.activateTimer();
    let taskName = task.name ? task.name : `${task}`;
    [taskName] = taskName.split('\n');
    let lastIndex = taskName.lastIndexOf('(');
    if (lastIndex < 0) lastIndex = taskName.length;
    let firstIndex = taskName.lastIndexOf('=>');
    if (firstIndex < 0) firstIndex = 0;
    else firstIndex += 2;
    taskName = taskName.substring(firstIndex, lastIndex).trim();

    if (this.#activeCount >= this.#maxConcurrency) {
      if (this.#debugpool) console.debug(`${this.#poolName}.run ${taskName} waiting for slot, ${this.#activeTasks.length} active tasks, ${this.#queue.length + 1} queued tasks`);
      await new Promise((resolve) => {
        this.#queue.push(resolve);
      });
    }
    this.#activeCount += 1;
    if (this.#debugpool) console.debug(`${this.#poolName}.run ${taskName} executing in slot ${this.#activeCount}`);

    let taskPromise;

    try {
      taskPromise = Promise.resolve(task());
      this.#activeTasks.push(taskPromise); // Track active task
      const rv = await taskPromise;
      if (this.#debugpool) console.debug(`${this.#poolName}.run ${taskName} finished executing`);
      return rv;
    } catch (error) {
      this.#errorHandler(error);
      return Promise.reject(error);
    } finally {
      if (this.#debugpool) console.debug(`${this.#poolName}.run releasing ${taskName} slot`);

      this.#activeCount -= 1;
      if (taskPromise) {
        this.#activeTasks = this.#activeTasks.filter((p) => p !== taskPromise);
      }
      if (this.#queue.length > 0) {
        const nextResolve = this.#queue.shift();
        nextResolve();
      } else if (this.#queue.length === 0) {
        this.#notifyQueueEmpty();
      }
    }
  }

  async allSettled() {
    // Wait for all active and queued tasks to settle
    this.#awaitingFinish += 1;
    try {
      if (this.#debugpool) console.debug(`${this.#poolName}: Awaiting ${this.#activeTasks.length + this.#queue.length} tasks to complete`);
      // Process any queued tasks
      if (this.#queue.length > 0) {
        const queueEmptyPromise = new Promise((resolve) => {
          this.#queueEmptyResolver = resolve; // Store the resolver function for later
        });
        await queueEmptyPromise; // Wait for the queue to change
      }

      if (this.#activeTasks.length !== 0) {
        return Promise.allSettled(this.#activeTasks).then(() => {
          if (this.#timer) {
            this.#timerActive = false;
            clearInterval(this.#timer);
          }
          if (this.#debugpool) console.debug(`${this.#poolName} Finished waiting for tasks to settle`);
        });
      }
      if (this.#timer) {
        this.#timerActive = false;
        clearInterval(this.#timer);
      }
      return Promise.resolve();
    } finally {
      this.#queueEmptyResolver = null;
      this.#awaitingFinish -= 1;
    }
  }
}

export default PromisePool;
