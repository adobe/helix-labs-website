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

  #id;

  constructor(id) {
    if (!id) throw new Error('Identity id must be defined');
    this.#id = id;
    Object.defineProperty(AbstractIdentity.prototype, 'type', {
      configurable: false,
      enumerable: true,
    });
    Object.defineProperty(AbstractIdentity.prototype, 'id', {
      configurable: false,
      enumerable: true,
    });
    Object.defineProperty(AbstractIdentity.prototype, 'uiSelectorProperties', {
      configurable: false,
      enumerable: true,
    });
  }

  static get type() {
    throw new Error('AbstractIdentity.type is an abstract property');
  }

  // final as per constructor. Convienence method for static call.
  get type() {
    return this.constructor.type;
  }

  // Strong identities must have unique ids across all clusters
  // Soft identites must have unique ids within a cluster
  get strong() {
    return false;
  }

  get singleton() {
    return false;
  }

  get similarityInstigator() {
    return false;
  }

  get similarityCollaborator() {
    // note: these must be singletons or they wont be used.
    return false;
  }

  get uiSelectorProperties() {
    return this.constructor.uiSelectorProperties;
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

  // final as per constructor
  get id() {
    return this.#id;
  }

  // called for singletons, or soft identities with matching ids during cluster merge.
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
}

export default AbstractIdentity;
