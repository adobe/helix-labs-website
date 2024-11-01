/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import SizeIdentity from './sizeidentity.js';
import PromisePool from '../../promisepool.js';

// eslint-disable-next-line import/no-unresolved, import/order
import pixelmatch from 'https://cdnjs.cloudflare.com/ajax/libs/pixelmatch/6.0.0/index.min.js';

const hammingDistanceThreshold = 20;

// Matching threshold for two images, ranges from 0 to 1.
// Smaller values make the comparison more sensitive.
const imageMatchingThreshold = 0.1;

// Percentage of pixels can be different between two images ot be identified the same
// 0.001 -> .1% different pixels
const exactMatchDifferentPixelPercent = 0.004;

const phashConcurrency = 20;

class PerceptualIdentity extends AbstractIdentity {
  #phash;

  #identityState;

  #canvas;

  #ctx;

  #clusterManager;

  #width;

  #height;

  #elementForCluster;

  constructor(phash, canvas, ctx, elementForCluster, clusterManager, identityState) {
    super();
    this.#phash = phash;
    this.#identityState = identityState;
    this.#canvas = canvas;
    this.#ctx = ctx;
    this.#clusterManager = clusterManager;
    this.#width = elementForCluster.width;
    this.#height = elementForCluster.height;
    this.#elementForCluster = elementForCluster;
  }

  static async identifyPostflightWithCanvas(identityValues, identityState) {
    const {
      originatingClusterId,
      canvas,
      ctx,
      clusterManager,
    } = identityValues;

    const { href } = identityValues.entryValues;

    if (clusterManager.get(originatingClusterId).getSingletonOf(PerceptualIdentity.type)) {
      return; // it already has one, maybe due to a merge.
    }

    const sizeIdentifier = clusterManager.get(originatingClusterId)
      .get(await SizeIdentity.getSizeId(href));
    if (sizeIdentifier?.tooBigForWeb) {
      // don't bother with large images.
      return;
    }

    // getting the element and holding it here in case re-clustering switches it --
    // it is atomic with the hash.
    const { elementForCluster } = clusterManager.get(originatingClusterId);

    if (!identityState.promisePool) {
      // this ensures a limited number of text identifications happening simultaneously.
      // shared between instances.
      identityState.promisePool = new PromisePool(phashConcurrency, 'Perceptual Hash');
    }
    // eslint-disable-next-line no-undef
    const hash = await identityState.promisePool.run(() => phash(elementForCluster, 8));

    const identity = new PerceptualIdentity(
      hash,
      canvas,
      ctx,
      elementForCluster,
      clusterManager,
      identityState,
    );

    // just in case it was reclustered while we were waiting for the hash.
    if (clusterManager.get(originatingClusterId).getSingletonOf(PerceptualIdentity.type)) {
      return; // it already has one, maybe due to a merge.
    }
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static get similarityInstigator() {
    return true;
  }

  filterSimilarClusters(clustersWithInstigtorType) {
    const similarClusters = [];
    clustersWithInstigtorType.forEach((otherCluster) => {
      const otherIdentity = otherCluster.getSingletonOf(this.type);
      if (otherIdentity) {
        const distance = this.#phash.hammingDistance(otherIdentity.#phash);

        if (distance <= hammingDistanceThreshold) {
          similarClusters.push(otherCluster);
        }
      }
    });
    return similarClusters;
  }

  getMergeWeight(otherIdentity) {
    const distance = this.#phash.hammingDistance(otherIdentity.#phash);
    if (distance > hammingDistanceThreshold) {
      return 0;
    }
    let otherCanvas = otherIdentity.#canvas;
    let otherCtx = otherIdentity.#ctx;
    const otherWidth = otherIdentity.#width;
    const otherHeight = otherIdentity.#height;

    // compare using lowest fidelity.
    const width = Math.min(otherWidth, this.#canvas.width);
    const height = Math.min(otherHeight, this.#canvas.height);

    let thisCanvas = this.#canvas;
    let thisCtx = this.#ctx;
    if (this.#width !== width || this.#height !== height) {
      thisCanvas = document.createElement('canvas');
      thisCanvas.width = width;
      thisCanvas.height = height;
      thisCtx = thisCanvas.getContext('2d', { willReadFrequently: true });
      thisCtx.drawImage(
        this.#elementForCluster,
        0,
        0,
        width,
        height,
      );
    }

    if (otherIdentity.#width !== width || otherIdentity.#height !== height) {
      otherCanvas = document.createElement('canvas');
      otherCanvas.width = width;
      otherCanvas.height = height;
      otherCtx = otherCanvas.getContext('2d', { willReadFrequently: true });
      otherCtx.drawImage(
        otherIdentity.#elementForCluster,
        0,
        0,
        width,
        height,
      );
    }

    // Get the pixel data for both images
    const imgData = thisCtx.getImageData(0, 0, width, height).data;
    const otherImgData = otherCtx.getImageData(
      0,
      0,
      width,
      height,
    ).data;

    // Create an output array for pixelmatch results
    const output = new Uint8Array(width * height * 4); // RGBA

    const numberDiffPixels = pixelmatch(
      imgData,
      otherImgData,
      output,
      width,
      height,
      {
        threshold: imageMatchingThreshold, // Similarity threshold
        includeAA: true,
      },
    );

    if (numberDiffPixels === 0) return 100;
    if (numberDiffPixels
      <= Math.min(imgData.length, otherImgData.length) * (exactMatchDifferentPixelPercent / 2)) {
      return 100;
    }
    if (numberDiffPixels
      <= Math.min(imgData.length, otherImgData.length) * exactMatchDifferentPixelPercent) {
      return 100;
    }
    if (numberDiffPixels
      <= Math.min(imgData.length, otherImgData.length) * (exactMatchDifferentPixelPercent * 2)) {
      return 70;
    }
    if (numberDiffPixels
      <= Math.min(imgData.length, otherImgData.length) * (exactMatchDifferentPixelPercent * 3)) {
      return 60;
    }
    if (numberDiffPixels
      <= Math.min(imgData.length, otherImgData.length) * (exactMatchDifferentPixelPercent * 4)) {
      return 50;
    }
    return 0;
  }

  static async identifyPostError(identityValues) {
    return identityValues;
  }

  static get type() {
    return 'perceptual-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: PerceptualIdentity.type,
      display: 'Perceptual',
      checked: true,
      hidden: false,
    };
  }

  get id() {
    return 'ph';
  }

  get strong() {
    return false;
  }

  get signleton() {
    return true;
  }

  static get similarityCollaborator() {
    return true;
  }

  decorateFigure(figureForCluster) {
    return figureForCluster;
  }

  mergeOther(otherIdentity) {
    if (otherIdentity.#phash === this.#phash) {
      return;
    }

    // decide which phash is better

    const myPixelCount = this.#width * this.#height;

    const otherPixelCount = otherIdentity.#width * otherIdentity.#height;

    if (myPixelCount > otherPixelCount) {
      return;
    }

    if (myPixelCount < otherPixelCount) {
      this.#phash = otherIdentity.#phash;
      this.#width = otherIdentity.#width;
      this.#height = otherIdentity.#height;
      this.#elementForCluster = otherIdentity.#elementForCluster;
    }
  }
}

IdentityRegistry.register(PerceptualIdentity);
