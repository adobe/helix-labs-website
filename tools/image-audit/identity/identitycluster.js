import SimilarClusterIdentity from './similarclusteridentity.js';

class IdentityCluster {
  #clusterManager;

  #id;

  #identities;

  #typeToIdentitiesMap;

  #figureForCluster;

  #type;

  #elementForCluster;

  #replacedBy;

  #similarityCollaboratorIdentityTypes;

  #clusterIdsThisClusterReplaces;

  #detailHref;

  constructor(
    clusterCount,
    clusterManager,
    originatingIdentity,
    elementForCluster,
    figureForCluster,
    type,
    detailHref,
  ) {
    this.#clusterManager = clusterManager;
    this.#id = `clst:${clusterCount}`;
    this.#identities = new Map();
    this.#figureForCluster = figureForCluster;
    this.#type = type;
    this.#elementForCluster = elementForCluster;
    elementForCluster.dataset.src = this.id;
    this.#replacedBy = null;
    this.#similarityCollaboratorIdentityTypes = new Set();
    this.#typeToIdentitiesMap = new Map();
    this.addIdentity(originatingIdentity);
    this.#clusterIdsThisClusterReplaces = [];
    this.#detailHref = detailHref;
  }

  get id() {
    return this.#id;
  }

  get elementForCluster() {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    return this.#elementForCluster;
  }

  get figureForCluster() {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    return this.#figureForCluster;
  }

  get clusterIdsThisClusterReplaces() {
    return Array.from(this.#clusterIdsThisClusterReplaces);
  }

  get similarityCollaboratorIdentityTypes() {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    return Array.from(this.#similarityCollaboratorIdentityTypes);
  }

  get detailHref() {
    return this.#detailHref;
  }

  #getSetForType(type) {
    if (!this.#typeToIdentitiesMap.has(type)) {
      this.#typeToIdentitiesMap.set(type, new Set());
    }
    return this.#typeToIdentitiesMap.get(type);
  }

  addIdentity(identity) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    this.#insertIdentity(identity);
    this.#clusterManager.identityAdded(identity, this);
  }

  #insertIdentity(identity) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    if (identity.similarityCollaborator && identity.singleton) {
      this.#similarityCollaboratorIdentityTypes.add(identity.type);
    }

    if (identity.singleton) {
      if (this.#getSetForType(identity.type).size > 0) {
        throw new Error(`Cluster ${this.id} already has a singleton identity of type ${identity.type}`);
      } else {
        this.#getSetForType(identity.type).add(identity);
      }
    }

    this.#identities.set(identity.id, identity);
    this.#getSetForType(identity.type).add(identity);
  }

  removeSimilarIdentity(identityId) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    const localIdentity = this.#identities.get(identityId);
    if (!localIdentity) return;
    if (localIdentity.type !== SimilarClusterIdentity.type) {
      throw new Error(`Identity ${identityId} is not a similar identity`);
    }

    this.#identities.delete(identityId);
    this.#getSetForType(localIdentity.type).delete(localIdentity);
    this.#clusterManager.identityRemoved(localIdentity, this);
  }

  moveIdentity(identity, owningCluster) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }
    if (identity.type === SimilarClusterIdentity.type) {
      if (identity.similarClusterId === this.id) {
        // previously, these clusters were similar, now they are the same.
        identity.releaseSimilarity();
        // since it's now reclustered, nothing to add.
      } else {
        const farSideIdentity = identity.matchingIdentity;
        const farSideCluster = this.#clusterManager.get(farSideIdentity.owningClusterId);
        // release old similarity
        identity.releaseSimilarity();
        // reattach the similarity to here.
        this.markSimilarCluster(farSideCluster);
      }
      return;
    }

    // regular merge
    owningCluster.#identities.delete(identity.id);
    owningCluster.#getSetForType(identity.type).delete(identity);

    if (identity.singleton) {
      const localIdentity = this.getSingletonOf(identity.type);
      if (!localIdentity) {
        this.#insertIdentity(identity);
      } else {
        // merge otherIdentity into localIdentity
        localIdentity.mergeOther(identity);
      }
    } else if (identity.strong) {
      const existingIdentity = this.#identities.get(identity.id);
      if (!existingIdentity) {
        this.#insertIdentity(identity);
        return;
      }
      // otherwise we have the identity. We dont need to move it.
      // could consider merging it, but I dont know why it would have any
      // different fields from the one in this identity.
    } else if (this.#identities.has(identity.id)) {
      // this is a soft identity that is already in this cluster.
      // different fields from the one in this identity.
      // eslint-disable-next-line no-console
      const localIdentity = this.#identities.get(identity.id);
      localIdentity.mergeOther(identity);
    } else {
      this.#insertIdentity(identity);
    }
    this.#clusterManager.identityMoved(identity, this.id);
  }

  getAllIdentitiesOf(type) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }
    return Array.from(this.#getSetForType(type));
  }

  getSingletonOf(type) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }
    return this.#getSetForType(type).values().next().value;
  }

  getFirstIdentityOf(type) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }
    return this.#getSetForType(type).values().next().value;
  }

  // Method to recluster (merge) if types match, always makes this cluster THE cluster.
  mergeCluster(otherCluster) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    if (otherCluster.#replacedBy) {
      this.mergeCluster(otherCluster.#replacedBy);
      return;
    }
    if (this === otherCluster) {
      // eslint-disable-next-line no-console
      console.info(`Cowardly refusing to merge the same cluster with itself ${this.id}`);
      return;
    }

    if (this.#id === otherCluster.#id) {
      throw new Error('clusters with duplicate IDs?');
    }

    if (this.#type !== otherCluster.#type) {
      throw new Error(`Cannot merge clusters of different types: ${this.#type} and ${otherCluster.type}`);
    }

    // break the iterator or it will loop forever.
    const otherIdentities = Array.from(otherCluster.#identities.values());

    // Merge identities from the other cluster into this one
    otherIdentities.forEach((otherIdentity) => {
      this.moveIdentity(otherIdentity, otherCluster);
    });

    // assume all it's ids.
    this.#clusterIdsThisClusterReplaces.push(otherCluster.#id);
    otherCluster.#clusterIdsThisClusterReplaces.forEach((id) => {
      this.#clusterIdsThisClusterReplaces.push(id);
    });
    otherCluster.#reclusterComplete(this);
  }

  markSimilarCluster(otherCluster) {
    const thereToHere = new SimilarClusterIdentity(
      this.#clusterManager,
      otherCluster.#id,
      this.#id,
    );
    const hereToThere = new SimilarClusterIdentity(this.#clusterManager, this.#id, otherCluster.id);

    this.addIdentity(hereToThere);
    otherCluster.addIdentity(thereToHere);
  }

  get(id) {
    if (this.#replacedBy) {
      throw new Error(`Cluster ${this.id} was replaced by ${this.#replacedBy.id}`);
    }

    return this.#identities.get(id);
  }

  getAll(identityType, propertyKey) {
    const values = [];
    this.getAllIdentitiesOf(identityType).forEach((identity) => {
      const propertyValue = identity[propertyKey];

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

  get identityTypes() {
    return Array.from(this.#typeToIdentitiesMap.keys())
      .filter((type) => this.#getSetForType(type).size > 0);
  }

  get identities() {
    return Array.from(this.#identities.values());
  }

  get reclustered() {
    return !!this.#replacedBy;
  }

  #reclusterComplete(replacedBy) {
    if (this.#replacedBy) {
      return;
    }

    if (this.#identities.size !== 0) {
      // eslint-disable-next-line no-console
      console.error(`Cluster ${this.id} was replaced with ${replacedBy.id} but still has ${this.#identities.size} identities`, this.#identities);
    }

    this.figureForCluster?.parentElement?.removeChild(this.figureForCluster);
    if (this.figureForCluster?.contains(this.elementForCluster)) {
      this.figureForCluster.removeChild(this.elementForCluster);
    }

    this.#replacedBy = replacedBy;

    this.#figureForCluster = null;
    this.#elementForCluster = null;

    // reference what we can from the other cluster.
    // It shouldn't be used, but just in case.
    // this.#identities = replacedBy.#identities;
    // this.#figureForCluster = replacedBy.#figureForCluster;
    // this.#elementForCluster = replacedBy.#elementForCluster;

    // only the ID should persist.
    // this keeps async operations with a current correct cluster
    this.#clusterManager.reclusterComplete(replacedBy, this);
  }
}

export default IdentityCluster;
