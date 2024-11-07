/* eslint-disable no-restricted-syntax */
import IdentityCluster from './identitycluster.js';
import SimilarClusterIdentity from './similarclusteridentity.js';
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

  async detectSimilarity(batchedClusterIds, identityState, concurrency) {
    const callCount = { value: 0 }; // Use an object to hold the count
    const clusterInfoWithInstigator = [];

    // Gather cluster info with instigator identities
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

    // Initialize identity state if it doesn't exist
    const similarityIdentityState = identityState[SimilarClusterIdentity.type];
    if (!similarityIdentityState) {
      identityState[SimilarClusterIdentity.type] = {};
    }

    // Process each cluster info sequentially
    for (const clusterInfo of clusterInfoWithInstigator) {
      const { clusterId, instigatorIdentityType, instigatingIdentity } = clusterInfo;
      const instigatingCluster = this.get(clusterId);

      const allClustersWithIdentity = this.getAllWithIdentity(instigatorIdentityType);
      const clustersToCompare = instigatingIdentity.filterSimilarClusters(allClustersWithIdentity);
      const { similarityCollaboratorIdentityTypes } = instigatingCluster;

      // Compare clusters sequentially
      for (const similarCluster of clustersToCompare) {
        // eslint-disable-next-line no-await-in-loop
        await this.#compareClustersForSimilarity(
          instigatingCluster,
          similarCluster,
          similarityCollaboratorIdentityTypes,
          callCount,
          concurrency,
        );
      }
    }
  }

  async #compareClustersForSimilarity(
    instigatingCluster,
    similarCluster,
    identityTypes,
  ) {
    if (
      instigatingCluster.reclustered
      || similarCluster.reclustered
      || instigatingCluster.id === similarCluster.id
    ) return;

    // Await the merge score calculation
    const mergeScore = await this.#calculateMergeScore(
      instigatingCluster,
      similarCluster,
      identityTypes,
    );

    // always merge the other cluster into the instigating cluster
    // otherwise the instigating cluster gets replaced half way though,
    // but we keep trying to merge against it.
    if (mergeScore >= matchingPointsThreshold) {
      this.#mergeSimilarCluster(instigatingCluster, similarCluster, mergeScore);
    } else if (mergeScore >= similarPointsThreshold) {
      this.#markSimilarCluster(instigatingCluster, similarCluster, mergeScore);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async #calculateMergeScore(sourceCluster, compareCluster, identityTypes) {
    let totalScore = 0; // Initialize total score

    for (const identityType of identityTypes) {
      const sourceClusterIdentities = sourceCluster.getAllIdentitiesOf(identityType)
        .filter((identity) => identity.similarityCollaborator);
      const compareClusterIdentities = compareCluster.getAllIdentitiesOf(identityType)
        .filter((identity) => identity.similarityCollaborator);

      let identityScore = 0; // Initialize identity score for this type

      for (const sourceIdentity of sourceClusterIdentities) {
        let sourceScore = 0; // Initialize source score for this identity

        for (const compareIdentity of compareClusterIdentities) {
          // eslint-disable-next-line no-await-in-loop
          const weight = await sourceIdentity
            .getMergeWeight(compareIdentity); // Await the async function
          if (Number.isNaN(weight)) {
            console.error(`Invalid weight for ${sourceIdentity.id} and ${compareIdentity.id}`);
          }

          if (weight) sourceScore += weight; // Accumulate the score
        }

        identityScore += sourceScore; // Accumulate identity score
      }

      totalScore += identityScore; // Accumulate total score
    }

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
