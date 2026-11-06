/* ---- Mobiel paneel ---- */
$("sheet-handle").onclick = () => {
    const c = document.querySelector("aside").classList.toggle("collapsed");
    document.body.classList.toggle("sheet-collapsed", c);
    $("sheet-ico").className = "fa-solid " + (c ? "fa-chevron-up" : "fa-chevron-down");
    $("sheet-label").textContent = c ? "Paneel openen" : "Paneel";
    setTimeout(() => map.invalidateSize(), 300);
};
if (window.matchMedia("(max-width:767px)").matches) $("sheet-handle").click();

function checkVictory(lastWinner) {
    const remainingClubs = activeRealClubs();
    const remainingNeutral = activeNeutralZones();
    if (remainingClubs.length === 1 && remainingNeutral.length === 0) {
        state.over = true;
        addLog(`🏆 <b>${esc(lastWinner.name)}</b> HEEFT DE HELE KAART VEROVERD!`);
        updateUI();
    }
}

/* ============================================================================
   8. UI, MODAL & INSPECTOR UPDATES
   ============================================================================ */
function openModal() {
    if (!state.attacker || !state.defender) return;
    const att = byId(state.attacker);
    const def = byId(state.defender);
    if (!att || !def) return;

    const attTerr = members(att.id).length;
    const defTerr = members(def.id).length;

    $("modal-att-dot").style.backgroundColor = att.color;
    $("modal-att-name").textContent = att.name;
    $("modal-att-meta").textContent = clubInfo(att, " \u2022 ") + `${attTerr} Regio${attTerr > 1 ? "'s" : ""} • +${att.upgrades} Upgrades`;

    $("modal-def-dot").style.backgroundColor = def.isNeutral ? "#10b981" : def.color;
    $("modal-def-name").textContent = def.name;

    if (def.isNeutral) {
        $("modal-badge").innerHTML = `<i class="fa-solid fa-gift"></i> Lege Regio Geloott!`;
        $("modal-title").textContent = "FREE SQUAD UPGRADE!";
        $("modal-subtitle").textContent = `${att.name} hoeft geen wedstrijd te spelen en mag direct een speler upgraden!`;
        $("modal-def-role").textContent = "Neutrale Regio";
        $("modal-def-role").className = "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500 text-slate-950 mb-1.5";
        $("modal-def-meta").textContent = "Geen Club • Gratis Overname";

        $("modal-club-buttons").classList.add("hidden");
        $("modal-neutral-buttons").classList.remove("hidden");
        $("btn-modal-neutral-label").textContent = `${att.name}: Claim Regio + Upgrade!`;
    } else {
        $("modal-badge").innerHTML = `<i class="fa-solid fa-fire"></i> EA FC 26 Matchup`;
        $("modal-title").textContent = "BATTLE!";
        $("modal-subtitle").textContent = "Speel of simuleer de wedstrijd en klik op de winnende club:";
        $("modal-def-role").textContent = "Verdediger";
        $("modal-def-role").className = "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500 text-white mb-1.5";
        $("modal-def-meta").textContent = clubInfo(def, " \u2022 ") + `${defTerr} Regio${defTerr > 1 ? "'s" : ""} • +${def.upgrades} Upgrades`;

        $("modal-club-buttons").classList.remove("hidden");
        $("modal-neutral-buttons").classList.add("hidden");

        // Namen + reeds ingevulde score uit het kleine paneel overnemen
        setScoreNames("md", att.name, def.name);
        $("md-att-goals").value = $("in-att-goals").value;
        $("md-def-goals").value = $("in-def-goals").value;
        hideScorePen("md");
    }

    $("battle-modal").classList.remove("hidden");
    $("battle-modal").classList.add("flex");
}

function closeModal() {
    $("battle-modal").classList.add("hidden");
    $("battle-modal").classList.remove("flex");
}

function updateUI() {
    const realActive = activeRealClubs();
    const totalReal = TEAMS.filter(t => !t.isNeutral).length;
    const neutralLeft = activeNeutralZones().length;

    $("stat-clubs").textContent = `${realActive.length} / ${totalReal}`;
    $("stat-neutral").textContent = `${neutralLeft}`;
    $("stat-turn").textContent = `#${state.turn}`;

    $("btn-roll-att").disabled = state.over || realActive.length < 1;
    $("btn-roll-def").disabled = !state.attacker || !!state.defender || state.over;
    $("btn-resolve").disabled = !state.attacker || !state.defender || state.over;

    if (state.over && realActive.length >= 1) {
        $("status-message").classList.remove("hidden");
        $("vs-cards").classList.add("hidden");
        $("status-message").innerHTML = `👑 <b class="text-amber-400">${esc(realActive[0].name)}</b> heerst over de volledige kaart!`;
    } else if (!state.attacker) {
        $("status-message").classList.remove("hidden");
        $("vs-cards").classList.add("hidden");
        $("status-message").innerHTML = `Klik op <b class="text-amber-400">1. Roll Attacker</b> of klik een club op de kaart aan.`;
    } else {
        $("status-message").classList.add("hidden");
        $("vs-cards").classList.remove("hidden");

        const att = byId(state.attacker);
        const attCount = members(att.id).length;
        $("card-att-name").textContent = att.name;
        $("card-att-info").textContent = clubInfo(att);
        $("card-att-stats").textContent = `${attCount} regio${attCount > 1 ? "'s" : ""} • ★${att.upgrades}`;

        if (!state.defender) {
            $("card-def-wrap").classList.add("opacity-50");
            $("card-def-name").textContent = "Klik op 2. Roll Defender...";
            $("card-def-stats").textContent = "-";
            $("card-def-info").textContent = "";
            $("inline-battle-actions").classList.add("hidden");
            $("inline-upgrade-actions").classList.add("hidden");
            $("btn-resolve-text").textContent = "3. Start Battle / Claim";
        } else {
            const def = byId(state.defender);
            const defCount = members(def.id).length;
            $("card-def-wrap").classList.remove("opacity-50");
            $("card-def-name").textContent = def.name;
            $("card-def-info").textContent = clubInfo(def);

            if (def.isNeutral) {
                $("card-def-badge").textContent = "FREE";
                $("card-def-badge").className = "px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] uppercase";
                $("card-def-stats").textContent = "+3 Upgrades";
                $("inline-battle-actions").classList.add("hidden");
                $("inline-upgrade-actions").classList.remove("hidden");
                $("btn-inline-upgrade-text").textContent = `${att.name}: Claim +1 Upgrade!`;
                $("btn-resolve-text").textContent = `3. Claim Upgrade (${att.name})`;
            } else {
                $("card-def-badge").textContent = "DEF";
                $("card-def-badge").className = "px-1.5 py-0.5 rounded bg-orange-500 text-white font-black text-[10px] uppercase";
                $("card-def-stats").textContent = `${defCount} regio${defCount > 1 ? "'s" : ""} • ★${def.upgrades}`;
                $("inline-upgrade-actions").classList.add("hidden");
                $("inline-battle-actions").classList.remove("hidden");

                const scoreKey = att.id + "|" + def.id;
                if (scoreKey !== lastScoreKey) { lastScoreKey = scoreKey; resetScoreBoxes(); }
                setScoreNames("in", att.name, def.name);
                $("btn-resolve-text").textContent = "3. Open Battle Scherm";
            }
        }
    }

    const ub = $("btn-undo");
    if (ub) ub.disabled = !BACKUPS.some(b => b.kind === "match");

    renderLeaderboard();
}

function renderLeaderboard() {
    const container = $("tab-leaders");
    const rankings = activeRealClubs()
        .map(club => ({
            ...club,
            territories: members(club.id).length
        }))
        .sort((a, b) => b.territories - a.territories || b.upgrades - a.upgrades || b.wins - a.wins);

    container.innerHTML = rankings
        .slice(0, 30)
        .map((club, idx) => {
            const medal =
                idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `<span class="text-slate-500">#${idx + 1}</span>`;
            return `
    <div onclick="focusClub('${club.id}')" class="flex items-center justify-between bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 rounded-lg px-2.5 py-1.5 cursor-pointer transition">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs font-bold w-5 text-center">${medal}</span>
        <span class="w-3 h-3 rounded-full shrink-0 border border-white/60" style="background:${club.color}"></span>
        <span class="text-xs font-bold text-slate-100 truncate">${esc(club.name)}</span>
      </div>
      <div class="flex items-center gap-2 text-[11px] font-semibold shrink-0">
        <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title="Squad Upgrades">★${club.upgrades}</span>
        <span class="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">${club.territories} regio's</span>
      </div>
    </div>
  `;
        })
        .join("");
}

window.focusClub = function (clubId) {
    const b = boundsOf(clubId);
    if (b.isValid()) {
        map.flyToBounds(b, { maxZoom: 7.5, duration: 0.7 });
    }
    openInspector(clubId);
};

function openInspector(ownerId) {
    const owner = byId(ownerId);
    if (!owner) return;
    inspectedOwnerId = ownerId;
    const count = members(ownerId).length;

    $("inspector-card").classList.remove("hidden");
    $("insp-dot").style.backgroundColor = owner.isNeutral ? "#10b981" : owner.color;
    $("insp-name").textContent = owner.name;

    if (owner.isNeutral) {
        $("insp-details").innerHTML = `
  <div class="text-emerald-400 font-semibold">Lege Neutrale Regio</div>
  <div>Val deze regio aan voor <b>+3 Squad Upgrades</b> zonder wedstrijd!</div>
`;
        $("btn-force-att").classList.add("hidden");
    } else {
        $("insp-details").innerHTML = `
  <div>Regio's in bezit: <b class="text-white">${count}</b></div>
  <div>Squad Upgrades: <b class="text-emerald-400">+${owner.upgrades}</b> • Gewonnen Battles: <b class="text-amber-400">${owner.wins}</b></div>
`;
        $("btn-force-att").classList.remove("hidden");
    }
}

function addLog(html) {
    LOG.unshift(html);
    if (LOG.length > 500) LOG.pop();
    saveGame();
    const logBox = $("tab-log");
    if (logBox.querySelector(".italic")) logBox.innerHTML = "";
    const item = document.createElement("div");
    item.className = "bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 leading-snug";
    item.innerHTML = html;
    logBox.prepend(item);
}
