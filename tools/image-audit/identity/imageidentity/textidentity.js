/* eslint-disable class-methods-use-this */
import Tesseract from 'tesseract.js';

import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import SizeIdentity from './sizeidentity.js';
import PromisePool from '../../promisepool.js';
import TextUtility from '../util/textutility.js';

const concurrentOCR = 5;

const wordConfidenceThreshold = 85;
const exactTextMatchThresholdPercent = 0.2;

class TextIdentity extends AbstractIdentity {
  #text;

  #identityText;

  constructor(text, identityText) {
    super('txt');
    this.#text = text;
    this.#identityText = identityText;
  }

  get singleton() {
    return true;
  }

  get hasWords() {
    let wordCount = 0;
    this.#identityText.split(' ').forEach((word) => {
      if (word.length >= 3) wordCount += 1;
    });
    return wordCount >= 2;
  }

  static async identifyPostflight(identityValues, identityState) {
    const { originatingClusterId, clusterManager, href } = identityValues;

    const sizeIdentifier = clusterManager.get(originatingClusterId)
      .get(await SizeIdentity.getSizeId(href));
    if (sizeIdentifier?.tooBigForWeb) {
      // don't bother with large images.
      return;
    }

    if (!identityState.promisePool) {
      // this ensures a limited number of text identifications happening simultaneously.
      // shared between instances.
      identityState.promisePool = new PromisePool(concurrentOCR, 'OCR Pool', false);
    }

    const { promisePool } = identityState;

    const { identityText, text } = await promisePool.run(async () => identityValues
      .get(TextIdentity, 'text', async () => TextIdentity
        .#identifyText(
          originatingClusterId,
          identityValues,
          identityState,
          clusterManager,
        )));

    if (!text || !identityText) return;

    const identity = new TextIdentity(text, identityText);

    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static async #identifyText(originatingClusterId, identityValues, identityState, clusterManager) {
    let text = '';
    let identityText = '';
    try {
      // eslint-disable-next-line no-undef
      await Tesseract.recognize(
        clusterManager.get(originatingClusterId).elementForCluster,
        'eng',
      ).then(async ({ data: { words } }) => {
        // Filter words based on confidence level
        const confidentWords = words.filter((word) => word.confidence > wordConfidenceThreshold);

        if (confidentWords.length === 0) {
          return true;
        }
        text = confidentWords
          .map((word) => word.text.replace(/[^a-zA-Z0-9 ]/g, ''))
          .join(' ').replace(/\s+/g, ' ').trim();

        identityText = text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
        return true;
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error processing OCR for cluster ${originatingClusterId}`, error);
    }
    return {
      text,
      identityText,
    };
  }

  static get type() {
    return 'text-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: TextIdentity.type,
      display: 'OCR Text',
      checked: true,
      hidden: false,
    };
  }

  get identityText() {
    return this.#identityText;
  }

  get text() {
    return this.#text;
  }

  decorateFigure(figureForCluster) {
    return figureForCluster;
  }

  mergeOther(otherIdentity) {
    if (otherIdentity.#text.length > this.#text.length) {
      // note: We'll presume if we're merging,
      // the higher word count is more accurate
      this.#text = otherIdentity.#text;
      this.#identityText = otherIdentity.#identityText;
    }
  }

  async getMergeWeight(otherIdenty) {
    const {
      exactMatch,
      wordDifferencePercentage,
      bothSidesHadWords,
    } = TextUtility.compareWords(() => this.text, () => otherIdenty.text);

    if (!bothSidesHadWords) return 0;
    if (exactMatch) return 30;
    if (wordDifferencePercentage <= exactTextMatchThresholdPercent / 2) return 20;
    if (wordDifferencePercentage <= exactTextMatchThresholdPercent) return 10;
    if (wordDifferencePercentage <= exactTextMatchThresholdPercent * 2) return 5;
    return 0;
  }
}

export default TextIdentity;

IdentityRegistry.register(TextIdentity);
