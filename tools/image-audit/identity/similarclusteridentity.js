/* eslint-disable class-methods-use-this */
import AbstractIdentity from './abstractidentity.js';

class SimilarClusterIdentity extends AbstractIdentity {
  #id;

  #owningClusterId;

  #similarClusterId;

  #clusterManager;

  static get type() {
    return 'similar-identity';
  }

  get id() {
    return this.#id;
  }

  // Strong identities must have unique ids across all clusters
  // Soft identites must have unique ids within a cluster
  get strong() {
    return false;
  }

  get signleton() {
    return false;
  }

  get similarClusterId() {
    return this.#similarClusterId;
  }

  constructor(clusterManager, clusterId, otherClusterId) {
    super();
    this.clusterManager = clusterManager;
    this.#id = this.#obtainId(clusterId, otherClusterId);
    this.#owningClusterId = clusterId;
    this.#similarClusterId = otherClusterId;
  }

  #obtainId(hereId, thereId) {
    return `psim:${hereId}->${thereId}`;
  }

  get matchingIdentity() {
    const otherCluster = this.clusterManager.get(this.#similarClusterId);
    return otherCluster.identities
      .get(this.#obtainId(this.#similarClusterId, this.#owningClusterId));
  }

  releaseSimilarity() {
    const owningCluster = this.clusterManager.get(this.#owningClusterId);
    const similarCluster = this.clusterManager.get(this.#similarClusterId);
    owningCluster.removeSimilarIdentity(this.#id);
    const otherIdentityId = this.#obtainId(this.#similarClusterId, this.#owningClusterId);
    similarCluster.removeSimilarIdentity(otherIdentityId);
  }
}

export default SimilarClusterIdentity;

// Does not auto-register, as it's created by the cluster manager.
