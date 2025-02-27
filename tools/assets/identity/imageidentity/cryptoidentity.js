/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import Hash from '../util/hash.js';
import PromisePool from '../../util/promisepool.js';

const concurrentSHA = 5;

class CryptoIdentity extends AbstractIdentity {
  static get type() {
    return 'crypto-img-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: CryptoIdentity.type,
      display: 'Cryptographic',
      checked: true,
      hidden: false,
    };
  }

  get strong() {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  static async identifyPostflightWithCanvas(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
      canvas,
      ctx,
    } = identityValues;

    if (!identityState.promisePool) {
      // this ensures a limited number of text identifications happening simultaneously.
      // shared between instances.
      identityState.promisePool = new PromisePool(concurrentSHA, 'OCR Pool', false);
    }

    const { promisePool } = identityState;

    const hash = await promisePool.run(async () => identityValues.get(CryptoIdentity, 'hash', async () => CryptoIdentity.#getHash(canvas, ctx)));
    const identity = new CryptoIdentity(hash);
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static async #getHash(canvas, ctx) {
    // Get image data (raw pixels) directly from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return `cryi:${await Hash.createHash(imageData.data.buffer)}`;
  }
}

IdentityRegistry.register(CryptoIdentity);
