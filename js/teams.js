/* ============================================================================
   4. NORMALIZATION & PROCEDURAL NEUTRAL ZONES ("EMPTY REGIONS")
   ============================================================================ */
const hashColor = s => {
    let h = 0;
    for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h}, 68%, 50%)`;
};

function normalizeAndGenerateTeams(rawList) {
    const seenId = new Set();
    const seenPos = new Map();
    const realOut = [];

    for (const raw of rawList) {
        const t = Array.isArray(raw)
            ? { id: raw[0], name: raw[1], lat: raw[2], lng: raw[3], color: raw[4] }
            : { ...raw };

        t.lat = Number(t.lat);
        t.lng = Number(t.lng);
        if (!t.id || !t.name || !isFinite(t.lat) || !isFinite(t.lng) || seenId.has(t.id)) continue;
        seenId.add(t.id);

        // Nudge stadium-sharing clubs (e.g., Club Brugge & Cercle, Inter & Milan) slightly in a circle
        const posKey = t.lat.toFixed(4) + "," + t.lng.toFixed(4);
        const dupIdx = seenPos.get(posKey) || 0;
        seenPos.set(posKey, dupIdx + 1);
        if (dupIdx > 0) {
            const angle = dupIdx * 2.4;
            t.lat += Math.cos(angle) * 0.008 * dupIdx;
            t.lng += Math.sin(angle) * 0.011 * dupIdx;
        }

        t.color = t.color || hashColor(t.id);
        t.isActive = true;
        t.isNeutral = false;
        t.ownerId = t.id;
        t.upgrades = 0;
        t.wins = 0;
        realOut.push(t);
    }

    // Vrije gebieden: elk land dat vrije ruimte heeft krijgt zijn eigen gebied = zijn eigen upgrade
    const neutralOut = [];
    if (state.enableNeutral && realOut.length >= 3) {
        const lats = realOut.map(t => t.lat);
        const lngs = realOut.map(t => t.lng);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
        const latSpan = Math.max(0.8, maxLat - minLat);
        const lngSpan = Math.max(1.0, maxLng - minLng);
        const hasLand = state.enableClip && landmassGeoJSON && landmassGeoJSON.features;

        const perCountry = new Map();          // landnaam -> aantal vrije gebieden
        const clubCountries = new Set();       // landen waar al een club staat
        if (hasLand) {
            for (const club of realOut) {
                const c = countryAt(club.lng, club.lat);
                club.country = c ? countryName(c) : null;
                if (club.country) clubCountries.add(club.country);
            }
        }
        const addNeutral = (lat, lng, country) => {
            const nid = `neutral_${neutralOut.length + 1}`;
            let name = `Neutrale Regio #${neutralOut.length + 1}`;
            if (country) {
                const k = (perCountry.get(country) || 0) + 1;
                perCountry.set(country, k);
                name = k === 1 ? `Vrij gebied ${country}` : `Vrij gebied ${country} #${k}`;
            }
            neutralOut.push({
                id: nid,
                name,
                country: country || null,
                lat: Number(lat.toFixed(4)),
                lng: Number(lng.toFixed(4)),
                color: "#334155",
                isActive: true,
                isNeutral: true,
                ownerId: nid,
                upgrades: 0,
                wins: 0
            });
        };

        // A) Elk land zonder club binnen het speelgebied krijgt gegarandeerd 1 vrij gebied
        if (hasLand) {
            const bb = [minLng - lngSpan * 0.06, minLat - latSpan * 0.06, maxLng + lngSpan * 0.06, maxLat + latSpan * 0.06];
            for (const feat of landmassGeoJSON.features) {
                if (!feat.geometry) continue;
                const name = countryName(feat);
                if (!name || name === "Antarctica" || clubCountries.has(name)) continue;
                let pt;
                try { pt = turf.pointOnFeature(feat).geometry.coordinates; } catch (e) { continue; }
                if (pt[0] < bb[0] || pt[0] > bb[2] || pt[1] < bb[1] || pt[1] > bb[3]) continue;
                addNeutral(pt[1], pt[0], name);
            }
        }

        // B) Rasterpunten in lege ruimte (ook binnen landen met clubs), elk met de naam van het land
        const rows = realOut.length <= 25 ? 5 : 7;
        const cols = realOut.length <= 25 ? 6 : 8;
        const minDistDeg = Math.hypot(latSpan / (rows * 1.65), lngSpan / (cols * 1.65));
        const pointsSoFar = () => [...realOut, ...neutralOut];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const candLat = (minLat - latSpan * 0.06) + ((r + 0.5) / rows) * (latSpan * 1.12);
                const candLng = (minLng - lngSpan * 0.06) + ((c + 0.5) / cols) * (lngSpan * 1.12);

                let tooClose = false;
                for (const club of pointsSoFar()) {
                    const d = Math.hypot(club.lat - candLat, (club.lng - candLng) * Math.cos(candLat * Math.PI / 180));
                    if (d < minDistDeg * 0.72) { tooClose = true; break; }
                }
                if (tooClose) continue;

                let country = null;
                if (hasLand) {
                    const cf = countryAt(candLng, candLat);
                    if (!cf) continue;                       // zee overslaan
                    country = countryName(cf);
                }
                addNeutral(candLat, candLng, country);
            }
        }
    }

    return [...realOut, ...neutralOut];
}

/** "Land \u00b7 Competitie" van een club (om hem sneller te vinden in FIFA). */
function clubInfo(c, suffix = "") {
    if (!c) return "";
    if (c.country === undefined && landmassGeoJSON && !c.isNeutral) {
        const f = countryAt(c.lng, c.lat);
        c.country = f ? countryName(f) : null;
    }
    const txt = [c.country, c.isNeutral ? null : c.leagueName].filter(Boolean).join(" \u00b7 ");
    return txt ? txt + suffix : "";
}

function countryName(feat) {
    const p = feat.properties || {};
    return p.NAME_NL || p.NAME || p.ADMIN || p.name || null;
}

/** Geeft de landfeature terug waarin dit punt ligt (of null op zee). */
function countryAt(lng, lat) {
    if (!landmassGeoJSON || !landmassGeoJSON.features) return null;
    const pt = turf.point([lng, lat]);
    for (const feat of landmassGeoJSON.features) {
        if (!feat.geometry) continue;
        const bb = feat._bbox || (feat._bbox = turf.bbox(feat));
        if (lng < bb[0] || lng > bb[2] || lat < bb[1] || lat > bb[3]) continue;
        try { if (turf.booleanPointInPolygon(pt, feat)) return feat; } catch (e) { }
    }
    return null;
}

function isPointOnLand(lng, lat) {
    if (!landmassGeoJSON || !landmassGeoJSON.features) return true;
    const pt = turf.point([lng, lat]);
    for (const feat of landmassGeoJSON.features) {
        if (!feat.geometry) continue;
        try {
            if (turf.booleanPointInPolygon(pt, feat)) return true;
        } catch (e) { }
    }
    return false;
}
