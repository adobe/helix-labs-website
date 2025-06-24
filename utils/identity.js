/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
// eslint-disable-next-line max-classes-per-file
let jimp;
const sessions = {};
let identityDB;

/**
 * A simple sequential task queue implementation that will ensure that each `run()` will
 * wait for the previous `run()` to complete first. Provide the execution function as
 * a constructor argument.
 *
 * Example usage:
 * ```
 * // this fetches URLs one at a time
 * const taskQueue = new TaskQueue(async (url) => {
 *   return fetch(url);
 * });
 *
 * await taskQueue.run('https://example.com/1');
 * await taskQueue.run('https://example.com/2');
 * await taskQueue.run('https://example.com/3');
 * ```
 */
class TaskQueue {
  /**
   * Create a new task queue.
   * @param {Function} fn - The task execution function.
   */
  constructor(fn) {
    this.pending = Promise.resolve();
    this.fn = fn;
  }

  async #process(...args) {
    try {
      await this.pending;
    } catch (_e) {
      // ignore, should be handled by other Promise branch returned by run()
    }
    return this.fn(...args);
  }

  /**
   * Run the task. Will wait for the previous `run()` to complete first.
   * @param {...any} args - The arguments to pass to the task execution function.
   * @returns {Promise<any>} A promise that resolves to the result of the task execution.
   */
  async run(...args) {
    this.pending = this.#process(...args);
    return this.pending;
  }
}

class AsyncIndexedDB {
  constructor(db) {
    this.db = db;

    // TODO: might need to be configurable?
    this.db.onversionchange = (event) => {
      console.debug('Received a versionchange event for AsyncIndexedDB, closing connnection:', event);
      this.db.close();
    };
  }

  static async open(name, schema, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onupgradeneeded = (event) => {
        if (event.oldVersion === 0) {
          console.debug('Initializing IndexedDB', name, `(version ${event.newVersion})`);
        } else {
          console.debug('Migrating IndexedDB', name, `from version ${event.oldVersion} to ${event.newVersion}`);
        }
        schema(event);
      };
      request.onsuccess = () => resolve(new AsyncIndexedDB(request.result));
      request.onerror = () => reject(request.error);
    });
  }

  async add(store, doc) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const request = tx.objectStore(store).add(doc);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(store, index, key) {
    if (!key) {
      key = index;
      index = undefined;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const objStore = tx.objectStore(store);
      const request = index ? objStore.index(index).get(key) : objStore.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

async function openIdentityDB() {
  const schema = (event) => {
    const { transaction, result: db } = event.target;
    if (event.oldVersion === 0) {
      // initialize new DB with current schema
      db.createObjectStore('images', { keyPath: 'url' });
    } else if (event.oldVersion < 4) {
      // v1 => v2 upgrade
      const store = transaction.objectStore('images');
      if (store.indexNames.includes('url')) {
        store.deleteIndex('url');
      }
    }
  };
  return AsyncIndexedDB.open('identity', schema, 4);
}

/**
 * Optional initialization function. Usually, getImageFingerprint() will
 * initialize the identity automatically (load libraries & models).
 * Use this function to pre-initialize the identity model manually, if needed.
 *
 * @returns {Promise<void>}
 */
export async function initIdentity() {
  if (!window.ort) {
    console.debug('Loading ONNX runtime...');

    // eslint-disable-next-line import/no-unresolved
    jimp = await import('https://cdn.jsdelivr.net/npm/jimp@1.6.0/+esm');

    const start = Date.now();
    /* global ort */
    // for some reason the ESM import below is not working
    // import onnxruntimeWeb from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/+esm'
    // hence we load the web distribution the old school way
    const onnxScript = document.createElement('script');

    // all providers (184 kb + 16 kb for wasm dep)
    // onnxScript.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.1/dist/ort.all.min.js';
    // only wasm (93 kb + 16 kb for wasm dep)
    // onnxScript.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.1/dist/ort.min.js';
    // only webgpu (93 kb + 16 kb for wasm dep)
    onnxScript.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.1/dist/ort.webgpu.min.js';

    document.head.appendChild(onnxScript);
    await new Promise((resolve) => {
      onnxScript.onload = resolve;
    });
    console.debug('ONNX runtime loaded in', Date.now() - start, 'ms');
  }

  if (!sessions.fingerprint) {
    const EXECUTION_PROVIDERS = [/* 'webnn', */'webgpu', 'wasm'];
    console.debug('Loading fingerprint model with execution provider preference:', EXECUTION_PROVIDERS.join(', '));
    const start = Date.now();
    const FINGERPRINTER_MODEL_URL = '/tools/asset-identity/models/fingerprinter_behance_c5_grad_v2.onnx';
    // ort.env.debug = true;
    // ort.env.logLevel = 'verbose';
    sessions.fingerprint = await ort.InferenceSession.create(FINGERPRINTER_MODEL_URL, {
      executionProviders: EXECUTION_PROVIDERS,
    });
    console.debug('Loaded fingerprint model in', Date.now() - start, 'ms');
  }
}

// function tensorValueNCHW(tensor, n, c, h, w) {
//   const W = tensor.dims[3];
//   const HW = tensor.dims[2] * W;
//   const CHW = tensor.dims[1] * HW;
//   return tensor.data[n * CHW + c * HW + h * W + w];
// }

// function logPixel(tensor, x, y) {
//   // for NCHW and RGB format
//   const R = tensorValueNCHW(tensor, 0, 0, y, x);
//   const G = tensorValueNCHW(tensor, 0, 1, y, x);
//   const B = tensorValueNCHW(tensor, 0, 2, y, x);
//   console.debug(`${R.toFixed(6)}\t${G.toFixed(6)}\t${B.toFixed(6)}\t\t[${x},${y}]`);
// }

function getImageData(imageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function jimpImageToOnnxTensorRGB(image, dims, normalize) {
  const [R, G, B] = [[], [], []];

  // Loop through the image buffer and extract the R, G, and B channels
  for (let y = 0; y < dims[2]; y += 1) {
    for (let x = 0; x < dims[3]; x += 1) {
      const rgba = jimp.intToRGBA(image.getPixelColor(x, y));
      // convert RGB 0...255 to float 0...1.0
      // and normalize if requested
      if (normalize) {
        R.push(((rgba.r / 255.0) - normalize.mean[0]) / normalize.std[0]);
        G.push(((rgba.g / 255.0) - normalize.mean[1]) / normalize.std[1]);
        B.push(((rgba.b / 255.0) - normalize.mean[2]) / normalize.std[2]);
      } else {
        R.push(rgba.r / 255.0);
        G.push(rgba.g / 255.0);
        B.push(rgba.b / 255.0);
      }
    }
  }
  // Concatenate RGB to transpose [H, W, 3] -> [3, H, W] to a number array
  const rgbData = R.concat(G).concat(B);

  // create the Float32Array size 3 * H * W for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
  for (let i = 0; i < rgbData.length; i += 1) {
    float32Data[i] = rgbData[i];
  }

  return new ort.Tensor('float32', float32Data, dims);
}

async function runImageFingerprint(img, url) {
  if (typeof img === 'string') {
    url = url || img;
  } else if (img instanceof HTMLImageElement) {
    url = url || img.src;
  }

  // ignore data URLs for now
  if (url && url.startsWith('data:')) {
    url = undefined;
  }

  if (!identityDB) {
    try {
      identityDB = await openIdentityDB();
    } catch (error) {
      console.warn('Error opening identity cache DB. Ignoring.', error);
    }
  }

  if (identityDB && url) {
    try {
      const image = await identityDB.get('images', url);
      if (image && image.fingerprint) {
        console.debug(`Found fingerprint in IndexedDB cache: ${url}`);
        return image.fingerprint;
      }
    } catch (error) {
      console.warn('Error getting image from identity cache DB. Ignoring.', error);
    }
  }

  // calculcate using identity

  const INPUT_SIZE = 384;
  const NORMALIZE = {
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  };

  await initIdentity();

  const { Jimp } = jimp;

  const start = Date.now();

  let image;
  if (typeof img === 'string') {
    image = await Jimp.read(img);
  } else if (img instanceof ArrayBuffer) {
    image = await Jimp.fromBuffer(img);
  } else if (img instanceof ImageData) {
    image = await Jimp.fromBitmap(img);
  } else if (img instanceof HTMLImageElement) {
    image = await Jimp.fromBitmap(getImageData(img));
  } else {
    throw new Error('Invalid type of img argument in getImageFingerprint()');
  }

  // console.debug('Fingerprinting image:', image.width, image.height, url);

  image.resize({ w: INPUT_SIZE, h: INPUT_SIZE, mode: Jimp.RESIZE_BILINEAR });

  const shape = [1, 3, INPUT_SIZE, INPUT_SIZE];
  const inputTensor = jimpImageToOnnxTensorRGB(image, shape, NORMALIZE);

  const loadTime = Date.now() - start;

  const startInference = Date.now();

  const result = await sessions.fingerprint.run({ image: inputTensor });

  const features = await result.embedding.getData();

  console.debug(`Image loaded in ${loadTime} ms, feature vector calculated in ${Date.now() - startInference} ms: ${url || '<unknown url>'}`);

  if (url) {
    try {
      await identityDB.add('images', { url, fingerprint: features });
    } catch (error) {
      console.warn('Error adding image to identityDB. Ignoring.', error);
    }
  }

  return features;
}

const queues = {
  imageFingerprint: new TaskQueue(runImageFingerprint),
};

/**
 * Get a 256-dimension float32 vector fingerprint of an image.
 *
 * @param {string|HTMLImageElement|ImageData|Buffer|ArrayBuffer} img - The image to fingerprint.
 *                                  Can be a URL, an HTMLImageElement, an ImageData object,
 *                                  a Buffer, or an ArrayBuffer.
 * @param {string} [url] - Optional URL of the image (identifier) if 'img' object is one without
 *                         a URL or to set a different URL.
 * @returns {Promise<Float32Array>} A 256-dimension float32 vector fingerprint of the image.
 */
export async function getImageFingerprint(img, url) {
  return queues.imageFingerprint.run(img, url);
}
