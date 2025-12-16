/* eslint-disable no-restricted-syntax */
import IdentityCluster from './identitycluster.js';
import SimilarClusterIdentity from './similarclusteridentity.js';
import PromisePool from '../util/promisepool.js';
// eslint-disable-next-line no-unused-vars
import IdentityRegistry from './identityregistry.js'; // Add this line to import IdentityRegistry

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

  // Prevent duplicate originating identities (page + media + instance) across the entire run.
  // Originating identities must expose `globalUniqueAssetIdentifier`.
  #globalUniqueAssetIdentifiers;

  constructor() {
    this.#clusterCount = 0;
    this.#strongIdentityToClusterMap = new Map();
    this.#clusterMap = new Map();
    this.#types = new Set();
    this.#globalUniqueAssetIdentifiers = new Set();
  }

  get clusterCount() {
    return this.#clusterCount;
  }

  newCluster(originatingIdentity, elementForCluster, figureForCluster, type, detailHref) {
    // Originating identities must provide a global unique asset identifier so we can
    // dedupe across the whole run and avoid later merge collisions.
    if (!originatingIdentity || !('globalUniqueAssetIdentifier' in originatingIdentity)) {
      console.error(
        'ClusterManager.newCluster: originatingIdentity must define globalUniqueAssetIdentifier',
        originatingIdentity,
      );
      return null;
    }

    const key = originatingIdentity.globalUniqueAssetIdentifier;
    if (!key) {
      console.error(
        'ClusterManager.newCluster: originatingIdentity.globalUniqueAssetIdentifier must be non-null',
        originatingIdentity,
      );
      return null;
    }

    if (this.#globalUniqueAssetIdentifiers.has(key)) {
      return null;
    }
    this.#globalUniqueAssetIdentifiers.add(key);

    this.#clusterCount += 1;

    const cluster = new IdentityCluster(
      this.#clusterCount,
      this,
      originatingIdentity,
      elementForCluster,
      figureForCluster,
      type,
      detailHref,
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

  /**
   * Check whether this run has already seen the given UrlAndPageIdentity tuple.
   * @param {Object} identity - UrlAndPageIdentity instance
   * @returns {boolean}
   */
  doesContainGlobalUniqueAssetIdentifier(identity) {
    const key = identity?.globalUniqueAssetIdentifier;
    if (!key) return false;
    return this.#globalUniqueAssetIdentifiers.has(key);
  }

  /**
   * Register a UrlAndPageIdentity tuple for this run.
   * @param {Object} identity - UrlAndPageIdentity instance
   * @returns {boolean} true if newly registered, false if it already existed
   */
  registerGlobalUniqueAssetIdentifier(identity) {
    const key = identity?.globalUniqueAssetIdentifier;
    if (!key) return false;
    if (this.#globalUniqueAssetIdentifiers.has(key)) return false;
    this.#globalUniqueAssetIdentifiers.add(key);
    return true;
  }

  reclusterComplete(persistedCluster, consumedCluster) {
    // This maintains a reference from the old cluster to the new one
    // so that any async operations automatically pick up this change.
    // console.debug(`Setting ${consumedCluster.id} to ${persistedCluster.id}`);
    this.#clusterMap.set(consumedCluster.id, persistedCluster);
    consumedCluster.clusterIdsThisClusterReplaces.forEach((clusterId) => {
      // console.debug(`Setting ${clusterId} to ${persistedCluster.id}`);
      this.#clusterMap.set(clusterId, persistedCluster);
    });
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

  async detectSimilarity(batchedClusterIds, identityState) {
    const clusterInfoWithInstigator = [];

    // IMPORTANT: A batch can contain many cluster IDs that are now aliases of the same
    // live cluster (after reclustering). Deduplicate by the *current* cluster.id so we
    // don't schedule redundant (and potentially cyclic) similarity checks.
    const distinctClusters = new Map(); // cluster.id -> cluster
    batchedClusterIds.forEach((clusterId) => {
      const cluster = this.get(clusterId);
      if (cluster) distinctClusters.set(cluster.id, cluster);
    });

    // Gather cluster info with instigator identities (deduped per cluster+type)
    distinctClusters.forEach((cluster) => {
      const seenInstigatorTypes = new Set();
      cluster.identities.forEach((identity) => {
        if (identity.similarityInstigator && !seenInstigatorTypes.has(identity.type)) {
          seenInstigatorTypes.add(identity.type);
          clusterInfoWithInstigator.push({
            clusterId: cluster.id,
            instigatorIdentityType: identity.type,
            instigatingIdentity: identity,
          });
        }
      });
    });

    // Initialize identity state if it doesn't exist
    if (!identityState[SimilarClusterIdentity.type]) {
      identityState[SimilarClusterIdentity.type] = {};
    }

    // Collect all similarity comparison promises
    const promisePool = new PromisePool(Infinity, 'Similarity detection pool');
    // Prevent redundant work and A<->B ping-pong, but DO NOT suppress valid comparisons
    // across different instigator identity types.
    const processedPairKeys = new Set(); // key = `${instigatorIdentityType}|${sortedPair}`

    // Iterate over each cluster info with instigator
    clusterInfoWithInstigator.forEach((clusterInfo) => {
      const { clusterId, instigatorIdentityType, instigatingIdentity } = clusterInfo;
      const instigatingCluster = this.get(clusterId);

      const allClustersWithIdentity = this.getAllWithIdentity(instigatorIdentityType);
      const clustersToCompare = instigatingIdentity.filterSimilarClusters(allClustersWithIdentity);
      const { similarityCollaboratorIdentityTypes } = instigatingCluster;

      // Collect promises for each similarity check
      clustersToCompare.forEach((similarCluster) => {
        promisePool.run(async () => this.#compareClustersForSimilarity(
          instigatingCluster,
          similarCluster,
          similarityCollaboratorIdentityTypes,
          instigatorIdentityType,
          processedPairKeys,
        ));
      });
    });

    return promisePool.allSettled();
  }

  async #compareClustersForSimilarity(
    instigatingCluster,
    similarCluster,
    identityTypes,
    instigatorIdentityType,
    processedPairKeys,
  ) {
    // Resolve to the current live clusters (handles recluster aliasing)
    const liveInstigating = instigatingCluster ? this.get(instigatingCluster.id) : null;
    const liveSimilar = similarCluster ? this.get(similarCluster.id) : null;
    if (!liveInstigating || !liveSimilar) return;

    // Deduplicate pair work (prevents A->B and B->A ping-pong, and repeated work due to aliases)
    const pairKey = `${instigatorIdentityType}|${[liveInstigating.id, liveSimilar.id].sort().join('|')}`;
    if (processedPairKeys?.has(pairKey)) return;
    processedPairKeys?.add(pairKey);

    if (
      liveInstigating.reclustered
      || liveSimilar.reclustered
      || liveInstigating.id === liveSimilar.id
    ) return;

    // If we've already marked these clusters similar, don't do it again.
    // SimilarClusterIdentity ids are deterministic: psim:{hereId}->{thereId}
    const alreadySimilar = !!(
      liveInstigating.get(`psim:${liveInstigating.id}->${liveSimilar.id}`)
      || liveSimilar.get(`psim:${liveSimilar.id}->${liveInstigating.id}`)
    );
    if (alreadySimilar) return;

    // Await the merge score calculation
    const mergeScore = await this.#calculateMergeScore(
      liveInstigating,
      liveSimilar,
      identityTypes,
    );

    // Re-resolve after async work: either cluster may have been reclustered while we awaited.
    const postInstigating = this.get(liveInstigating.id);
    const postSimilar = this.get(liveSimilar.id);
    if (!postInstigating || !postSimilar) return;
    if (postInstigating.reclustered || postSimilar.reclustered) return;
    if (postInstigating.id === postSimilar.id) return;

    // Always merge/mark the OTHER cluster into/against the instigating cluster.
    // Otherwise the instigating cluster can get replaced halfway through and cause
    // redundant work (and in worst cases cycles).
    if (mergeScore >= matchingPointsThreshold) {
      this.#mergeSimilarCluster(postSimilar, postInstigating, mergeScore);
    } else if (mergeScore >= similarPointsThreshold) {
      this.#markSimilarCluster(postSimilar, postInstigating, mergeScore);
    }
  }

  async #calculateMergeScore(sourceCluster, compareCluster, identityTypes) {
    let totalScore = 0; // Initialize total score
    const promisePool = new PromisePool(Infinity, 'Merge score calculation pool');
    const identityScores = []; // Array to store intermediate scores for each identity type

    // Iterate over each identity type
    identityTypes.forEach((identityType, identityTypeIndex) => {
      const sourceClusterIdentities = sourceCluster.getAllIdentitiesOf(identityType)
        .filter((identity) => identity.similarityCollaborator);
      const compareClusterIdentities = compareCluster.getAllIdentitiesOf(identityType)
        .filter((identity) => identity.similarityCollaborator);

      // Collect promises for each comparison of source and compare identities
      sourceClusterIdentities.forEach((sourceIdentity, sourceIndex) => {
        let sourceScore = 0; // Initialize source score for this identity

        compareClusterIdentities.forEach((compareIdentity, compareIndex) => {
          // Push the getMergeWeight promise into the array with index tracking
          promisePool.run(async () => sourceIdentity
            .getMergeWeight(compareIdentity)
            .then((weight) => {
              if (Number.isNaN(weight)) {
                console.error(`Invalid weight for ${sourceIdentity.id} and ${compareIdentity.id}`);
              } else {
                sourceScore += weight;
              }
            })
            .catch((error) => console.error('Error in getMergeWeight:', error))
            .finally(() => {
              // Store the accumulated score for this source identity
              if (sourceIndex === sourceClusterIdentities.length - 1
                    && compareIndex === compareClusterIdentities.length - 1) {
                identityScores[identityTypeIndex] = (identityScores[identityTypeIndex]
                    || 0) + sourceScore;
              }
            }));
        });
      });
    });

    await promisePool.allSettled();

    // Accumulate total score from all identity types
    totalScore = identityScores.reduce((acc, score) => acc + score, 0);

    return totalScore; // Return the total score
  }

  #mergeSimilarCluster(clusterToMerge, clusterToMergeInto, score) {
    if (clusterToMerge.reclustered || clusterToMergeInto.reclustered) {
      return;
    }

    if (clusterToMerge === clusterToMergeInto) {
      return;
    }

    console.info(`Merging ${clusterToMerge.id} into ${clusterToMergeInto.id} because of similarity score ${score}`);
    clusterToMergeInto.mergeCluster(clusterToMerge);
  }

  #markSimilarCluster(clusterToMerge, clusterToMergeInto, score) {
    if (clusterToMerge.reclustered || clusterToMergeInto.reclustered) {
      return;
    }

    if (clusterToMerge === clusterToMergeInto || clusterToMerge.id === clusterToMergeInto.id) {
      return;
    }

    // Avoid re-adding the same similarity edge over and over.
    if (clusterToMergeInto.get(`psim:${clusterToMergeInto.id}->${clusterToMerge.id}`)) {
      return;
    }

    console.info(`Marking ${clusterToMerge.id} similar to ${clusterToMergeInto.id} because of similarity score ${score}`);
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

    console.info(`Merging ${clusterToMerge.id} into ${existingCluster.id} because of identity ${triggeringStrongIdentity.id}`);
    existingCluster.mergeCluster(clusterToMerge);
  }

  get clusterTypes() {
    return Array.from(this.#types);
  }

  getAllClusters(type = null) {
    const distinctClusters = new Set(this.#clusterMap.values());
    if (type) return Array.from(distinctClusters).filter((cluster) => cluster.type === type);
    return Array.from(distinctClusters);
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
