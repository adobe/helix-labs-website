/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

class AbstractIdentity {
  /*
  For an autowired identity, one or more of these methods must be implemented.

  static async identifyPreflight(identityValues, identityState) {
    throw new Error('AbstractIdentity.identify is an abstract method');
  }

  static async identifyPostflight(identityValues, identityState) {
    throw new Error('AbstractIdentity.identify is an abstract method');
  }

  static async identifyPostflightWithCanvas(identityValues, identityState) {
    throw new Error('AbstractIdentity.identify is an abstract method');
  }

  static async identifyPostError(identityValues, identityState) {
    throw new Error('AbstractIdentity.identify is an abstract method');
  }
  */

  static #hashInitialized = false;

  static get type() {
    throw new Error('AbstractIdentity.getType is an abstract method');
  }

  get type() {
    return this.constructor.type;
  }

  static get similarityInstigator() {
    return false;
  }

  get similarityInstigator() {
    return this.constructor.similarityInstigator;
  }

  static get similarityCollaborator() {
    return false;
  }

  get similarityCollaborator() {
    return this.constructor.similarityInstigator;
  }

  static get uiSelectorProperties() {
    /*
    This structure is currently:
        return {
          identity: ColorIdentity.type,
          display: 'Color',
          checked: true,
          hidden: true,
        };
    */
    throw new Error('AbstractIdentity.uiProperties is an abstract method');
  }

  get id() {
    throw new Error('AbstractIdentity.getId is an abstract method');
  }

  // Strong identities must have unique ids across all clusters
  // Soft identites must have unique ids within a cluster
  get strong() {
    throw new Error('AbstractIdentity.getStrong is an abstract method');
  }

  get signleton() {
    throw new Error('AbstractIdentity.getSignleton is an abstract method');
  }

  // called only for singletons during cluster merge.
  mergeOther(otherIdentity) {
    throw new Error('AbstractIdentity.mergeWith is an abstract method');
  }

  // called only for similarity instigators returns an array of similar clusters
  filterSimilarClusters(clustersWithInstigtorType) {
    throw new Error('AbstractIdentity.filterSimilarClusters is an abstract method');
  }

  // called only for soft identities to decide if a cluster should be merged.
  // any weight of 100 or more means it should be merged
  // called with an array of matching identity classes from other class.
  // If singleton, only one item in the array.
  getMergeWeight(otherIdentities) {
    throw new Error('AbstractIdentity.mergeWeight is an abstract method');
  }

  /*
  this would allow one identity to wait for another,
  but it's currently not used. Will add if needed.
  static async waitForIdentitySingleton(
    clusterId,
    clusterManager,
    identityType,
    maxAttempts = 60,
    intervalMs = 500,
  ) {
    let isFulfilled = false;

    const promise = new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const value = () => clusterManager
          .get(clusterId)
          .getSingletonIdentity(identityType);

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
    await promise;
    return isFulfilled;
  }
  */

  compareWords(fText, fOtherText) {
    const returnValue = {
      exactMatch: false,
      wordDifferencePercentage: 1,
      bothSidesHadWords: false,
    };

    const otherText = fOtherText();
    const text = fText();
    if (!text || !otherText) {
      returnValue.bothSidesHadWords = false;
      return returnValue;
    }

    const identificationText = new Set(text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(' '));
    if (identificationText.has('')) {
      identificationText.delete('');
    }

    if (!identificationText) {
      returnValue.bothSidesHadWords = false;
      return returnValue;
    }

    const otherIdentificationText = new Set(otherText.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(' '));
    if (otherIdentificationText.has('')) {
      otherIdentificationText.delete('');
    }

    if (!otherIdentificationText) {
      returnValue.bothSidesHadWords = false;
      return returnValue;
    }

    returnValue.bothSidesHadWords = true;

    if (text === otherText) {
      returnValue.exactMatch = true;
      returnValue.wordDifferencePercentage = 0;
      return returnValue;
    }

    returnValue.exactMatch = false;
    // Symmetric difference between two sets of colors
    const diffText = new Set([
      ...[...identificationText].filter((word) => !otherIdentificationText.has(word)),
      ...[...otherIdentificationText].filter((word) => !identificationText.has(word)),
    ]);

    const moreWords = Math.max(identificationText.length, otherIdentificationText.length);
    returnValue.wordDifferencePercentage = diffText.length / moreWords;
    return returnValue;
  }
}

export default AbstractIdentity;
