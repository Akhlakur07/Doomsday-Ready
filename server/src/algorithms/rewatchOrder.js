/**
 * Check whether setting `newPrereqIds` as prerequisites for `movieId`
 * would introduce a direct self-dependency or an indirect cycle.
 *
 * Assumes the existing prerequisite graph in `movieMap` is already acyclic.
 * Walks prerequisite links starting from `newPrereqIds`; if `movieId` is
 * reachable, adding these edges would create a cycle.
 *
 * @param {string} movieId
 * @param {string[]} newPrereqIds
 * @param {Map<string, { _id: any, prerequisites?: any[] }>} movieMap
 * @returns {boolean}
 */
function wouldCreateCycle(movieId, newPrereqIds, movieMap) {
  const targetId = String(movieId);
  const stack = (newPrereqIds || []).map(String);
  const visited = new Set();

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId === targetId) {
      return true;
    }
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const movie = movieMap.get(currentId);
    if (!movie || !Array.isArray(movie.prerequisites)) {
      continue;
    }

    for (const prereqId of movie.prerequisites) {
      stack.push(String(prereqId));
    }
  }

  return false;
}

/**
 * Compute the ordered rewatch plan for a target movie (excluding the target itself).
 *
 * 1. Collect all required ancestor movies using iterative DFS.
 * 2. Run Kahn's topological sort on the ancestor subgraph with chronological
 *    tie-breaking (releaseYear ascending, then title ascending).
 * 3. Compute watched count and remaining unwatched runtime in minutes.
 *
 * @param {string} targetId
 * @param {Map<string, { _id: any, title: string, releaseYear: number, runtime: number, watched?: boolean, prerequisites?: any[] }>} movieMap
 */
function computeRewatchOrder(targetId, movieMap) {
  const rootId = String(targetId);
  const target = movieMap.get(rootId);
  if (!target) {
    return null;
  }

  // Collect all required ancestor IDs (excluding the target itself)
  const neededIds = new Set();
  const stack = (target.prerequisites || []).map(String);

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId === rootId || neededIds.has(currentId)) {
      continue;
    }

    const movie = movieMap.get(currentId);
    if (!movie) {
      continue;
    }

    neededIds.add(currentId);
    for (const prereqId of movie.prerequisites || []) {
      stack.push(String(prereqId));
    }
  }

  // Build local in-degree counts and reverse edges inside neededIds
  const inDegree = new Map();
  const dependents = new Map();

  for (const id of neededIds) {
    inDegree.set(id, 0);
    dependents.set(id, new Set());
  }

  for (const id of neededIds) {
    const movie = movieMap.get(id);
    const uniquePrereqs = new Set((movie.prerequisites || []).map(String));

    for (const prereqId of uniquePrereqs) {
      if (!neededIds.has(prereqId)) {
        continue;
      }
      inDegree.set(id, inDegree.get(id) + 1);
      dependents.get(prereqId).add(id);
    }
  }

  // Kahn's topological sort with chronological tie-breaking
  const ready = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      ready.push(id);
    }
  }

  const compareChronologically = (aId, bId) => {
    const movieA = movieMap.get(aId);
    const movieB = movieMap.get(bId);
    if (movieA.releaseYear !== movieB.releaseYear) {
      return movieA.releaseYear - movieB.releaseYear;
    }
    return movieA.title.localeCompare(movieB.title);
  };

  const rewatchOrder = [];
  while (ready.length > 0) {
    ready.sort(compareChronologically);
    const currentId = ready.shift();
    rewatchOrder.push(movieMap.get(currentId));

    for (const depId of dependents.get(currentId)) {
      const nextDegree = inDegree.get(depId) - 1;
      inDegree.set(depId, nextDegree);
      if (nextDegree === 0) {
        ready.push(depId);
      }
    }
  }

  if (rewatchOrder.length !== neededIds.size) {
    const error = new Error('Circular dependency detected in movie prerequisites.');
    error.code = 'CIRCULAR_DEPENDENCY';
    throw error;
  }

  // Calculate watched summary and remaining unwatched watch time
  let watchedCount = 0;
  let remainingRuntimeMinutes = 0;

  for (const movie of rewatchOrder) {
    if (movie.watched) {
      watchedCount += 1;
    } else {
      remainingRuntimeMinutes += movie.runtime;
    }
  }

  return {
    targetMovie: target,
    rewatchOrder,
    totalMovies: rewatchOrder.length,
    watchedCount,
    unwatchedCount: rewatchOrder.length - watchedCount,
    remainingRuntimeMinutes,
  };
}

module.exports = { wouldCreateCycle, computeRewatchOrder };
