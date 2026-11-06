/* ============================================================================
   7. GAMEPLAY MECHANICS: ROLL ATTACKER, ROLL DEFENDER, BATTLE & UPGRADES
   ============================================================================ */
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

/** Returns all active empire ownerIds that share a Voronoi border with ownerId */
function getNeighborOwners(ownerId) {
    const neighbors = new Set();
    for (const m of members(ownerId)) {
        for (const nid of adj.get(m.id) || []) {
            const neighborOwner = byId(nid)?.ownerId;
            if (neighborOwner && neighborOwner !== ownerId) {
                neighbors.add(neighborOwner);
            }
        }
    }

    // Fallback if island club has no remaining connected edges: pick geographically closest active empire
    if (neighbors.size === 0) {
        const myClub = byId(ownerId);
        let closestId = null;
        let bestDist = Infinity;
        for (const t of TEAMS) {
            if (t.ownerId === ownerId) continue;
            const d = Math.hypot(t.lat - myClub.lat, t.lng - myClub.lng);
            if (d < bestDist) {
                bestDist = d;
                closestId = t.ownerId;
            }
        }
        if (closestId) neighbors.add(closestId);
    }

    return [...neighbors];
}

function rollAttacker() {
    const clubs = activeRealClubs();
    if (clubs.length < 2 || state.isSpinning) return;

    state.isSpinning = true;
    state.defender = null;
    let ticks = 0;
    const totalTicks = 10;

    const timer = setInterval(() => {
        const temp = pickRandom(clubs);
        $("status-message").innerHTML = `<span class="text-amber-400 font-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Kiest aanvaller: ${esc(temp.name)}...</span>`;
        ticks++;
        if (ticks >= totalTicks) {
            clearInterval(timer);
            state.isSpinning = false;
            state.attacker = temp.id;
            render();
            map.flyToBounds(boundsOf(state.attacker), { maxZoom: 7.5, padding: [50, 50], duration: 0.75 });
        }
    }, 55);
}

/** Kompas-hoek (graden, 0 = noord, kloksgewijs) van de ene regio naar de andere, zoals op het scherm. */
function bearingOwners(aOwner, bOwner) {
    let best = null;
    for (const a of members(aOwner)) {
        for (const b of members(bOwner)) {
            const d = Math.hypot(a.lat - b.lat, (a.lng - b.lng) * Math.cos(a.lat * Math.PI / 180));
            if (!best || d < best.d) best = { d, a, b };
        }
    }
    if (!best) return 0;
    const pa = L.CRS.EPSG3857.project(L.latLng(best.a.lat, best.a.lng));
    const pb = L.CRS.EPSG3857.project(L.latLng(best.b.lat, best.b.lng));
    return (Math.atan2(pb.x - pa.x, pb.y - pa.y) * 180 / Math.PI + 360) % 360;
}

function buildCompassFace() {
    let g = `<circle cx="100" cy="100" r="94" fill="#0b1220" stroke="#fbbf24" stroke-width="3"/>
             <circle cx="100" cy="100" r="80" fill="none" stroke="#334155" stroke-width="1"/>`;
    for (let a = 0; a < 360; a += 15) {
        const major = a % 90 === 0;
        const r1 = major ? 80 : 86, r2 = 92;
        const rad = a * Math.PI / 180;
        g += `<line x1="${100 + Math.sin(rad) * r1}" y1="${100 - Math.cos(rad) * r1}" x2="${100 + Math.sin(rad) * r2}" y2="${100 - Math.cos(rad) * r2}" stroke="${major ? "#fbbf24" : "#64748b"}" stroke-width="${major ? 2.5 : 1.2}"/>`;
    }
    g += `<text x="100" y="34" text-anchor="middle" fill="#ef4444" font-size="16" font-weight="800" font-family="Rajdhani, sans-serif">N</text>
          <text x="172" y="106" text-anchor="middle" fill="#e2e8f0" font-size="14" font-weight="700" font-family="Rajdhani, sans-serif">O</text>
          <text x="100" y="180" text-anchor="middle" fill="#e2e8f0" font-size="14" font-weight="700" font-family="Rajdhani, sans-serif">Z</text>
          <text x="28" y="106" text-anchor="middle" fill="#e2e8f0" font-size="14" font-weight="700" font-family="Rajdhani, sans-serif">W</text>`;
    $("compass-face").innerHTML = g;
}

function spinCompass(targetDeg, attackerName, chosenName, done) {
    const overlay = $("compass-overlay");
    const needle = $("compass-needle");
    const label = $("compass-label");
    label.innerHTML = `<i class="fa-solid fa-compass fa-spin mr-1"></i>Kompas zoekt een tegenstander voor ${esc(attackerName)}...`;
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    // Startpositie zonder animatie, dan een paar volle rondjes en afremmen op de juiste hoek
    needle.style.transition = "none";
    needle.style.transform = `rotate(${compassAngle}deg)`;
    void needle.getBoundingClientRect();
    const delta = (((targetDeg - compassAngle) % 360) + 360) % 360;
    const finalAngle = compassAngle + 360 * 2 + delta;
    needle.style.transition = "transform 1.3s cubic-bezier(0.15, 0.8, 0.25, 1)";
    needle.style.transform = `rotate(${finalAngle}deg)`;
    compassAngle = finalAngle;

    setTimeout(() => {
        label.innerHTML = `<i class="fa-solid fa-location-arrow mr-1"></i>Tegenstander: <span class="text-white">${esc(chosenName)}</span>`;
    }, 1350);
    setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.classList.remove("flex");
        done();
    }, 1950);
}

function rollDefender() {
    if (!state.attacker || state.isSpinning) return;
    const options = getNeighborOwners(state.attacker);
    if (!options.length) {
        $("status-message").textContent = "Geen aangrenzend gebied gevonden. Kies een nieuwe aanvaller.";
        return;
    }

    const chosenId = pickRandom(options);
    const chosen = byId(chosenId);
    const att = byId(state.attacker);
    const target = bearingOwners(state.attacker, chosenId);

    state.isSpinning = true;
    $("card-def-name").textContent = "...";
    $("status-message").innerHTML = `<span class="text-amber-400 font-bold"><i class="fa-solid fa-compass fa-spin mr-1"></i>Kompas draait...</span>`;

    spinCompass(target, att ? att.name : "", chosen ? chosen.name : "?", () => {
        state.isSpinning = false;
        state.defender = chosenId;
        render();
        map.flyToBounds(boundsOf(state.attacker, state.defender), {
            maxZoom: 7.5,
            padding: [70, 70],
            duration: 0.85
        });
    });
}

function annexTerritory(winnerId, loserId) {
    for (const t of TEAMS) {
        if (t.ownerId === loserId) {
            t.ownerId = winnerId;
        }
    }
    const loser = byId(loserId);
    if (loser) loser.isActive = false;

    empireCache.clear();
    state.attacker = null;
    state.defender = null;
    state.turn++;
    render();
}

function resolveBattle(attackerWon, score) {
    if (!state.attacker || !state.defender) return;
    const att = byId(state.attacker);
    const def = byId(state.defender);
    if (!att || !def) return;

    // Case 1: Neutral Zone Annexation -> Free Squad Upgrade
    if (def.isNeutral) {
        makeBackup(`Voor ronde ${state.turn}: ${att.name} claimt ${def.name}`);
        att.upgrades = (att.upgrades || 0) + 3;
        if (state.events) state.events.push({ r: state.turn, k: "n", att: att.id, def: def.id });
        addLog(
            `Ronde ${state.turn}: <b class="text-amber-300">${esc(att.name)}</b> nam <span class="text-emerald-400">${esc(def.name)}</span> in en kreeg een <b>+3 Squad Upgrades</b>!`
        );
        annexTerritory(att.id, def.id);
        closeModal();
        checkVictory(att);
        return;
    }

    // Case 2: Real Club vs Real Club Battle -> eerst de speler-transfer noteren
    const winner = attackerWon ? att : def;
    const loser = attackerWon ? def : att;
    pendingTransfer = { winnerId: winner.id, loserId: loser.id, attackerWon, score: score || null, attId: state.attacker, defId: state.defender };
    completeBattle(null, "");
}
