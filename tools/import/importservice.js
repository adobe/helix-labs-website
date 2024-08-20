
const endpoint = Object.freeze({
  STAGE: 'https://spacecat.experiencecloud.live/api/ci',
  PROD: 'https://spacecat.experiencecloud.live/api/v1'
})

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
    this.listeners.forEach((listener) => listener({job}));
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

  async init(job = null) {
    if (!job) {
      const jobs = ImportService.getJobs();
      if (jobs.length > 0) {
        this.job = jobs[jobs.length - 1];
      }
    } else {
      this.job = job;
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
      const {id: jobId} = $this.job;
      if (jobId) {
        await $this.queryJob($this.job);
        if ($this.job.status === 'COMPLETE' || $this.job.status === 'FAILURE') {
          window.clearInterval($this.importInterval);
          $this.importInterval = undefined;
          const { downloadUrl } = await $this.fetchResult($this.job);
          if (downloadUrl) {
            $this.job = {...$this.job, downloadUrl};
            this.#sendEvent($this.job);
          }
        }
      }
    };

    if (this.importInterval) {
      clearInterval(this.importInterval);
      this.importInterval = undefined;
    }

    if (this.config.poll) {
      await poll();
      if (!this.projectTransformInterval) {
        this.importInterval = window.setInterval(poll, POLL_INTERVAL);
      }
    }
  }

  static getJobs() {
    const storedJobs = localStorage.getItem(STORAGE_JOBS);
    if (!storedJobs) {
      return [];
    }
    const allJobs = (storedJobs ? JSON.parse(storedJobs) : []);

    // update running jobs for the next load.
    ImportService.updateRunningJobs(allJobs);

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

  clearHistory() {
    localStorage.setItem(STORAGE_JOBS, JSON.stringify([]));
  }

  async startJob({urls = [], options = {}, importScript}) {
    if (!this.apiKey) {
      throw new Error('API keys are required');
    }
    try {
      const resp = await fetch(`${this.endpoint}${IMPORT_JOBS_PATH}`, {
        method: 'POST',
        headers: this.#getAuthHeaders(),
        body: JSON.stringify({urls, options, importScript}),
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
      throw new Error('API keys are required');
    }
    const {id: jobId} = job;
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
      throw new Error('API keys are required');
    }
    const {id: jobId} = job;
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
      console.error(e);
    }
    return undefined;
  }

  /**
   * For any 'RUNNING' jobs (in localstorage), fetch their results again
   * and if no longer running, update the information.
   * TEMPORARY - needs refresh to work (probably twice).  Will eventually
   * poll for updates.
   * @param jobs
   */
  static updateRunningJobs(jobs) {
    if (!jobs?.length) {
      return;
    }
    const apiKey = localStorage.getItem('aem-spacecat-apiKey') || '';
    const importApiKey = localStorage.getItem('aem-import-apiKey') || '';

    jobs.every(async (job, index) => {
      if (job.status === 'RUNNING') {
        const service = new ImportService(({apiKey, importApiKey}));
        if (service) {
          const newJob = await service.queryJob(job);
          if (newJob && newJob.status !== 'RUNNING') {
            jobs[index] = newJob;
            localStorage.setItem(STORAGE_JOBS, JSON.stringify(jobs));
          }
        }
      }
      return job;
    });
  }

  addListener(listener) {
    this.listeners.push(listener);
  }
}
