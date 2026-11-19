const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateBookingQuote } = require('../src/algorithms/bundleBooking');

describe('Feature 2: Watch-Party Booking Quote', () => {
  it('solves PDF case 1: bundles [1, 3, 4], groupSize 6 -> 2 bundles (3 x 2)', () => {
    const quote = calculateBookingQuote([1, 3, 4], 6);
    assert.deepEqual(quote, {
      possible: true,
      totalBundles: 2,
      bundles: [{ size: 3, count: 2 }],
    });
  });

  it('solves PDF case 2: bundles [2, 5], groupSize 11 -> 4 bundles (5 x 1, 2 x 3)', () => {
    const quote = calculateBookingQuote([2, 5], 11);
    assert.deepEqual(quote, {
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ],
    });
  });

  it('solves PDF case 3: bundles [6, 9, 20], groupSize 44 -> 4 bundles (20 x 1, 9 x 2, 6 x 1)', () => {
    const quote = calculateBookingQuote([6, 9, 20], 44);
    assert.deepEqual(quote, {
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 20, count: 1 },
        { size: 9, count: 2 },
        { size: 6, count: 1 },
      ],
    });
  });

  it('solves PDF case 4: bundles [4, 6], groupSize 7 -> Not possible', () => {
    const quote = calculateBookingQuote([4, 6], 7);
    assert.deepEqual(quote, {
      possible: false,
      totalBundles: 0,
      bundles: [],
    });
  });

  it('handles minimum boundary groupSize = 1', () => {
    assert.deepEqual(calculateBookingQuote([1, 5], 1), {
      possible: true,
      totalBundles: 1,
      bundles: [{ size: 1, count: 1 }],
    });
    assert.deepEqual(calculateBookingQuote([2, 5], 1), {
      possible: false,
      totalBundles: 0,
      bundles: [],
    });
  });

  it('handles maximum boundary groupSize = 10000 cleanly', () => {
    const quote = calculateBookingQuote([7, 250, 500], 10000);
    assert.equal(quote.possible, true);
    assert.equal(quote.totalBundles, 20);
    assert.deepEqual(quote.bundles, [{ size: 500, count: 20 }]);
  });
});
