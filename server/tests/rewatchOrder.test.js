const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  wouldCreateCycle,
  computeRewatchOrder,
} = require('../src/algorithms/rewatchOrder');

function buildPdfMovieMap() {
  const movies = [
    {
      _id: 'iron-man',
      title: 'Iron Man',
      releaseYear: 2008,
      runtime: 126,
      watched: true,
      prerequisites: [],
    },
    {
      _id: 'first-avenger',
      title: 'Captain America: The First Avenger',
      releaseYear: 2011,
      runtime: 124,
      watched: true,
      prerequisites: [],
    },
    {
      _id: 'avengers',
      title: 'The Avengers',
      releaseYear: 2012,
      runtime: 143,
      watched: false,
      prerequisites: ['iron-man', 'first-avenger'],
    },
    {
      _id: 'civil-war',
      title: 'Captain America: Civil War',
      releaseYear: 2016,
      runtime: 147,
      watched: false,
      prerequisites: ['avengers'],
    },
    {
      _id: 'ragnarok',
      title: 'Thor: Ragnarok',
      releaseYear: 2017,
      runtime: 130,
      watched: true,
      prerequisites: [],
    },
    {
      _id: 'infinity-war',
      title: 'Avengers: Infinity War',
      releaseYear: 2018,
      runtime: 149,
      watched: false,
      prerequisites: ['civil-war', 'ragnarok'],
    },
    {
      _id: 'endgame',
      title: 'Avengers: Endgame',
      releaseYear: 2019,
      runtime: 181,
      watched: false,
      prerequisites: ['infinity-war'],
    },
    {
      _id: 'doomsday',
      title: 'Avengers: Doomsday',
      releaseYear: 2026,
      runtime: 180,
      watched: false,
      prerequisites: ['endgame'],
    },
  ];

  return new Map(movies.map((m) => [m._id, m]));
}

describe('Feature 1: Rewatch Order & Cycle Detection', () => {
  it('computes valid topological rewatch order for Avengers: Doomsday (all 7 prerequisites)', () => {
    const movieMap = buildPdfMovieMap();
    const result = computeRewatchOrder('doomsday', movieMap);

    assert.equal(result.totalMovies, 7);
    assert.equal(result.rewatchOrder.length, 7);

    // Target movie must never be included
    const ids = result.rewatchOrder.map((m) => m._id);
    assert.equal(ids.includes('doomsday'), false);

    // Each prerequisite appears strictly before every movie that requires it
    const position = new Map(ids.map((id, index) => [id, index]));
    for (const movie of result.rewatchOrder) {
      for (const prereqId of movie.prerequisites) {
        assert.ok(
          position.get(prereqId) < position.get(movie._id),
          `${prereqId} must appear before ${movie._id}`
        );
      }
    }

    // 3 watched (iron-man, first-avenger, ragnarok); 4 unwatched (143+147+149+181 = 620)
    assert.equal(result.watchedCount, 3);
    assert.equal(result.unwatchedCount, 4);
    assert.equal(result.remainingRuntimeMinutes, 620);
  });

  it('computes rewatch order for Captain America: Civil War', () => {
    const movieMap = buildPdfMovieMap();
    const result = computeRewatchOrder('civil-war', movieMap);

    assert.equal(result.totalMovies, 3);
    const ids = result.rewatchOrder.map((m) => m._id);

    assert.ok(ids.indexOf('iron-man') < ids.indexOf('avengers'));
    assert.ok(ids.indexOf('first-avenger') < ids.indexOf('avengers'));
    assert.equal(ids[2], 'avengers');
    assert.equal(result.watchedCount, 2);
    assert.equal(result.remainingRuntimeMinutes, 143);
  });

  it('returns an empty list for Thor: Ragnarok (no prerequisites)', () => {
    const movieMap = buildPdfMovieMap();
    const result = computeRewatchOrder('ragnarok', movieMap);

    assert.deepEqual(result.rewatchOrder, []);
    assert.equal(result.totalMovies, 0);
    assert.equal(result.watchedCount, 0);
    assert.equal(result.unwatchedCount, 0);
    assert.equal(result.remainingRuntimeMinutes, 0);
  });

  it('detects indirect cycle when making Avengers: Endgame a prerequisite of Iron Man', () => {
    const movieMap = buildPdfMovieMap();
    assert.equal(wouldCreateCycle('iron-man', ['endgame'], movieMap), true);
  });

  it('detects direct self-dependency', () => {
    const movieMap = buildPdfMovieMap();
    assert.equal(wouldCreateCycle('ragnarok', ['ragnarok'], movieMap), true);
  });

  it('allows valid non-cyclic dependency update and avoids duplicate movies in diamond graphs', () => {
    const diamond = new Map([
      ['a', { _id: 'a', title: 'A', releaseYear: 2008, runtime: 100, watched: false, prerequisites: [] }],
      ['b', { _id: 'b', title: 'B', releaseYear: 2010, runtime: 110, watched: true, prerequisites: ['a'] }],
      ['c', { _id: 'c', title: 'C', releaseYear: 2011, runtime: 120, watched: false, prerequisites: ['a'] }],
      ['d', { _id: 'd', title: 'D', releaseYear: 2012, runtime: 130, watched: false, prerequisites: ['b', 'c'] }],
    ]);

    assert.equal(wouldCreateCycle('d', ['b', 'c'], diamond), false);

    const result = computeRewatchOrder('d', diamond);
    assert.deepEqual(
      result.rewatchOrder.map((m) => m._id),
      ['a', 'b', 'c']
    );
    assert.equal(result.watchedCount, 1);
    assert.equal(result.remainingRuntimeMinutes, 220);
  });

  it('returns null when target movie does not exist', () => {
    const movieMap = buildPdfMovieMap();
    assert.equal(computeRewatchOrder('non-existent', movieMap), null);
  });
});
