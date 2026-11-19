/**
 * Find the minimum number of seat bundles whose sizes sum to exactly `groupSize`.
 *
 * Uses bottom-up dynamic programming (unbounded coin change) plus a parent
 * array (`lastBundle`) to reconstruct how many of each bundle size to buy.
 *
 * @param {number[]} bundleSizes
 * @param {number} groupSize
 * @returns {{ possible: boolean, totalBundles: number, bundles: Array<{ size: number, count: number }> }}
 */
function calculateBookingQuote(bundleSizes, groupSize) {
  if (
    !Array.isArray(bundleSizes) ||
    bundleSizes.length === 0 ||
    !Number.isInteger(groupSize) ||
    groupSize < 1
  ) {
    return { possible: false, totalBundles: 0, bundles: [] };
  }

  // Sort descending so ties with equal bundle count deterministically favor larger bundles
  const sizes = [...new Set(bundleSizes)].sort((a, b) => b - a);

  const dp = new Array(groupSize + 1).fill(Infinity);
  const lastBundle = new Array(groupSize + 1).fill(0);
  dp[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of sizes) {
      if (seats >= size && dp[seats - size] + 1 < dp[seats]) {
        dp[seats] = dp[seats - size] + 1;
        lastBundle[seats] = size;
      }
    }
  }

  if (dp[groupSize] === Infinity) {
    return { possible: false, totalBundles: 0, bundles: [] };
  }

  // Backtrack from groupSize to 0 to count each bundle size used
  const counts = new Map();
  let remaining = groupSize;
  while (remaining > 0) {
    const usedSize = lastBundle[remaining];
    counts.set(usedSize, (counts.get(usedSize) || 0) + 1);
    remaining -= usedSize;
  }

  const bundles = Array.from(counts.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => ({ size, count }));

  return {
    possible: true,
    totalBundles: dp[groupSize],
    bundles,
  };
}

module.exports = { calculateBookingQuote };
