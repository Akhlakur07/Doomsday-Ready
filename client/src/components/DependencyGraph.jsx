import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Circle, Film, GitBranch, ArrowRight } from 'lucide-react';

const NODE_WIDTH = 176;
const NODE_HEIGHT = 60;
const COL_GAP = 72;
const ROW_GAP = 22;
const PAD_X = 28;
const PAD_Y = 28;

function truncateTitle(title, maxLen = 21) {
  if (!title || title.length <= maxLen) return title || '';
  return `${title.slice(0, maxLen - 1)}…`;
}

function collectReachable(startId, adjacencyMap) {
  const visited = new Set();
  const stack = [...(adjacencyMap.get(startId) || [])];
  while (stack.length > 0) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    for (const nextId of adjacencyMap.get(id) || []) {
      stack.push(nextId);
    }
  }
  return visited;
}

export default function DependencyGraph({
  movies = [],
  targetMovieId = '',
  onSelectMovie,
  title = 'Interactive Prerequisite Graph',
  subtitle = 'Click or hover any movie node to trace its upstream prerequisites and downstream sequels.',
}) {
  const [selectedId, setSelectedId] = useState('');
  const [hoveredId, setHoveredId] = useState('');

  const graph = useMemo(() => {
    if (!movies || movies.length === 0) {
      return null;
    }

    const movieById = new Map(movies.map((m) => [m._id, m]));
    const prereqMap = new Map();
    const dependentMap = new Map();

    for (const m of movies) {
      prereqMap.set(m._id, []);
      dependentMap.set(m._id, []);
    }

    const edges = [];
    for (const m of movies) {
      for (const pId of m.prerequisites || []) {
        if (!movieById.has(pId) || pId === m._id) continue;
        prereqMap.get(m._id).push(pId);
        dependentMap.get(pId).push(m._id);
        edges.push({ from: pId, to: m._id });
      }
    }

    // Compute longest-path layer depth for clean left-to-right DAG layout
    const layerMemo = new Map();
    const visiting = new Set();

    function getLayer(id) {
      if (layerMemo.has(id)) return layerMemo.get(id);
      if (visiting.has(id)) return 0;
      visiting.add(id);

      const prereqs = prereqMap.get(id) || [];
      let maxPrev = -1;
      for (const pId of prereqs) {
        maxPrev = Math.max(maxPrev, getLayer(pId));
      }
      visiting.delete(id);
      const depth = maxPrev + 1;
      layerMemo.set(id, depth);
      return depth;
    }

    const columns = new Map();
    for (const m of movies) {
      const layer = getLayer(m._id);
      if (!columns.has(layer)) columns.set(layer, []);
      columns.get(layer).push(m);
    }

    const maxLayer = Math.max(0, ...columns.keys());
    let maxRows = 1;
    for (const list of columns.values()) {
      list.sort((a, b) =>
        a.releaseYear !== b.releaseYear
          ? a.releaseYear - b.releaseYear
          : a.title.localeCompare(b.title)
      );
      maxRows = Math.max(maxRows, list.length);
    }

    const totalHeight = Math.max(
      260,
      PAD_Y * 2 + maxRows * NODE_HEIGHT + Math.max(0, maxRows - 1) * ROW_GAP
    );
    const totalWidth =
      PAD_X * 2 + (maxLayer + 1) * NODE_WIDTH + maxLayer * COL_GAP;

    const positions = new Map();
    for (let layer = 0; layer <= maxLayer; layer++) {
      const colMovies = columns.get(layer) || [];
      const colHeight =
        colMovies.length * NODE_HEIGHT +
        Math.max(0, colMovies.length - 1) * ROW_GAP;
      const startY = (totalHeight - colHeight) / 2;
      const x = PAD_X + layer * (NODE_WIDTH + COL_GAP);

      colMovies.forEach((movie, rowIdx) => {
        const y = startY + rowIdx * (NODE_HEIGHT + ROW_GAP);
        positions.set(movie._id, { x, y, movie });
      });
    }

    return {
      movieById,
      prereqMap,
      dependentMap,
      edges,
      positions,
      totalWidth,
      totalHeight,
    };
  }, [movies]);

  const activeId = useMemo(() => {
    if (!graph) return '';
    if (hoveredId && graph.movieById.has(hoveredId)) return hoveredId;
    if (selectedId && graph.movieById.has(selectedId)) return selectedId;
    if (targetMovieId && graph.movieById.has(targetMovieId)) return targetMovieId;
    return movies[movies.length - 1]?._id || '';
  }, [graph, hoveredId, selectedId, targetMovieId, movies]);

  const highlight = useMemo(() => {
    if (!graph || !activeId) {
      return { ancestors: new Set(), descendants: new Set() };
    }
    return {
      ancestors: collectReachable(activeId, graph.prereqMap),
      descendants: collectReachable(activeId, graph.dependentMap),
    };
  }, [graph, activeId]);

  if (!graph) {
    return (
      <div className="doom-card rounded-2xl p-6 text-center text-sm text-slate-400">
        No movies available to plot in the dependency graph.
      </div>
    );
  }

  const activeMovie = graph.movieById.get(activeId);
  const activePrereqTitles = (graph.prereqMap.get(activeId) || [])
    .map((id) => graph.movieById.get(id)?.title)
    .filter(Boolean);
  const activeDependentTitles = (graph.dependentMap.get(activeId) || [])
    .map((id) => graph.movieById.get(id)?.title)
    .filter(Boolean);

  return (
    <section className="doom-card overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 bg-black/40 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-bold tracking-wide text-white">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Prerequisite
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-emerald-400" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Dependent
          </span>
        </div>
      </div>

      {/* Scrollable SVG Canvas */}
      <div
        data-lenis-prevent
        className="bg-doom-grid overflow-x-auto bg-[#040907] p-2"
      >
        <svg
          width={graph.totalWidth}
          height={graph.totalHeight}
          viewBox={`0 0 ${graph.totalWidth} ${graph.totalHeight}`}
          className="mx-auto block select-none"
        >
          <defs>
            <marker
              id="doom-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(16, 185, 129, 0.45)" />
            </marker>
            <marker
              id="doom-arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
            </marker>
            <marker
              id="doom-arrow-desc"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* Curved dependency edges */}
          {graph.edges.map((edge) => {
            const fromPos = graph.positions.get(edge.from);
            const toPos = graph.positions.get(edge.to);
            if (!fromPos || !toPos) return null;

            const x1 = fromPos.x + NODE_WIDTH;
            const y1 = fromPos.y + NODE_HEIGHT / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + NODE_HEIGHT / 2;
            const dx = Math.max(40, (x2 - x1) * 0.52);
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const isAncestorEdge =
              (edge.to === activeId || highlight.ancestors.has(edge.to)) &&
              highlight.ancestors.has(edge.from);
            const isDescendantEdge =
              (edge.from === activeId || highlight.descendants.has(edge.from)) &&
              highlight.descendants.has(edge.to);

            let stroke = 'rgba(16, 185, 129, 0.18)';
            let strokeWidth = 1.4;
            let markerEnd = 'url(#doom-arrow)';

            if (isAncestorEdge) {
              stroke = '#34d399';
              strokeWidth = 2.4;
              markerEnd = 'url(#doom-arrow-active)';
            } else if (isDescendantEdge) {
              stroke = '#fbbf24';
              strokeWidth = 2.2;
              markerEnd = 'url(#doom-arrow-desc)';
            }

            return (
              <path
                key={`${edge.from}->${edge.to}`}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                markerEnd={markerEnd}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Movie nodes */}
          {Array.from(graph.positions.values()).map(({ x, y, movie }) => {
            const isActive = movie._id === activeId;
            const isTarget = movie._id === targetMovieId;
            const isAncestor = highlight.ancestors.has(movie._id);
            const isDescendant = highlight.descendants.has(movie._id);
            const isRelated = isActive || isAncestor || isDescendant;

            let fill = '#09120d';
            let stroke = 'rgba(16, 185, 129, 0.25)';
            let strokeWidth = 1.25;

            if (isActive) {
              fill = '#0d2b1d';
              stroke = '#34d399';
              strokeWidth = 2.2;
            } else if (isAncestor) {
              fill = '#092216';
              stroke = '#10b981';
              strokeWidth = 1.8;
            } else if (isDescendant) {
              fill = '#211907';
              stroke = '#fbbf24';
              strokeWidth = 1.7;
            }

            return (
              <g
                key={movie._id}
                transform={`translate(${x}, ${y})`}
                onClick={() => {
                  setSelectedId(movie._id);
                  if (onSelectMovie) onSelectMovie(movie);
                }}
                onMouseEnter={() => setHoveredId(movie._id)}
                onMouseLeave={() => setHoveredId('')}
                className="cursor-pointer"
                opacity={activeId && !isRelated ? 0.42 : 1}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={10}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />

                {/* Watched indicator dot */}
                <circle
                  cx={14}
                  cy={20}
                  r={4.5}
                  fill={movie.watched ? '#34d399' : 'transparent'}
                  stroke={movie.watched ? '#34d399' : '#64748b'}
                  strokeWidth={1.5}
                />

                <text
                  x={26}
                  y={24}
                  fill={isActive ? '#ffffff' : '#e2e8f0'}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Outfit, sans-serif"
                >
                  {truncateTitle(movie.title, 20)}
                </text>

                <text
                  x={14}
                  y={44}
                  fill={isTarget ? '#34d399' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {movie.releaseYear} · {movie.runtime}m
                  {isTarget ? ' · TARGET' : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Inspector HUD */}
      {activeMovie && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-emerald-500/15 bg-black/55 px-5 py-3.5">
          <div className="flex items-center gap-3">
            {activeMovie.posterUrl ? (
              <img
                src={activeMovie.posterUrl}
                alt={activeMovie.title}
                className="h-14 w-10 rounded border border-emerald-500/25 object-cover"
              />
            ) : (
              <div className="flex h-14 w-10 items-center justify-center rounded border border-emerald-500/25 bg-emerald-950/50 text-emerald-400">
                <Film className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-marvel text-lg tracking-wide text-white">
                  {activeMovie.title}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-950/50 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                  {activeMovie.watched ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> WATCHED
                    </>
                  ) : (
                    <>
                      <Circle className="h-3 w-3" /> UNWATCHED
                    </>
                  )}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                <span className="text-emerald-300">Prereqs:</span>{' '}
                {activePrereqTitles.length > 0
                  ? activePrereqTitles.join(', ')
                  : 'None'}{' '}
                · <span className="text-amber-300">Leads into:</span>{' '}
                {activeDependentTitles.length > 0
                  ? activeDependentTitles.join(', ')
                  : 'None'}
              </p>
            </div>
          </div>

          <Link
            to={`/rewatch-plan?movieId=${activeMovie._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Rewatch Plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
