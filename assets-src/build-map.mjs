// Build src/map-data.js from osm.json (Overpass export of Vinhomes Ocean Park 1)
import fs from 'node:fs';

const osm = JSON.parse(fs.readFileSync('/tmp/claude-1000/-home-n91ym1nhky-Courses-AI20K-C2-Landing/9a3c4a6c-bedc-4cee-ba34-e955d16139ea/scratchpad/osm.json'));
const els = osm.elements;

// ---------- projection window from the real boundary polygon ----------
const boundaryWay = els.find((e) => e.id === 761986888 && e.type === 'way');
const blats = boundaryWay.geometry.map((g) => g.lat);
const blons = boundaryWay.geometry.map((g) => g.lon);
const pad = 0.1; // 10% context beyond the fence so the boundary reads as a shape
let lat0 = Math.min(...blats), lat1 = Math.max(...blats);
let lon0 = Math.min(...blons), lon1 = Math.max(...blons);
const dLat = lat1 - lat0, dLon = lon1 - lon0;
lat0 -= dLat * pad; lat1 += dLat * pad; lon0 -= dLon * pad; lon1 += dLon * pad;

const P = ({ lat, lon }) => [
  ((lon - lon0) / (lon1 - lon0)) * 100,
  ((lat1 - lat) / (lat1 - lat0)) * 100,
];
const kmWidth = (lon1 - lon0) * 111.32 * Math.cos((21.0 * Math.PI) / 180);
const scale500m = (0.5 / kmWidth) * 100;

// ---------- helpers ----------
function simplify(pts, eps) {
  // Douglas-Peucker
  if (pts.length < 3) return pts;
  const dmax = { d: 0, i: 0 };
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dx * (a[1] - pts[i][1]) - dy * (a[0] - pts[i][0])) / len;
    if (d > dmax.d) { dmax.d = d; dmax.i = i; }
  }
  if (dmax.d <= eps) return [a, b];
  const left = simplify(pts.slice(0, dmax.i + 1), eps);
  const right = simplify(pts.slice(dmax.i), eps);
  return left.slice(0, -1).concat(right);
}
// Closed rings break plain Douglas-Peucker (the first→last chord is a
// degenerate point) — split at the farthest vertex and simplify each arc.
function simplifyRing(pts, eps) {
  const closed = pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
  const open = closed ? pts.slice(0, -1) : pts.slice();
  if (open.length < 4) return open;
  let far = 1, fd = 0;
  for (let i = 1; i < open.length; i++) {
    const d = Math.hypot(open[i][0] - open[0][0], open[i][1] - open[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  const a = simplify(open.slice(0, far + 1), eps);
  const b = simplify(open.slice(far).concat([open[0]]), eps);
  return a.slice(0, -1).concat(b.slice(0, -1));
}
const isClosed = (pts) => pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
const fmt = (n) => (Math.round(n * 10) / 10).toString();
function toPath(pts, close = false) {
  return (
    'M' + pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join('L') + (close ? 'Z' : '')
  );
}
const inWindow = (pts) => pts.some(([x, y]) => x > -3 && x < 103 && y > -3 && y < 103);

// ---------- boundary ----------
const boundaryPts = simplifyRing(boundaryWay.geometry.map(P), 0.25);
const boundaryPath = toPath(boundaryPts, true);
// veil: full rect + boundary hole (fill-rule evenodd)
const veilPath = 'M-2 -2H102V102H-2Z ' + boundaryPath;

// ---------- roads ----------
const majorSet = new Set(['motorway', 'trunk', 'primary', 'secondary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link']);
const minorSet = new Set(['tertiary', 'residential', 'unclassified', 'tertiary_link']);
const laneSet = new Set(['service', 'pedestrian']);
const tiers = { major: [], minor: [], lane: [] };
const drivable = []; // for routing graph
for (const e of els) {
  if (e.type !== 'way' || !e.tags?.highway || !e.geometry) continue;
  const hw = e.tags.highway;
  const tier = majorSet.has(hw) ? 'major' : minorSet.has(hw) ? 'minor' : laneSet.has(hw) ? 'lane' : null;
  if (!tier) continue;
  const pts = e.geometry.map(P);
  if (!inWindow(pts)) continue;
  const eps = tier === 'lane' ? 0.22 : 0.15;
  const closedWay = isClosed(pts);
  const simple = closedWay ? simplifyRing(pts, eps) : simplify(pts, eps);
  tiers[tier].push(toPath(simple, closedWay));
  if (tier !== 'lane' || hw === 'service') drivable.push({ id: e.id, name: e.tags.name, pts: e.geometry.map(P) });
}

// ---------- water ----------
const waterPaths = [];
let lakeLabel = null;
for (const e of els) {
  if (e.tags?.natural !== 'water') continue;
  const rings = [];
  if (e.type === 'way' && e.geometry) rings.push(e.geometry);
  if (e.type === 'relation' && e.members) {
    for (const m of e.members) if (m.role === 'outer' && m.geometry) rings.push(m.geometry);
  }
  for (const ring of rings) {
    const pts = ring.map(P);
    if (!inWindow(pts)) continue;
    waterPaths.push(toPath(simplifyRing(pts, 0.18), true));
    if (e.tags?.name === 'Hồ Biển Mặn') {
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      lakeLabel = { x: Math.round(cx * 10) / 10, y: Math.round(cy * 10) / 10 };
    }
  }
}

// ---------- routing graph on the real streets ----------
const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const adj = new Map();
function addEdge(a, b) {
  const ka = key(a), kb = key(b);
  const w = Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (!adj.has(ka)) adj.set(ka, { p: a, n: [] });
  if (!adj.has(kb)) adj.set(kb, { p: b, n: [] });
  adj.get(ka).n.push({ k: kb, w });
  adj.get(kb).n.push({ k: ka, w });
}
for (const way of drivable) for (let i = 1; i < way.pts.length; i++) addEdge(way.pts[i - 1], way.pts[i]);

function nearestNode(target) {
  let best = null, bd = Infinity;
  for (const [k, v] of adj) {
    const d = Math.hypot(v.p[0] - target[0], v.p[1] - target[1]);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
function dijkstra(src, dst, bannedEdges = null, bannedNodes = null) {
  const dist = new Map([[src, 0]]);
  const prev = new Map();
  const pq = [[0, src]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (u === dst) break;
    if (d > (dist.get(u) ?? Infinity)) continue;
    for (const { k, w } of adj.get(u).n) {
      if (bannedNodes && bannedNodes.has(k) && k !== dst) continue;
      if (bannedEdges && (bannedEdges.has(u + '|' + k) || bannedEdges.has(k + '|' + u))) continue;
      const nd = d + w;
      if (nd < (dist.get(k) ?? Infinity)) { dist.set(k, nd); prev.set(k, u); pq.push([nd, k]); }
    }
  }
  if (!prev.has(dst) && src !== dst) return null;
  const path = [dst];
  while (path[0] !== src) path.unshift(prev.get(path[0]));
  return path;
}
const segDist = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
const distToPoly = (p, poly) => {
  let best = Infinity;
  for (let i = 1; i < poly.length; i++) best = Math.min(best, segDist(p, poly[i - 1], poly[i]));
  return best;
};
// max over pts of min distance to the polyline poly (deviation measure)
function maxDeviation(pts, poly) {
  let worst = 0;
  for (const p of pts) worst = Math.max(worst, distToPoly(p, poly));
  return worst;
}
// every graph node within R of the polyline — a whole blocked ZONE
function nodesNear(polyPts, R, exclude) {
  const banned = new Set();
  for (const [k, v] of adj) {
    if (exclude.has(k)) continue;
    if (distToPoly(v.p, polyPts) < R) banned.add(k);
  }
  return banned;
}

// pin anchors (real coordinates)
const vincom = P({ lat: 20.9939238, lon: 105.9595538 });
const vinuniWay = els.find((e) => e.id === 777888670);
const vinuniPts = vinuniWay.geometry.map(P);
const vinuni = [vinuniPts.reduce((s, p) => s + p[0], 0) / vinuniPts.length, vinuniPts.reduce((s, p) => s + p[1], 0) / vinuniPts.length];
const saoBienWays = els.filter((e) => e.type === 'way' && /^Sao Biển \d/.test(e.tags?.name || '') && e.geometry);
const sbPts = saoBienWays.flatMap((e) => e.geometry.map(P));
const saoBien = [sbPts.reduce((s, p) => s + p[0], 0) / sbPts.length, sbPts.reduce((s, p) => s + p[1], 0) / sbPts.length];
const ngocTraiWays = els.filter((e) => e.type === 'way' && /Ngọc Trai/.test(e.tags?.name || '') && e.tags?.highway && e.geometry);
const ntPts = ngocTraiWays.flatMap((e) => e.geometry.map(P));
const ngocTrai = ntPts.length ? [ntPts.reduce((s, p) => s + p[0], 0) / ntPts.length, ntPts.reduce((s, p) => s + p[1], 0) / ntPts.length] : [30, 30];
const vinuniLake = els.find((e) => e.tags?.name === 'VinUni Lake');
const vlPts = vinuniLake ? vinuniLake.geometry.map(P) : null;
const dorm = vlPts ? [vlPts.reduce((s, p) => s + p[0], 0) / vlPts.length + 3, vlPts.reduce((s, p) => s + p[1], 0) / vlPts.length] : [40, 60];

// route: Vincom (R-02 home) -> Rainbow/Ngọc Trai residential, clean across
// the estate — "a resident orders from the retail anchor".
const src = nearestNode(vincom), dst = nearestNode(ngocTrai);
const full = dijkstra(src, dst);
if (!full) throw new Error('no route found');
const nodePt = (k) => adj.get(k).p;
// Block a whole CORRIDOR (K consecutive edges, interior nodes banned too)
// starting ~45% along the route, and require the detour to visibly leave
// the original line (max deviation ≥ 4 viewBox units ≈ 150m).
let bi = null, detour = null, corridor = null, zoneR = null;
// Block a whole ZONE: a K-edge corridor mid-journey plus every node within
// R of it, so the detour has to swing wide and the turn reads clearly.
outer: for (const R of [3.5, 2.8, 2.2]) {
  const iEnd = Math.min(full.length - 6, Math.floor(full.length * 0.7));
  for (let i = Math.floor(full.length * 0.4); i < iEnd; i++) {
    const K = 5;
    const nodes = full.slice(i, i + K + 1);
    const corridorPts = nodes.map(nodePt);
    const exclude = new Set([nodes[0], dst, ...full.slice(0, i)]);
    const bannedNodes = nodesNear(corridorPts, R, exclude);
    const bannedEdges = new Set();
    for (let j = 0; j < K; j++) bannedEdges.add(nodes[j] + '|' + nodes[j + 1]);
    const alt = dijkstra(nodes[0], dst, bannedEdges, bannedNodes);
    if (!alt || alt.length < 3) continue;
    const dev = maxDeviation(alt.slice(1, -1).map(nodePt), full.map(nodePt));
    if (dev >= Math.max(3, R)) { bi = i; detour = alt; corridor = nodes; zoneR = R; break outer; }
  }
}
if (!detour) throw new Error('no detour found');
console.log('zone radius:', zoneR);
console.log('corridor edges:', corridor.length - 1, '| detour deviation ok');
const legAPts = full.slice(0, bi + 1).map(nodePt);
const blockedPts = corridor.map(nodePt); // the whole blocked corridor
const detourPts = detour.map(nodePt);

const simplifyR = (pts) => simplify(pts, 0.05);
const sim = {
  legA: toPath(simplifyR(legAPts)),
  blocked: toPath(simplifyR(blockedPts)),
  detour: toPath(simplifyR(detourPts)),
  start: [Math.round(legAPts[0][0] * 10) / 10, Math.round(legAPts[0][1] * 10) / 10],
  // alert chip sits at the middle of the blocked corridor
  blockAt: (() => {
    const m = blockedPts[Math.floor(blockedPts.length / 2)];
    return [Math.round(m[0] * 10) / 10, Math.round(m[1] * 10) / 10];
  })(),
};

const pins = [
  ['Sao Biển subzone', '500+ shops', Math.round(saoBien[0] * 10) / 10, Math.round(saoBien[1] * 10) / 10, 'hot'],
  ['Vincom Ocean Park', 'Retail anchor', Math.round(vincom[0] * 10) / 10, Math.round(vincom[1] * 10) / 10, 'node'],
  ['VinUniversity', 'Campus depot', Math.round(vinuni[0] * 10) / 10, Math.round(vinuni[1] * 10) / 10, 'node'],
  ['Rainbow towers', 'Residential', Math.round(ngocTrai[0] * 10) / 10, Math.round(ngocTrai[1] * 10) / 10, 'node'],
  ['Dormitory', 'Student housing', Math.round(dorm[0] * 10) / 10, Math.round(dorm[1] * 10) / 10, 'node'],
];

const out = `/* GENERATED from OpenStreetMap data (Overpass API) — Vinhomes Ocean Park 1,
   Gia Lâm, Hà Nội. Map data © OpenStreetMap contributors, ODbL 1.0.
   Regenerate with scratchpad/build-map.mjs (see README). Do not hand-edit. */

export const OP_BOUNDARY = ${JSON.stringify(boundaryPath)};

export const OP_VEIL = ${JSON.stringify(veilPath)};

export const OP_WATER = ${JSON.stringify(waterPaths)};

export const OP_ROADS_MAJOR = ${JSON.stringify(tiers.major.join(' '))};

export const OP_ROADS_MINOR = ${JSON.stringify(tiers.minor.join(' '))};

export const OP_ROADS_LANE = ${JSON.stringify(tiers.lane.join(' '))};

export const OP_PINS = ${JSON.stringify(pins)};

export const OP_SIM = ${JSON.stringify(sim)};

export const OP_LAKE_LABEL = ${JSON.stringify(lakeLabel)};

export const OP_SCALE_500M = ${Math.round(scale500m * 10) / 10};
`;
fs.writeFileSync('/home/n91ym1nhky/Courses/AI20K/C2-Landing/src/map-data.js', out);
console.log('window km width:', kmWidth.toFixed(2), '| scale500m units:', scale500m.toFixed(1));
console.log('roads major/minor/lane ways:', tiers.major.length, tiers.minor.length, tiers.lane.length);
console.log('water rings:', waterPaths.length, '| lake label:', JSON.stringify(lakeLabel));
console.log('graph nodes:', adj.size, '| route nodes:', full.length, '| block at idx:', bi, '| detour nodes:', detour.length);
console.log('pins:', JSON.stringify(pins));
console.log('sim start:', sim.start, 'blockAt:', sim.blockAt);
console.log('bytes:', out.length);
