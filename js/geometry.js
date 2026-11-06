/* ============================================================================
   5. VORONOI GEOMETRY + REAL COUNTRY LANDMASS CLIPPING
   ============================================================================ */
function buildGeometry() {
    cells = new Map();
    adj = new Map();
    empireCache = new Map();

    const pts = turf.featureCollection(
        TEAMS.map(t => turf.point([t.lng, t.lat], { id: t.id }))
    );

    const lngs = TEAMS.map(t => t.lng);
    const lats = TEAMS.map(t => t.lat);
    const latPad = Math.max(0.45, (Math.max(...lats) - Math.min(...lats)) * 0.14);
    const lngPad = Math.max(0.65, (Math.max(...lngs) - Math.min(...lngs)) * 0.14);

    const bbox = [
        Math.max(-179, Math.min(...lngs) - lngPad),
        Math.max(-85, Math.min(...lats) - latPad),
        Math.min(179, Math.max(...lngs) + lngPad),
        Math.min(85, Math.max(...lats) + latPad)
    ];

    const vor = turf.voronoi(pts, { bbox });
    const rawCells = new Map();

    vor.features.forEach((f, i) => {
        if (f && f.geometry) {
            rawCells.set(TEAMS[i].id, f);
        }
    });

    // Compute adjacency BEFORE landmass clipping so coastal/island neighbors can still attack across channels
    const vertexOwners = new Map();
    for (const [id, f] of rawCells) {
        const ring = f.geometry.coordinates[0] || [];
        for (const [x, y] of ring) {
            const k = x.toFixed(4) + "," + y.toFixed(4);
            if (!vertexOwners.has(k)) vertexOwners.set(k, new Set());
            vertexOwners.get(k).add(id);
        }
    }

    const shared = new Map();
    for (const ids of vertexOwners.values()) {
        const arr = [...ids];
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                const k = arr[i] < arr[j] ? arr[i] + "|" + arr[j] : arr[j] + "|" + arr[i];
                shared.set(k, (shared.get(k) || 0) + 1);
            }
        }
    }

    TEAMS.forEach(t => adj.set(t.id, new Set()));
    for (const [k, count] of shared) {
        if (count < 2) continue;
        const [a, b] = k.split("|");
        adj.get(a).add(b);
        adj.get(b).add(a);
    }

    // Clip Voronoi cells to real landmass borders if enabled & loaded
    for (const [id, rawCell] of rawCells) {
        if (state.enableClip && landmassGeoJSON) {
            const clipped = clipCellToLandmass(rawCell);
            cells.set(id, clipped || rawCell);
        } else {
            cells.set(id, rawCell);
        }
    }
}

function clipCellToLandmass(cell) {
    if (!landmassGeoJSON || !landmassGeoJSON.features) return cell;
    try {
        const cellBbox = turf.bbox(cell);
        const overlappingPieces = [];

        for (const country of landmassGeoJSON.features) {
            if (!country.geometry) continue;
            const cBbox = country._bbox || (country._bbox = turf.bbox(country));
            // Fast AABB bounding box rejection
            if (
                cBbox[2] < cellBbox[0] ||
                cBbox[0] > cellBbox[2] ||
                cBbox[3] < cellBbox[1] ||
                cBbox[1] > cellBbox[3]
            ) {
                continue;
            }
            try {
                const inter = turf.intersect(cell, country);
                if (inter) overlappingPieces.push(inter);
            } catch (err) { }
        }

        if (overlappingPieces.length === 0) return cell;
        let combined = overlappingPieces[0];
        for (let i = 1; i < overlappingPieces.length; i++) {
            try {
                const u = turf.union(combined, overlappingPieces[i]);
                if (u) combined = u;
            } catch (e) { }
        }
        return combined;
    } catch (e) {
        return cell;
    }
}

/** Merge all territories belonging to one ownerId into seamless empire polygons */
function empireShape(ownerId) {
    const memIds = members(ownerId).map(t => t.id);
    const cacheKey = `${ownerId}:${state.enableClip}:${memIds.join(",")}`;
    if (empireCache.has(cacheKey)) return empireCache.get(cacheKey);

    let merged = null;
    const extras = [];
    for (const id of memIds) {
        const cell = cells.get(id);
        if (!cell) continue;
        if (!merged) {
            merged = cell;
            continue;
        }
        try {
            const u = turf.union(merged, cell);
            if (u) merged = u;
            else extras.push(cell);
        } catch (e) {
            extras.push(cell);
        }
    }
    const result = merged ? [merged, ...extras] : extras;
    empireCache.set(cacheKey, result);
    return result;
}
