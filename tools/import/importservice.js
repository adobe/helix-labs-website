const endpoint = Object.freeze({
  STAGE: 'https://spacecat.experiencecloud.live/api/ci',
  PROD: 'https://spacecat.experiencecloud.live/api/v1',
});

const IMPORT_PATH = '/tools/import';
const IMPORT_JOBS_PATH = `${IMPORT_PATH}/jobs`;
const POLL_INTERVAL = 5000;
const STORAGE_API_KEY = 'service-importer-apiKey';
const STORAGE_JOBS = 'service-importer-jobs';

export default class ImportService {
  constructor(cfg) {
    this.config = {
      endpoint: 'PROD',
      poll: false,
      ...cfg,
    };
    this.endpoint = endpoint[this.config.endpoint];
    this.apiKey = this.config.apiKey || localStorage.getItem(STORAGE_API_KEY) || '';
    this.listeners = [];
    this.job = {};
    this.busy = false;

    localStorage.setItem(STORAGE_API_KEY, this.apiKey);
  }

  #sendEvent(job) {
    this.listeners.forEach((listener) => listener({ job }));
  }

  #getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    localStorage.setItem(STORAGE_API_KEY, apiKey);
  }

  setJob(job) {
    this.job = job;
  }

  async init() {
    if (!this.job.id) {
      const jobs = ImportService.getJobs();
      if (jobs.length > 0) {
        this.job = jobs[jobs.length - 1];
      }
    }
    if (this.job.id) {
      return this.startPolling();
    }
    return Promise.resolve();
  }

  async startPolling() {
    const $this = this;

    const poll = async () => {
      if ($this.busy) {
        return;
      }
      const { id: jobId } = $this.job;
      if (jobId) {
        await $this.queryJob($this.job);
        if ($this.job.status === 'COMPLETE' || $this.job.status === 'FAILURE') {
          clearInterval($this.importInterval);
          $this.importInterval = undefined;
          const { downloadUrl } = await $this.fetchResult($this.job);
          if (downloadUrl) {
            $this.job = { ...$this.job, downloadUrl };
            this.#sendEvent($this.job);
          }
        }
      }
    };

    if (this.importInterval) {
      clearInterval(this.importInterval);
      this.importInterval = undefined;
    }

    if (this.config.poll || !$this.apiKey) {
      await poll();
      if (!this.importInterval && this.job?.status === 'RUNNING') {
        // start polling
        this.importInterval = setInterval(poll, POLL_INTERVAL);
      }
    }
  }

  static getJobs() {
    const storedJobs = localStorage.getItem(STORAGE_JOBS);
    if (!storedJobs) {
      return [];
    }
    const allJobs = (storedJobs ? JSON.parse(storedJobs) : []);

    // remove jobs older than 30 days
    const filteredJobs = allJobs.filter((job) => {
      const now = new Date();
      const created = new Date(job.startTime);
      const diff = now.getTime() - created.getTime();
      return diff < 30 * 24 * 60 * 60 * 1000;
    });
    if (filteredJobs) {
      localStorage.setItem(STORAGE_JOBS, JSON.stringify(filteredJobs));
    }
    return filteredJobs;
  }

  static clearHistory() {
    localStorage.setItem(STORAGE_JOBS, JSON.stringify([]));
  }

  async startJob({ urls = [], options = {}, importScript }) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    const body = importScript ? { urls, options, importScript } : { urls, options };
    try {
      const resp = await fetch(`${this.endpoint}${IMPORT_JOBS_PATH}`, {
        method: 'POST',
        headers: this.#getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        this.job = await resp.json();
        if (this.job.id) {
          const localJobs = ImportService.getJobs();
          localJobs.push(this.job);
          localStorage.setItem(STORAGE_JOBS, JSON.stringify(localJobs));
        }
      } else {
        const msg = resp.headers.get('x-error');
        this.job = {
          status: 'FAILURE',
          message: msg,
        };
      }
      this.#sendEvent(this.job);
      this.startPolling();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    return this.job;
  }

  async queryJob(job) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    const { id: jobId } = job;
    if (!jobId) {
      throw new Error('No job ID available');
    }
    try {
      this.busy = true;
      const resp = await fetch(`${this.endpoint}${IMPORT_JOBS_PATH}/${jobId}`, {
        headers: this.#getAuthHeaders(),
      });
      if (resp.ok) {
        this.job = await resp.json();
        this.#sendEvent(this.job);
      } else {
        this.job = {};
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    this.busy = false;
    return this.job;
  }

  async fetchResult(job) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    const { id: jobId } = job;
    if (!jobId) {
      throw new Error('No job ID available');
    }
    try {
      const resp = await fetch(
        `${this.endpoint}${IMPORT_JOBS_PATH}/${jobId}/result`,
        {
          method: 'POST',
          headers: this.#getAuthHeaders(),
          body: JSON.stringify({}),
        },
      );
      if (resp.ok) {
        return await resp.json();
      }
      return {};
    } catch (e) {
      /* eslint-disable no-console */
      console.error(e);
    }
    return undefined;
  }

  addListener(listener) {
    this.listeners.push(listener);
  }
}
