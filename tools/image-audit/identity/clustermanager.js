import IdentityCluster from './identitycluster.js';

/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
const matchingPointsThreshold = 80;
const similarPointsThreshold = 40;

class ClusterManager {
  // note: Only ever growing.
  #clusterMap;

  #strongIdentityToClusterMap;

  #types;

  #clusterCount;

  #currentlyRunningSimilarity;

  constructor() {
    this.#clusterCount = 0;
    this.#strongIdentityToClusterMap = new Map();
    this.#clusterMap = new Map();
    this.#types = new Set();
    this.#currentlyRunningSimilarity = 0;
  }

  get clusterCount() {
    return this.#clusterCount;
  }

  newCluster(originatingIdentity, elementForCluster, figureForCluster, type) {
    this.#clusterCount += 1;

    const cluster = new IdentityCluster(
      this.#clusterCount,
      this,
      originatingIdentity,
      elementForCluster,
      figureForCluster,
      type,
    );

    this.#add(cluster);

    return cluster.id;
  }

  #add(newCluster) {
    this.#clusterMap.set(newCluster.id, newCluster);
    this.#types.add(newCluster.type);
    return newCluster.id;
  }

  get(clusterId) {
    return this.#clusterMap.get(clusterId);
  }

  reclusterComplete(persistedCluster, consumedCluster) {
    // This maintains a reference from the old cluster to the new one
    // so that any async operations automatically pick up this change.
    this.#clusterMap.set(consumedCluster.id, persistedCluster);
  }

  identityAdded(identity, cluster) {
    if (identity.strong) {
      if (this.#strongIdentityToClusterMap.has(identity.id)) {
        if (this.#strongIdentityToClusterMap.get(identity.id) !== cluster) {
          this.#mergeCluster(cluster, identity);
        }
      } else {
        this.#strongIdentityToClusterMap.set(identity.id, cluster);
      }
    }
    // Nothing to do with soft identities
  }

  identityMoved(identity, updatedOwningClusterId) {
    if (identity.strong) {
      this.#strongIdentityToClusterMap.set(identity.id, this.get(updatedOwningClusterId));
    }
    // Nothing to do with soft identities
  }

  identityRemoved(identity, cluster) {
    if (identity.strong && this.#strongIdentityToClusterMap.get(identity.id) === cluster) {
      this.#strongIdentityToClusterMap.delete(identity.id);
    }
  }

  async detectSimilarity(batchedClusterIds, concurrency) {
    const callCount = { value: 0 }; // Use an object to hold the count

    const clusterInfoWithInstigator = [];

    batchedClusterIds.forEach((clusterId) => {
      const cluster = this.get(clusterId);
      cluster.identities.forEach((identity) => {
        if (identity.similarityInstigator) {
          clusterInfoWithInstigator.push({
            clusterId: cluster.id,
            instigatorIdentityType: identity.type,
            instigatingIdentity: identity,
          });
        }
      });
    });

    const results = await Promise.allSettled(clusterInfoWithInstigator.map((clusterInfo) => {
      const { clusterId, instigatorIdentityType, instigatingIdentity } = clusterInfo;
      const instigatingCluster = this.get(clusterId);

      const allClustersWithIdentity = this.getAllWithIdentity(instigatorIdentityType);
      const clustersToCompare = instigatingIdentity.filterSimilarClusters(allClustersWithIdentity);
      const { similarityCollaboratorIdentityTypes } = instigatingCluster;

      return Promise.allSettled(clustersToCompare.map((similarCluster) => this
        .#compareClustersForSimilarity(
          instigatingCluster,
          similarCluster,
          similarityCollaboratorIdentityTypes,
          callCount,
          concurrency,
        )));
    }));

    results
      .filter((result) => result.status === 'rejected')
      .forEach((error) => console.error('Error handling similarity', error));
  }

  async #waitForSimilaritySlot(concurrency, maxAttempts = 6000, intervalMs = 100) {
    let attempts = 0;

    while (this.#currentlyRunningSimilarity >= concurrency) {
      if (attempts >= maxAttempts) {
        return false;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, intervalMs); });
      attempts += 1;
    }
    return true;
  }

  async #compareClustersForSimilarity(
    instigatingCluster,
    similarCluster,
    identityTypes,
    concurrency,
  ) {
    if (
      instigatingCluster.reclustered
      || similarCluster.reclustered
      || instigatingCluster.id === similarCluster.id
    ) return;

    if (await this.#waitForSimilaritySlot(concurrency)) {
      this.#currentlyRunningSimilarity += 1;
      let mergeScore = 0;
      try {
        // Await the merge score calculation
        mergeScore = await this.#calculateMergeScore(
          instigatingCluster,
          similarCluster,
          identityTypes,
        );
      } finally {
        this.#currentlyRunningSimilarity -= 1;
      }

      // always merge the other cluster into the instigating cluster
      // otherwise the instigating cluster gets replaced half way though,
      // but we keep trying to merge against it.
      if (mergeScore >= matchingPointsThreshold) {
        this.#mergeSimilarCluster(instigatingCluster, similarCluster, mergeScore);
      } else if (mergeScore >= similarPointsThreshold) {
        this.#markSimilarCluster(instigatingCluster, similarCluster, mergeScore);
      }
    } else {
      console.error('Failed to get a similarity slot');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async #calculateMergeScore(sourceCluster, compareCluster, identityTypes) {
    const scores = await Promise.allSettled(identityTypes.map(async (identityType) => {
      const sourceClusterIdentities = sourceCluster.getAllIdentitiesOf(identityType)
        .filter((identity) => identity.similarityCollaborator);
      const compareClusterIdentities = compareCluster.getAllIdentitiesOf(identityType)
        .filter((identity) => identity.similarityCollaborator);

      // Use Promise.allSettled to handle potential async calls to getMergeWeight
      const identityScores = await Promise.allSettled(
        sourceClusterIdentities.map(async (sourceIdentity) => {
          const subScores = await Promise.allSettled(
            compareClusterIdentities
              .map(async (compareIdentity) => sourceIdentity.getMergeWeight(compareIdentity)),
          );

          subScores
            .filter((result) => result.status === 'rejected')
            .forEach((error) => console.error('Error processing similarity', error));

          // Extract values from Promise.allSettled and sum them
          return subScores.reduce((sum, res) => sum + (res.status === 'fulfilled' ? res.value : 0), 0);
        }),
      );
      identityScores
        .filter((result) => result.status === 'rejected')
        .forEach((error) => console.error('Error processing similarity', error));

      // Sum each subScore value from identityScores
      return identityScores.reduce((total, res) => total + (res.status === 'fulfilled' ? res.value : 0), 0);
    }));

    scores
      .filter((result) => result.status === 'rejected')
      .forEach((error) => console.error('Error processing similarity', error));

    // Sum all the identity type scores
    return scores.reduce((total, res) => total + (res.status === 'fulfilled' ? res.value : 0), 0);
  }

  #mergeSimilarCluster(clusterToMerge, clusterToMergeInto, score) {
    if (clusterToMerge.reclustered || clusterToMergeInto.reclustered) {
      return;
    }

    if (clusterToMerge === clusterToMergeInto) {
      return;
    }

    console.log(`Merging ${clusterToMerge.id} into ${clusterToMergeInto.id} because of similarity score ${score}`);
    clusterToMergeInto.mergeCluster(clusterToMerge);
  }

  #markSimilarCluster(clusterToMerge, clusterToMergeInto, score) {
    if (clusterToMerge.reclustered || clusterToMergeInto.reclustered) {
      return;
    }

    console.log(`Marking ${clusterToMerge.id} similar to ${clusterToMergeInto.id} because of similarity score ${score}`);
    clusterToMergeInto.markSimilarCluster(clusterToMerge);
  }

  #mergeCluster(clusterToMerge, triggeringStrongIdentity) {
    if (clusterToMerge.reclustered) {
      return;
    }
    const existingCluster = this.#strongIdentityToClusterMap.get(triggeringStrongIdentity.id);
    if (!existingCluster || existingCluster.reclustered) {
      return; // already merged
    }

    console.log(`Merging ${clusterToMerge.id} into ${existingCluster.id} because of identity ${triggeringStrongIdentity.id}`);
    existingCluster.mergeCluster(clusterToMerge);
  }

  get clusterTypes() {
    return Array.from(this.#types);
  }

  getAllClusters(type) {
    const distinctClusters = new Set(this.#clusterMap.values());
    return Array.from(distinctClusters).filter((cluster) => cluster.type === type);
  }

  getAllWithIdentity(identityType) {
    const distinctClusters = new Set(this.#clusterMap.values());
    return Array.from(distinctClusters).filter(
      (cluster) => !!cluster.getFirstIdentityOf(identityType),
    );
  }

  getAllProperties(clusterType, identityType, propertyKey) {
    const values = [];
    this.getAllClusters(clusterType).forEach((cluster) => {
      values.push(...cluster.getAll(identityType, propertyKey));
      return values;
    });
  }
}

export default ClusterManager;
