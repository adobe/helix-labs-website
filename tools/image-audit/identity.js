/* eslint-disable max-classes-per-file */

// eslint-disable-next-line import/no-unresolved, import/order
import pixelmatch from 'https://cdnjs.cloudflare.com/ajax/libs/pixelmatch/6.0.0/index.min.js';

// eslint-disable-next-line import/no-unresolved
import Tesseract from 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.esm.min.js';

// trims sha and alpha detection to this many pixels.
const maxPixelsToEval = 250000; // 500x500 pixels

const hammingDistanceThreshold = 20;

// Matching threshold for two images, ranges from 0 to 1.
// Smaller values make the comparison more sensitive.
const imageMatchingThreshold = 0.1;

// Percentage of pixels can be different between two images ot be identified the same
// 0.001 -> .1% different pixels
const exactMatchDifferentPixelPercent = 0.004;

// allow no colors to be different
const exactColorMatchThreshold = 2;

const exactTextMatchThresholdPercent = 0.1;

// Percentage of pixels can be different between two images ot be identified the same
// 0.001 - .1% different pixels
const similarityDifferentPixelPercent = 0.01;

const ALPHA_ALLOWED_FORMATS = ['png', 'webp', 'gif', 'tiff'];

// this should come from some standard library.
// If you revisit it, the color-name library didn't have the names formatted well.
const cssColors = [
  { name: 'AliceBlue', rgb: [240, 248, 255], hsl: [208, 100, 97] },
  { name: 'AntiqueWhite', rgb: [250, 235, 215], hsl: [34, 78, 91] },
  { name: 'Aqua', rgb: [0, 255, 255], hsl: [180, 100, 50] },
  { name: 'Aquamarine', rgb: [127, 255, 212], hsl: [160, 100, 75] },
  { name: 'Azure', rgb: [240, 255, 255], hsl: [180, 100, 97] },
  { name: 'Beige', rgb: [245, 245, 220], hsl: [60, 56, 91] },
  { name: 'Bisque', rgb: [255, 228, 196], hsl: [33, 100, 88] },
  { name: 'BlanchedAlmond', rgb: [255, 235, 205], hsl: [36, 100, 90] },
  { name: 'BlueViolet', rgb: [138, 43, 226], hsl: [271, 76, 53] },
  { name: 'Brown', rgb: [165, 42, 42], hsl: [0, 59, 41] },
  { name: 'Burlywood', rgb: [222, 184, 135], hsl: [34, 57, 70] },
  { name: 'CadetBlue', rgb: [95, 158, 160], hsl: [182, 25, 50] },
  { name: 'Chartreuse', rgb: [127, 255, 0], hsl: [90, 100, 50] },
  { name: 'Chocolate', rgb: [210, 105, 30], hsl: [25, 75, 47] },
  { name: 'Coral', rgb: [255, 127, 80], hsl: [16, 100, 66] },
  { name: 'CornflowerBlue', rgb: [100, 149, 237], hsl: [219, 79, 66] },
  { name: 'Cornsilk', rgb: [255, 248, 220], hsl: [48, 100, 93] },
  { name: 'Crimson', rgb: [220, 20, 60], hsl: [348, 83, 47] },
  { name: 'DarkBlue', rgb: [0, 0, 139], hsl: [240, 100, 27] },
  { name: 'DarkCyan', rgb: [0, 139, 139], hsl: [180, 100, 27] },
  { name: 'DarkGoldenRod', rgb: [184, 134, 11], hsl: [43, 89, 38] },
  { name: 'DarkGray', rgb: [169, 169, 169], hsl: [0, 0, 66] },
  { name: 'DarkGreen', rgb: [0, 100, 0], hsl: [120, 100, 20] },
  { name: 'DarkKhaki', rgb: [189, 183, 107], hsl: [56, 38, 58] },
  { name: 'DarkMagenta', rgb: [139, 0, 139], hsl: [300, 100, 27] },
  { name: 'DarkOliveGreen', rgb: [85, 107, 47], hsl: [82, 39, 30] },
  { name: 'DarkOrange', rgb: [255, 140, 0], hsl: [33, 100, 50] },
  { name: 'DarkOrchid', rgb: [153, 50, 204], hsl: [280, 61, 50] },
  { name: 'DarkRed', rgb: [139, 0, 0], hsl: [0, 100, 27] },
  { name: 'DarkSalmon', rgb: [233, 150, 122], hsl: [15, 72, 70] },
  { name: 'DarkSeaGreen', rgb: [143, 188, 143], hsl: [120, 25, 65] },
  { name: 'DarkSlateBlue', rgb: [72, 61, 139], hsl: [248, 39, 39] },
  { name: 'DarkSlateGray', rgb: [47, 79, 79], hsl: [180, 25, 25] },
  { name: 'DarkTurquoise', rgb: [0, 206, 209], hsl: [181, 100, 41] },
  { name: 'DarkViolet', rgb: [148, 0, 211], hsl: [282, 100, 41] },
  { name: 'DeepPink', rgb: [255, 20, 147], hsl: [328, 100, 54] },
  { name: 'DeepSkyBlue', rgb: [0, 191, 255], hsl: [195, 100, 50] },
  { name: 'DimGray', rgb: [105, 105, 105], hsl: [0, 0, 41] },
  { name: 'DodgerBlue', rgb: [30, 144, 255], hsl: [210, 100, 56] },
  { name: 'FireBrick', rgb: [178, 34, 34], hsl: [0, 68, 42] },
  { name: 'FloralWhite', rgb: [255, 250, 240], hsl: [40, 100, 97] },
  { name: 'ForestGreen', rgb: [34, 139, 34], hsl: [120, 61, 34] },
  { name: 'Fuchsia', rgb: [255, 0, 255], hsl: [300, 100, 50] },
  { name: 'Gainsboro', rgb: [220, 220, 220], hsl: [0, 0, 86] },
  { name: 'GhostWhite', rgb: [248, 248, 255], hsl: [240, 100, 99] },
  { name: 'Gold', rgb: [255, 215, 0], hsl: [51, 100, 50] },
  { name: 'GoldenRod', rgb: [218, 165, 32], hsl: [43, 74, 49] },
  { name: 'Gray', rgb: [128, 128, 128], hsl: [0, 0, 50] },
  { name: 'GreenYellow', rgb: [173, 255, 47], hsl: [83, 100, 59] },
  { name: 'HoneyDew', rgb: [240, 255, 240], hsl: [120, 100, 97] },
  { name: 'HotPink', rgb: [255, 105, 180], hsl: [330, 100, 71] },
  { name: 'IndianRed', rgb: [205, 92, 92], hsl: [0, 53, 58] },
  { name: 'Indigo', rgb: [75, 0, 130], hsl: [275, 100, 25] },
  { name: 'Ivory', rgb: [255, 255, 240], hsl: [60, 100, 97] },
  { name: 'Khaki', rgb: [240, 230, 140], hsl: [54, 77, 75] },
  { name: 'Lavender', rgb: [230, 230, 250], hsl: [240, 67, 94] },
  { name: 'LavenderBlush', rgb: [255, 240, 245], hsl: [340, 100, 97] },
  { name: 'LawnGreen', rgb: [124, 252, 0], hsl: [90, 100, 49] },
  { name: 'LemonChiffon', rgb: [255, 250, 205], hsl: [54, 100, 90] },
  { name: 'LightBlue', rgb: [173, 216, 230], hsl: [195, 53, 79] },
  { name: 'LightCoral', rgb: [240, 128, 128], hsl: [0, 78, 72] },
  { name: 'LightCyan', rgb: [224, 255, 255], hsl: [180, 100, 94] },
  { name: 'LightGoldenRodYellow', rgb: [250, 250, 210], hsl: [60, 80, 90] },
  { name: 'LightGreen', rgb: [144, 238, 144], hsl: [120, 73, 75] },
  { name: 'LightGrey', rgb: [211, 211, 211], hsl: [0, 0, 83] },
  { name: 'LightPink', rgb: [255, 182, 193], hsl: [351, 100, 86] },
  { name: 'LightSalmon', rgb: [255, 160, 122], hsl: [17, 100, 74] },
  { name: 'LightSeaGreen', rgb: [32, 178, 170], hsl: [177, 70, 41] },
  { name: 'LightSkyBlue', rgb: [135, 206, 250], hsl: [203, 92, 75] },
  { name: 'LightSlateGray', rgb: [119, 136, 153], hsl: [210, 14, 53] },
  { name: 'LightSteelBlue', rgb: [176, 196, 222], hsl: [214, 41, 78] },
  { name: 'LightYellow', rgb: [255, 255, 224], hsl: [60, 100, 94] },
  { name: 'LimeGreen', rgb: [50, 205, 50], hsl: [120, 61, 50] },
  { name: 'Linen', rgb: [250, 240, 230], hsl: [30, 67, 94] },
  { name: 'Magenta', rgb: [255, 0, 255], hsl: [300, 100, 50] },
  // next two are "special" colors that we use to indicate different states
  { name: 'Transparency', rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
  { name: 'Unknown', rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
];

const wordConfidenceThreshold = 85;

const numberOfTopColors = 10;
// const numberOfTopRawColors = 20;
const saturationThreshold = 10;
// eslint-disable-next-line no-undef
const colorThief = new ColorThief();

export class Identity {
  constructor(id, type, strong, signleton) {
    if (id instanceof Promise) {
      throw new Error('Identity constructor does not support promises');
    }
    this.id = id;
    this.type = type;
    this.strong = strong;
    this.signleton = signleton;
    this.identityData = {};
  }
}
export class IdentityCluster {
  constructor(
    identityProcessor,
    originatingIdentity,
    elementForCluster,
    figureForCluster,
    type,
  ) {
    this.identityProcessor = identityProcessor;
    this.identityProcessor.clusterCount += 1;
    this.id = `c:${this.identityProcessor.clusterCount}`;
    this.identities = new Map();
    this.identities.set(originatingIdentity.id, originatingIdentity);
    this.relatedClusters = new Set();
    this.figureForCluster = figureForCluster;
    this.type = type;
    this.elementForCluster = elementForCluster;
    this.clusterData = {};
    elementForCluster.dataset.src = this.id;
    this.replacedBy = null;
    this.singletons = new Map();
    this.addIdentity(originatingIdentity);
  }

  // Method to add a single identity to the identities set
  addIdentity(identity) {
    if (this.replacedBy) {
      this.replacedBy.addIdentity(identity);
      return;
    }

    if (identity.signleton) {
      if (this.singletons.has(identity.type)) {
        throw new Error(`Cluster ${this.id} already has a singleton identity of type ${identity.type}`);
      } else {
        this.singletons.set(identity.type, identity);
      }
    }

    identity.cluster = this;
    this.identities.set(identity.id, identity);
    if (identity.strong) {
      this.identityProcessor.addStrongIdentity(identity, this);
    }
  }

  getAllIdentitiesOf(type) {
    return Array.from(this.identities.values())
      .filter((identity) => identity && identity.type === type) || [];
  }

  getSingletonOf(type) {
    return this.singletons.get(type) || null;
  }

  getFirstIdentityOf(type) {
    const singleton = this.getSingletonOf(type);
    if (singleton) return singleton;

    return Array.from(this.identities.values())
      .find((identity) => identity && identity.type === type) || null;
  }

  relateCluster(cluster) {
    if (this.replacedBy) {
      this.replacedBy.relateCluster(cluster);
      return;
    }

    this.relatedClusters.add(cluster);
    cluster.relatedClusters.add(this);
  }

  // Method to recluster (merge) if types match, always makes this cluster THE cluster.
  mergeCluster(otherCluster) {
    if (otherCluster === this) {
      return;
    }
    if (this.replacedBy) {
      this.replacedBy.mergeCluster(otherCluster);
      return;
    }
    if (this.type === otherCluster.type) {
      // Merge identities from the other cluster into this one
      otherCluster.identities.forEach((value) => {
        if (value.signleton) {
          if (this.getFirstIdentityOf(value.type)) {
            // special handling for color identity
            if (value.type === 'color-identity') {
              const myColorIdentity = this.getSingletonOf('color-identity');
              const filteredArray = value.identityData.topColors.filter(
                (color) => !myColorIdentity.identityData.topColors.includes(color),
              );
              myColorIdentity.identityData.topColors.push(...filteredArray);
            }
            return; // Skip singletons that already exist
          }
        }
        this.addIdentity(value); // Merge the key-value pairs
      });

      this.getAllIdentitiesOf('similar-img-identity').forEach((identity) => {
        // no longer needed.
        if (identity.identityData.similarClusterId === this.id
            || identity.identityData.similarClusterId === otherCluster.id) {
          this.identities.delete(identity.id);
        }
      });

      // Merge related clusters from the other cluster into this one
      otherCluster.relatedClusters.forEach((cluster) => {
        // break relationship
        otherCluster.relatedClusters.remove(cluster);
        cluster.relatedClusters.remove(otherCluster);
        // attach cluster to this cluster
        this.relateCluster(cluster);
      });

      this.mergeClusterData(otherCluster);
      // Clear the other cluster
      otherCluster.destruct();
      otherCluster.replacedBy = this;
      otherCluster.identities = this.identities;
      otherCluster.relatedClusters = this.relatedClusters;
      otherCluster.figureForCluster = this.figureForCluster;
      otherCluster.elementForCluster = this.elementForCluster;
      otherCluster.clusterData = this.clusterData;
      // keeps a reference from the old cluster to the new cluster
      this.identityProcessor.clusterMap.set(otherCluster.id, this);
      // otherCluster.id = this.id;
    }
  }

  mergeClusterData(otherCluster) {
    const source = otherCluster.clusterData;

    // Iterate over own properties of the source object
    Object.entries(source).forEach(([key, sourceValue]) => {
      const targetValue = this.clusterData[key];

      // If the value is an array, merge them without adding duplicates
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        const sourceSet = new Set(sourceValue); // Create a Set from the source array
        sourceSet.forEach((item) => {
          if (!targetValue.includes(item)) {
            targetValue.push(item);
          }
        });
        this.clusterData[key] = targetValue;
      } else if (targetValue instanceof Set && sourceValue instanceof Set) {
        // Merge sets
        sourceValue.forEach((val) => targetValue.add(val));
        this.clusterData[key] = targetValue;
      } else if (targetValue instanceof Map && sourceValue instanceof Map) {
        // Merge maps
        sourceValue.forEach((val, mapKey) => {
          if (!targetValue.has(mapKey)) targetValue.set(mapKey, val);
        });
        this.clusterData[key] = targetValue;
      } else if (targetValue !== undefined) {
        // Prefer the target value in case of conflict
        this.clusterData[key] = targetValue;
      } else {
        this.clusterData[key] = sourceValue;
      }
    });
  }

  getAll(identityType, propertyKey) {
    const values = [];
    this.getAllIdentitiesOf(identityType).forEach((identity) => {
      const propertyValue = identity.identityData[propertyKey];

      if (Array.isArray(propertyValue)) {
        values.push(...propertyValue);
      } else if (propertyValue instanceof Set) {
        values.push(...Array.from(propertyValue));
      } else if (propertyValue) {
        values.push(propertyValue);
      }
    });
    return values;
  }

  destruct() {
    if (this.replacedBy) {
      return;
    }

    this.identities.forEach((identity) => {
      if (this.identities.strong) {
        this.identityProcessor.strongIdentityToClusterMap.delete(identity.id);
      }
    });

    this.identities.clear();
    this.relatedClusters.clear();
    this.figureForCluster?.parentElement?.removeChild(this.figureForCluster);
    this.figureForCluster.removeChild(this.elementForCluster);
    this.figureForCluster = null;
    this.elementForCluster = null;
    this.clusterData = {};

    this.identityProcessor.clusterMap.delete(this.id);
  }
}

export class IdentityProcessor {
  constructor(edsHosts, colorAddedCallback) {
    this.edsHosts = edsHosts;
    this.perceptualHashMap = new Map();
    this.strongIdentityToClusterMap = new Map();
    this.clusterMap = new Map();
    this.usedColors = new Set();
    this.clusterCount = 0;
    this.colorAddedCallback = colorAddedCallback;
    this.currentlyTextIdentifyingCount = 0;
  }

  addCluster(cluster) {
    this.clusterMap.set(cluster.id, cluster);
    return cluster.id;
  }

  getCluster(clusterId) {
    return this.clusterMap.get(clusterId);
  }

  addStrongIdentity(identity, cluster) {
    if (identity.strong) this.strongIdentityToClusterMap.set(identity.id, cluster);
  }

  removeStrongIdentity(identity) {
    if (identity.strong) this.strongIdentityToClusterMap.delete(identity.id);
  }

  // eslint-disable-next-line class-methods-use-this
  async #createHash(value) {
    let smallerValue = null;
    if (typeof value === 'string') {
      smallerValue = value;
    } else {
      smallerValue = value.slice(0, Math.min(value.byteLength, maxPixelsToEval * 4));
    }

    // crypto only available on https.
    if (crypto?.subtle?.digest) {
      let hashBuffer = null;
      const encoder = new TextEncoder();
      if (typeof value === 'string') {
        hashBuffer = await crypto.subtle.digest('SHA-1', new Uint8Array(encoder.encode(smallerValue)));
      } else {
        hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(encoder.encode(new Uint8Array(smallerValue))));
      }

      const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
      const rv = hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('');
      // if (typeof value === 'string') {
      // eslint-disable-next-line max-len
      //   console.log(`Hashed ${value} to b16: ${hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('')} b36: ${rv}`);
      // }
      return rv;
    }

    let hash = null;
    if (typeof value === 'string') {
      // eslint-disable-next-line no-undef
      hash = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(smallerValue));
    } else {
      // eslint-disable-next-line no-undef
      hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(smallerValue));
    }

    // eslint-disable-next-line no-undef
    const hexHash = hash.toString(CryptoJS.enc.Hex); // Convert to hexadecimal format
    // eslint-disable-next-line no-undef
    const rv = BigInt(`0x${hexHash}`).toString(36);
    // if (typeof value === 'string') {
    //  console.log(`Hashed ${value} to b16: ${hexHash} b36: ${rv}`);
    // }
    return rv;
  }

  #createStrongIdentityOrMergeMatchingCluster(clusterId, identityId, type) {
    const currentCluster = this.clusterMap.get(clusterId);
    if (currentCluster.identities.has(identityId)) {
      return;
    }

    const existingCluster = this.strongIdentityToClusterMap.get(identityId);
    if (existingCluster) {
      if (existingCluster === currentCluster) {
        return;
      }

      // eslint-disable-next-line no-console
      console.log(`Merging ${currentCluster.id} into ${existingCluster.id} because of identity ${identityId}`);
      existingCluster.mergeCluster(currentCluster);
      return;
    }

    const identity = new Identity(identityId, type, true, false);
    currentCluster.addIdentity(identity);
  }

  async identityImgSha(clusterId, canvas, ctx) {
    // Get image data (raw pixels) directly from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const hash = `sii:${await this.#createHash(imageData.data.buffer)}`;
    this.#createStrongIdentityOrMergeMatchingCluster(clusterId, hash, 'sha-img-identity');
    return hash;
  }

  /**
   * Sorts a set of color names into an array based on specific criteria.
   *
   * The sorting criteria are as follows:
   * 1. Colors named 'Transparency' are pushed to the top.
   * 2. Colors named 'Unknown' are pushed to the end.
   * 3. Colors with low saturation are pushed to the end sorted by lightness.
   * 4. Colors with high saturation are sorted by hue, and if hues are equal, by lightness.
   *
   * @param {Set<string>} colorSet - A set of color names to be sorted.
   * @returns {string[]} - An array of sorted color names.
   */
  // eslint-disable-next-line class-methods-use-this
  sortColorNamesIntoArray(colorSet) {
    if (Array.isArray(colorSet)) {
      return this.sortColorNamesIntoArray(new Set(colorSet));
    }
    const filteredColorNames = cssColors.filter((color) => colorSet.has(color.name));
    filteredColorNames.sort((a, b) => {
      if (a.name === 'Transparency') return -1;
      if (b.name === 'Transparency') return 1;
      if (a.name === 'Unknown') return 1;
      if (b.name === 'Unknown') return -1;

      // Check saturation first
      const aIsLowSaturation = a.hsl[1] < saturationThreshold;
      const bIsLowSaturation = b.hsl[1] < saturationThreshold;

      if (aIsLowSaturation && bIsLowSaturation) return a.hsl[2] - b.hsl[2];
      if (aIsLowSaturation) return 1;
      if (bIsLowSaturation) return -1;

      // Both are high saturation, sort by hue then by lightness
      const hueDiff = a.hsl[0] - b.hsl[0];
      if (hueDiff !== 0) return hueDiff; // Sort by hue
      return a.hsl[2] - b.hsl[2];
    });

    const sortedColorNames = filteredColorNames.map((color) => color.name);
    return sortedColorNames;
  }

  /**
   * Utility to blindly add colors to the used color list.
   * @param {string} color - The color to be added to the used colors list.
   */
  // eslint-disable-next-line class-methods-use-this
  #addUsedColor(color) {
    if (!this.usedColors.has(color)) {
      this.usedColors.add(color);
      this.colorAddedCallback(this.sortColorNamesIntoArray(this.usedColors));
    }
  }

  async detectAlphaChannel(clusterId, canvas, ctx) {
    const colorIdentity = this.#findOrBuildColorIdentity(clusterId);

    if (colorIdentity.identityData.alphaDetectionComplete) {
      return;
    }
    colorIdentity.identityData.alphaDetectionComplete = true;

    const ext = this.clusterMap.get(clusterId).elementForCluster.src.split('.').pop().toLowerCase();
    if (!ALPHA_ALLOWED_FORMATS.includes(ext)) {
      return;
    }

    // Get the pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;

    let alphaPixelsCount = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        if (i % 1000 === 0) { // yield every 1000 pixels
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => { setTimeout(resolve, 0); });
        }
        alphaPixelsCount += 1;
        // only detecting alpha if 1% of pixels have alpha. This trims small alpha borders.
        // TODO: Should we limit this to the first xx pixels?
        if (alphaPixelsCount >= Math.min(data.length, maxPixelsToEval) * 0.01) {
          this.#findOrBuildColorIdentity(clusterId).identityData.topColors.push('Transparency');
          this.#addUsedColor('Transparency');
          return;
        }
        if (i >= maxPixelsToEval) {
          return;
        }
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async #waitForVariable(variableGetter, maxAttempts = 60, intervalMs = 500) {
    let isFulfilled = false;

    const promise = new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const value = variableGetter();
        if (value) {
          clearInterval(interval);
          isFulfilled = true;
          resolve(value);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          isFulfilled = true;
          resolve(null);
        }
        attempts += 1;
      }, intervalMs);
    });

    // Attach the isFulfilled property
    promise.isFulfilled = async () => {
      Promise.allSettled([promise]);
      return isFulfilled;
    };
    return promise;
  }

  // Function to calculate the Euclidean distance between two colors
  // eslint-disable-next-line class-methods-use-this
  #colorDistance(color1, color2) {
    return Math.sqrt(
      (color1[0] - color2[0]) ** 2
      + (color1[1] - color2[1]) ** 2
      + (color1[2] - color2[2]) ** 2,
    );
  }

  // Function to find the nearest standard color
  #findNearestColor(color) {
    return cssColors.reduce((nearestColor, standardColor) => {
      const distance = this.#colorDistance(color, standardColor.rgb);
      return distance < this.#colorDistance(color, nearestColor.rgb) ? standardColor : nearestColor;
    }).name;
  }

  #findOrBuildColorIdentity(clusterId) {
    const cluster = this.clusterMap.get(clusterId);
    let colorIdentity = cluster.getSingletonOf('color-identity');
    if (!colorIdentity) {
      colorIdentity = new Identity(`ci:${clusterId}`, 'color-identity', false, true);
      colorIdentity.identityData.topColors = [];
      cluster.addIdentity(colorIdentity);
    }
    return colorIdentity;
  }

  identifyUnknownColorOnError(clusterId) {
    const colorIdentity = this.#findOrBuildColorIdentity(clusterId);
    if (colorIdentity.identityData.topColors.length === 0) {
      colorIdentity.identityData.topColors.push('Unknown');
      this.#addUsedColor('Unknown');
    }
  }

  // eslint-disable-next-line no-unused-vars
  async identifyColors(clusterId, values) {
    // colors are for the entire cluster.
    const cluster = this.clusterMap.get(clusterId);
    if (cluster.clusterData.colorsIdentified) {
      return;
    }
    cluster.clusterData.colorsIdentified = true;

    const colorIdentity = this.#findOrBuildColorIdentity(clusterId);

    const { elementForCluster } = cluster;
    try {
      if (elementForCluster === null) {
        this.identifyUnknownColorOnError(clusterId);
        return;
      }
      const colors = numberOfTopColors > 1
        ? colorThief.getPalette(elementForCluster, numberOfTopColors)
        : [colorThief.getColor(elementForCluster)];

      if (colors === null || colors.length === 0) {
        // can be all alpha, and colorthief wont detect.
        return;
      }

      // RGB Values. Disabled for now.
      // const rawColors = numberOfTopRawColors > 1
      //  ? colorThief.getPalette(elementForCluster, numberOfTopRawColors)
      //  : [colorThief.getColor(elementForCluster)];
      const roundedColors = [...new Set(colors.map((color) => this.#findNearestColor(color)))];

      roundedColors.forEach((color) => {
        colorIdentity.identityData.topColors.push(color);
        this.#addUsedColor(color);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error identifying colors:', error);
      this.identifyUnknownColorOnError(clusterId);
    }
  }

  async #identifyUrlInternal(href, clusterId, type, additionalTokensToSum = []) {
    const url = new URL(href);
    const cluster = this.clusterMap.get(clusterId);
    const { elementForCluster } = cluster;

    const identificationParts = additionalTokensToSum.slice();

    // is loadedImg definitely a helix image? If so it can't be changed and we dont need the etag.

    if (this.edsHosts.find((h) => url.hostname.toLowerCase().endsWith(h))) {
      // no need to include the host. The path contains an immutable reference.
      // eslint-disable-next-line prefer-destructuring
      identificationParts.push(':eds:');
      identificationParts.push(href.split('://')[1].toLowerCase());
    } else {
      try {
        // TODO: Lets cache these fields so we limit the amount of time they could change during.

        // Fetch the image to get the ETag from headers (if available)
        const response = await fetch(url, { method: 'HEAD' }); // HEAD request to only fetch headers
        const etag = response.headers.get('ETag'); // Get the ETag if available
        const lastModified = response.headers.get('Last-Modified'); // Get the Last-Modified if available
        const contentLength = response.headers.get('Content-Length'); // Get the Content-Length if available
        const digest = response.headers.get('Digest'); // Get the Content-Length if available

        // there's a chance this changes during our processing,
        // but since we can't get the etag of the image we just loaded,
        // hope the cache gets it and roll with the risk.
        if (etag) {
          // high fidelity identifier
          identificationParts.push('et');
          identificationParts.push(etag);
        } else if (digest) {
          identificationParts.push('dg');
          identificationParts.push(digest);
        } else {
          // try to join what we do know. Lower fidelity identifier
          identificationParts.push(href); // Start with the URL or other primary identifier
          identificationParts.push('wt');

          // Check each field and add it to the array if it exists
          if (lastModified) {
            identificationParts.push(lastModified);
          }
          if (contentLength) {
            identificationParts.push(contentLength);
          }
          if (!lastModified && !contentLength) {
            // use what we've got
            if (elementForCluster.width) {
              identificationParts.push(elementForCluster.width);
            }
            if (elementForCluster.height) {
              identificationParts.push(elementForCluster.height);
            }
          }
        }
      } catch (error) {
        identificationParts.length = 0;
        identificationParts.push(...additionalTokensToSum);
        identificationParts.push('er');
        identificationParts.push(href); // Start with the URL or other primary identifier
        // use what we've got
        if (elementForCluster.width) {
          identificationParts.push(elementForCluster.width);
        }
        if (elementForCluster.height) {
          identificationParts.push(elementForCluster.height);
        }
      }
    }
    const hash = `${type.split('-').map((chunk) => chunk.charAt(0)).join('')}:${await this.#createHash(identificationParts.join('::'))}`;
    this.#createStrongIdentityOrMergeMatchingCluster(clusterId, hash, type);
    return hash;
  }

  async identifyImgUrl(clusterId, values) {
    const identityId = await this.#identifyUrlInternal(values.href, clusterId, 'url-img-identity');
    const identity = this.clusterMap.get(clusterId).identities.get(identityId);
    identity.identityData.src = values.href;
  }

  async identityImgUrlAndSiteUrl(clusterId, values) {
    const url = new URL(values.site);
    const additionalTokensToSum = [values.site];
    additionalTokensToSum.push(values.instance);

    try {
      // TODO: Lets cache these fields so we limit the amount of time they could change during.

      // Fetch the image to get the ETag from headers (if available)
      const response = await fetch(url, { method: 'HEAD' }); // HEAD request to only fetch headers
      const etag = response.headers.get('ETag'); // Get the ETag if available
      const lastModified = response.headers.get('Last-Modified'); // Get the Last-Modified if available
      const contentLength = response.headers.get('Content-Length'); // Get the Content-Length if available
      const digest = response.headers.get('Digest'); // Get the Content-Length if available

      // there's a chance this changes during our processing,
      // but since we can't get the etag of the image we just loaded,
      // hope the cache gets it and roll with the risk.
      if (etag) {
        additionalTokensToSum.push('et');
        additionalTokensToSum.push(etag);
      } else if (digest) {
        additionalTokensToSum.push('dg');
        additionalTokensToSum.push(digest);
      } else {
        // Check each field and add it to the array if it exists
        if (lastModified) {
          additionalTokensToSum.push('lm');
          additionalTokensToSum.push(lastModified);
        }
        if (contentLength) {
          additionalTokensToSum.push('cl');
          additionalTokensToSum.push(contentLength);
        }
      }
    } catch (error) {
      additionalTokensToSum.clear();
      additionalTokensToSum.push('er');
      additionalTokensToSum.push(values.site); // Start with the URL or other primary identifier
    }

    const identityId = await this.#identifyUrlInternal(values.href, clusterId, 'url-page-img-identity', additionalTokensToSum);
    const identity = this.clusterMap.get(clusterId).identities.get(identityId);
    identity.identityData.site = values.site;
    identity.identityData.src = values.href;
    identity.identityData.alt = values.alt;
    identity.identityData.width = values.width;
    identity.identityData.height = values.height;
    identity.identityData.aspectRatio = values.aspectRatio;
    identity.identityData.instance = values.instance;
  }

  // eslint-disable-next-line no-unused-vars
  async identifyText(clusterId, values) {
    if (this.clusterMap.get(clusterId).clusterData.textIdentified) {
      return;
    }
    this.clusterMap.get(clusterId).clusterData.textIdentified = true;

    // eslint-disable-next-line no-undef
    await Tesseract.recognize(
      this.clusterMap.get(clusterId).elementForCluster,
      'eng',
    ).then(async ({ data: { words } }) => {
      // Filter words based on confidence level
      const confidentWords = words.filter((word) => word.confidence > wordConfidenceThreshold);

      if (confidentWords.length === 0) {
        return;
      }
      const text = confidentWords
        .map((word) => word.text.replace(/[^a-zA-Z0-9 ]/g, ''))
        .join(' ').replace(/\s+/g, ' ').trim();
      if (text.length === 0) {
        return;
      }
      const identityText = text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ');

      const identityId = `txt:${await this.#createHash(identityText)}`;
      const identity = new Identity(identityId, 'text-identity', false, true);

      console.log(`Identified text: ${text} from cluster ${clusterId}`);

      // Storing both the original recognized text and the filtered text
      identity.identityData.text = text;
      identity.identityData.identityText = identityText;

      this.clusterMap.get(clusterId).addIdentity(identity);
    });
  }

  async identifyByPerceptualImage(clusterId, canvas, ctx) {
    // getting the element and holding it here in case re-clustering switches it --
    // it is atomic with the hash.
    const { elementForCluster } = this.clusterMap.get(clusterId);
    const src = elementForCluster.src.toLowerCase();

    let hash = null;
    let identityId = null;
    if (this.perceptualHashMap.has(src)) {
      hash = this.perceptualHashMap.get(src).hash;
      identityId = this.perceptualHashMap.get(src).identityId;
    } else {
      // eslint-disable-next-line no-undef
      hash = await phash(elementForCluster, 8);
      identityId = `ph:${hash.toBase64()}`;
      this.perceptualHashMap.set(src, { hash, identityId, clusterId });
    }

    const identity = new Identity(identityId, 'phash-identity', false, false);
    identity.identityData.phash = hash;
    this.clusterMap.get(clusterId).addIdentity(identity);

    const matchingClusterIds = this.getClustersWithHammingDistance(clusterId, src, hash);
    await this.filterClustersWithMatchingColors(clusterId, matchingClusterIds);
    await this.filterClustersWithIdentityText(clusterId, matchingClusterIds);

    if (matchingClusterIds.size > 0) {
      const promises = Array.from(matchingClusterIds).map(async (otherClusterId) => {
        // Create a new canvas and context for the other cluster's image
        const otherCanvas = document.createElement('canvas');
        const otherCtx = otherCanvas.getContext('2d', { willReadFrequently: true });
        otherCanvas.width = canvas.width; // Ensure it's the same width
        otherCanvas.height = canvas.height; // Ensure it's the same height

        // Draw the other cluster's image onto the new canvas
        otherCtx.drawImage(
          this.clusterMap.get(otherClusterId).elementForCluster,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        // Get the pixel data for both images
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const otherImgData = otherCtx.getImageData(
          0,
          0,
          otherCanvas.width,
          otherCanvas.height,
        ).data;

        // Create an output array for pixelmatch results
        const output = new Uint8Array(canvas.width * canvas.height * 4); // RGBA

        const numberDiffPixels = pixelmatch(
          imgData,
          otherImgData,
          output,
          canvas.width,
          canvas.height,
          {
            threshold: imageMatchingThreshold, // Similarity threshold
            includeAA: true,
          },
        );

        // If the images match within the specified threshold, merge clusters
        if (numberDiffPixels <= (imgData.length * exactMatchDifferentPixelPercent)) {
          if (this.clusterMap.get(clusterId) !== this.clusterMap.get(otherClusterId)) {
            // eslint-disable-next-line no-console
            console.log(`Merging cluster ${clusterId} with url ${src} into cluster ${otherClusterId} with url ${this.clusterMap.get(otherClusterId)?.elementForCluster?.src} because of perceptual similarity with ${numberDiffPixels} different pixels at ${(numberDiffPixels / Math.max(imgData.length, otherImgData.length)) * 100}%`);
            this.clusterMap.get(otherClusterId).mergeCluster(this.clusterMap.get(clusterId));
          }
        } else if (numberDiffPixels <= (imgData.length * similarityDifferentPixelPercent)
            && this.clusterMap.get(clusterId).id !== this.clusterMap.get(otherClusterId).id) {
          const hereToThere = new Identity(`sim:${otherClusterId}`, 'similar-img-identity', false);
          hereToThere.identityData.similarClusterId = otherClusterId;
          this.clusterMap.get(clusterId).addIdentity(hereToThere);

          const thereToHere = new Identity(`sim:${clusterId}`, 'similar-img-identity', false);
          thereToHere.identityData.similarClusterId = clusterId;
          this.clusterMap.get(otherClusterId).addIdentity(thereToHere);
          // eslint-disable-next-line no-console
          console.log(`Marking cluster ${clusterId} with url ${src} as similar to cluster ${otherClusterId} with url ${this.clusterMap.get(otherClusterId)?.elementForCluster?.src} because of perceptual similarity with ${numberDiffPixels} different pixels at ${(numberDiffPixels / Math.max(imgData.length, otherImgData.length)) * 100}%`);
        }
      });

      // Wait for all comparisons to finish
      await Promise.allSettled(promises);
    }
  }

  // use Hammning to reduce the number of images to compare from every image to < 20 or so.
  // this is a very fast operation, but there should be a type of map that can help.
  getClustersWithHammingDistance(clusterId, src, hash) {
    const matchingClusterIds = new Set();
    // TODO: Isn't there a better map type for this?
    this.perceptualHashMap.forEach((data, otherSrc) => {
      const otherClusterId = data.clusterId;
      const otherHash = data.hash;
      if (otherClusterId !== clusterId && src !== otherSrc) {
        const distance = hash.hammingDistance(otherHash);
        if (distance <= hammingDistanceThreshold) {
          matchingClusterIds.add(otherClusterId);
        }
      }
      // else : no need to merge already duplicate things which will be merged anyway.
    });
    return matchingClusterIds;
  }

  // another quick check to remove images with different top color palettes
  // Function to filter clusters based on color palette matching
  async filterClustersWithMatchingColors(clusterId, matchingClusterIds) {
    if (!await this.#waitForVariable(
      () => this.clusterMap.get(clusterId).clusterData.colorsIdentified,
    ).isFulfilled()) return;
    const cluster = this.clusterMap.get(clusterId);
    const colors = new Set(cluster.getSingletonOf('color-identity').identityData.topColors);

    matchingClusterIds.forEach((otherClusterId) => {
      const otherCluster = this.clusterMap.get(otherClusterId);
      const otherColors = new Set(otherCluster.getSingletonOf('color-identity').identityData.topColors);

      // Symmetric difference between two sets of colors
      const diffColors = new Set([
        ...[...colors].filter((color) => !otherColors.has(color)),
        ...[...otherColors].filter((color) => !colors.has(color)),
      ]);

      // If the difference exceeds the threshold, remove the cluster
      if (diffColors.size > exactColorMatchThreshold) {
        matchingClusterIds.delete(otherClusterId);
      }
    });
  }

  async filterClustersWithIdentityText(clusterId, matchingClusterIds) {
    if (!await this.#waitForVariable(
      () => this.clusterMap.get(clusterId).clusterData.textIdentified,
    ).isFulfilled()) return;
    const cluster = this.clusterMap.get(clusterId);
    const textIdentity = cluster.getSingletonOf('text-identity');
    const identificationText = new Set(textIdentity
      ? textIdentity.identityData.identityText.split(' ') : []);
    if (identificationText.has('')) {
      identificationText.delete('');
    }

    matchingClusterIds.forEach((otherClusterId) => {
      const otherTextIdentity = this.clusterMap.get(otherClusterId).getSingletonOf('text-identity');
      if (otherTextIdentity) {
        const otherIdentificationText = new Set(otherTextIdentity
          ? otherTextIdentity.identityData.identityText.split(' ') : []);
        if (otherIdentificationText.has('')) {
          otherIdentificationText.delete('');
        }

        // Symmetric difference between two sets of colors
        const diffText = new Set([
          ...[...identificationText].filter((word) => !otherIdentificationText.has(word)),
          ...[...otherIdentificationText].filter((word) => !identificationText.has(word)),
        ]);

        // If the difference exceeds the threshold, remove the cluster
        const threshold = Math.min(
          Math.round(exactTextMatchThresholdPercent * identificationText.size),
          1,
        );
        if (diffText.size > threshold) {
          matchingClusterIds.delete(otherClusterId);
        }
      }
    });
  }

  getAllClusters() {
    const distinctClusters = new Set(this.clusterMap.values());
    return Array.from(distinctClusters);
  }
}
