/* eslint-disable class-methods-use-this */
import AbstractIdentity from './abstractidentity.js';

class SimilarClusterIdentity extends AbstractIdentity {
  #owningClusterId;

  #similarClusterId;

  #clusterManager;

  static get type() {
    return 'similar-identity';
  }

  // Strong identities must have unique ids across all clusters
  // Soft identites must have unique ids within a cluster

  get owningClusterId() {
    return this.#owningClusterId;
  }

  get similarClusterId() {
    return this.#similarClusterId;
  }

  constructor(clusterManager, clusterId, otherClusterId) {
    super(SimilarClusterIdentity.#obtainId(clusterId, otherClusterId));
    this.clusterManager = clusterManager;
    this.#owningClusterId = clusterId;
    this.#similarClusterId = otherClusterId;
  }

  static #obtainId(hereId, thereId) {
    return `psim:${hereId}->${thereId}`;
  }

  get matchingIdentity() {
    const otherCluster = this.clusterManager.get(this.#similarClusterId);
    return otherCluster
      .get(SimilarClusterIdentity.#obtainId(this.#similarClusterId, this.#owningClusterId));
  }

  releaseSimilarity() {
    const owningCluster = this.clusterManager.get(this.#owningClusterId);
    const similarCluster = this.clusterManager.get(this.#similarClusterId);
    owningCluster.removeSimilarIdentity(this.id);
    const otherIdentityId = SimilarClusterIdentity
      .#obtainId(this.#similarClusterId, this.#owningClusterId);
    similarCluster.removeSimilarIdentity(otherIdentityId);
  }
}

export default SimilarClusterIdentity;

// Does not auto-register, as it's created by the cluster manager.
