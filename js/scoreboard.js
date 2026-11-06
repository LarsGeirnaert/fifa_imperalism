/* ============================================================================
   SCORE INVOEREN + STATISTIEKEN
   ============================================================================ */
let lastScoreKey = null;

function scoreBoxHTML(p) {
    const inp = "w-14 text-center rounded-lg bg-slate-950 border border-slate-600 py-2 font-broadcast text-2xl font-extrabold text-white focus:outline-none focus:border-amber-400";
    return `
        <div class="flex items-center justify-center gap-2">
            <div id="${p}-att-name" class="flex-1 min-w-0 text-right text-xs font-bold text-amber-300 truncate">-</div>
            <input id="${p}-att-goals" type="number" inputmode="numeric" min="0" max="99" placeholder="0" class="${inp}">
            <span class="font-broadcast text-xl font-black text-slate-500">-</span>
            <input id="${p}-def-goals" type="number" inputmode="numeric" min="0" max="99" placeholder="0" class="${inp}">
            <div id="${p}-def-name" class="flex-1 min-w-0 text-left text-xs font-bold text-orange-300 truncate">-</div>
        </div>
        <div id="${p}-pen" class="hidden mt-2">
            <div class="text-[10px] uppercase tracking-wider text-center text-slate-400 font-bold mb-1">Gelijkspel \u2014 wie won na strafschoppen?</div>
            <div class="grid grid-cols-2 gap-2">
                <button id="${p}-pen-att" class="py-2 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs truncate">-</button>
                <button id="${p}-pen-def" class="py-2 px-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs truncate">-</button>
            </div>
        </div>
        <div id="${p}-err" class="hidden mt-1.5 text-[11px] text-red-400 text-center font-semibold"></div>
        <button id="${p}-confirm" class="mt-2 w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow transition flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-check"></i>Bevestig score
        </button>`;
}

function parseGoals(v) {
    const t = String(v).trim();
    return /^\d{1,2}$/.test(t) ? Number(t) : null;
}

function setScoreNames(p, attName, defName) {
    $(p + "-att-name").textContent = attName;
    $(p + "-def-name").textContent = defName;
    $(p + "-pen-att").textContent = attName;
    $(p + "-pen-def").textContent = defName;
}

function hideScorePen(p) {
    $(p + "-pen").classList.add("hidden");
    $(p + "-err").classList.add("hidden");
}

function resetScoreBoxes() {
    for (const p of ["in", "md"]) {
        $(p + "-att-goals").value = "";
        $(p + "-def-goals").value = "";
        hideScorePen(p);
    }
}

function submitScore(p, pen) {
    if (!state.attacker || !state.defender) return;
    const a = parseGoals($(p + "-att-goals").value);
    const d = parseGoals($(p + "-def-goals").value);
    const err = $(p + "-err");
    if (a === null || d === null) {
        err.textContent = "Vul bij beide clubs de doelpunten in (0 t/m 99).";
        err.classList.remove("hidden");
        return;
    }
    if (a === d && !pen) {
        err.classList.add("hidden");
        $(p + "-pen").classList.remove("hidden");
        return;
    }
    const attackerWon = a > d || (a === d && pen === "att");
    const score = { att: a, def: d, pens: a === d ? pen : null };
    hideScorePen(p);
    resolveBattle(attackerWon, score);
}

function wireScoreBox(p) {
    const box = p === "in" ? $("inline-score-box") : $("modal-score-box");
    box.innerHTML = scoreBoxHTML(p);
    $(p + "-confirm").onclick = () => submitScore(p);
    $(p + "-pen-att").onclick = () => submitScore(p, "att");
    $(p + "-pen-def").onclick = () => submitScore(p, "def");
    for (const id of [p + "-att-goals", p + "-def-goals"]) {
        $(id).oninput = () => hideScorePen(p);
        $(id).onkeydown = e => { if (e.key === "Enter") $(p + "-confirm").click(); };
    }
}

function scoreText(m) {
    const sc = m.score || m;
    const a = sc.att !== undefined ? sc.att : sc.a;
    const d = sc.def !== undefined ? sc.def : sc.d;
    const attName = (byId(m.attId) || {}).name || m.attName || "?";
    const defName = (byId(m.defId) || {}).name || m.defName || "?";
    let t = `${attName} ${a}-${d} ${defName}`;
    if (sc.pens) t += ` (str. ${sc.pens === "att" ? attName : defName})`;
    return t;
}

function renderStats() {
    const box = $("tab-stats");
    if (!box) return;
    const ms = state.matches || [];
    if (!ms.length) {
        box.innerHTML = `<div class="text-slate-500 italic text-center py-6">Nog geen scores ingevuld. Na elke wedstrijd vul je de score in en verschijnen hier de statistieken.</div>`;
        return;
    }
    const goals = ms.reduce((n, m) => n + m.a + m.d, 0);
    const attWins = ms.filter(m => m.winnerId === m.attId).length;
    const pens = ms.filter(m => m.pens).length;
    const clubs = new Map();
    const get = (id, name) => {
        if (!clubs.has(id)) clubs.set(id, { name, g: 0, w: 0, v: 0, gv: 0, gt: 0 });
        return clubs.get(id);
    };
    for (const m of ms) {
        const A = get(m.attId, m.attName), D = get(m.defId, m.defName);
        A.g++; D.g++;
        A.gv += m.a; A.gt += m.d;
        D.gv += m.d; D.gt += m.a;
        if (m.winnerId === m.attId) { A.w++; D.v++; } else { D.w++; A.v++; }
    }
    const rows = [...clubs.values()].sort((x, y) => y.w - x.w || (y.gv - y.gt) - (x.gv - x.gt) || y.gv - x.gv);
    const card = (label, val) => `<div class="bg-slate-950/70 border border-slate-800 rounded-lg py-1.5 px-1 text-center"><div class="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">${label}</div><div class="font-broadcast text-lg font-bold text-sky-400">${val}</div></div>`;
    const margin = m => Math.abs(m.a - m.d);
    const topWins = [...ms].sort((x, y) => margin(y) - margin(x) || (y.a + y.d) - (x.a + x.d)).slice(0, 3);
    const topGoals = [...ms].sort((x, y) => (y.a + y.d) - (x.a + x.d)).slice(0, 3);
    const line = m => `<div class="flex justify-between gap-2 py-0.5"><span class="truncate">${esc(scoreText(m))}</span><span class="text-slate-500 whitespace-nowrap">R${m.round}</span></div>`;

    let html = `<div class="grid grid-cols-4 gap-1.5">
        ${card("Wedstr.", ms.length)}${card("Goals", goals)}${card("Gem.", (goals / ms.length).toFixed(1))}${card("Att wint", Math.round(attWins / ms.length * 100) + "%")}
    </div>`;
    if (pens) html += `<div class="text-[10px] text-slate-500 text-center">${pens} wedstrijd${pens > 1 ? "en" : ""} beslist op strafschoppen (telt als winst)</div>`;

    html += `<div class="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
        <div class="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-2 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
            <span>Club</span><span class="text-right">G</span><span class="text-right">W</span><span class="text-right">V</span><span class="text-right">+/-</span><span class="text-right">DS</span>
        </div>`;
    for (const r of rows) {
        const gd = r.gv - r.gt;
        html += `<div class="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-2 px-2 py-1 border-b border-slate-800/60 last:border-0 text-slate-200">
            <span class="truncate font-semibold">${esc(r.name)}</span>
            <span class="text-right text-slate-400">${r.g}</span>
            <span class="text-right text-emerald-400 font-bold">${r.w}</span>
            <span class="text-right text-red-400">${r.v}</span>
            <span class="text-right text-slate-300">${r.gv}-${r.gt}</span>
            <span class="text-right ${gd >= 0 ? "text-emerald-300" : "text-red-300"}">${gd > 0 ? "+" : ""}${gd}</span>
        </div>`;
    }
    html += `</div>
        <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-2"><div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Grootste overwinningen</div>${topWins.map(line).join("")}</div>
        <div class="bg-slate-950/60 border border-slate-800 rounded-lg p-2"><div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Meeste doelpunten</div>${topGoals.map(line).join("")}</div>
        <button id="btn-export-matches" class="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"><i class="fa-solid fa-file-csv"></i>Exporteer wedstrijden (CSV)</button>`;
    box.innerHTML = html;
    $("btn-export-matches").onclick = exportMatchesCSV;
}

function exportMatchesCSV() {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const lines = ["ronde,aanvaller,doelpunten_aanvaller,doelpunten_verdediger,verdediger,strafschoppen_winnaar,winnaar"];
    for (const m of state.matches) {
        const w = m.winnerId === m.attId ? m.attName : m.defName;
        const pw = m.pens ? (m.pens === "att" ? m.attName : m.defName) : "";
        lines.push([m.round, q(m.attName), m.a, m.d, q(m.defName), q(pw), q(w)].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fc26_imperialism_wedstrijden.csv";
    a.click();
    URL.revokeObjectURL(url);
}

/* ---- Speler-transfers ---- */
function openTransferModal(winner, loser, attackerWon, score) {
    pendingTransfer = { winnerId: winner.id, loserId: loser.id, attackerWon, score, attId: state.attacker, defId: state.defender };
    const scTxt = score ? ` (${scoreText(pendingTransfer)})` : "";
    $("tr-title").textContent = `${winner.name} wint van ${loser.name}`;
    $("tr-sub").textContent = `${scTxt ? scTxt.trim() + " " : ""}${winner.name} neemt een speler mee van ${loser.name}. Noteer hem nu, dan vergeet je het niet.`;
    $("tr-label").textContent = `Speler van ${loser.name}`;
    $("tr-list").innerHTML = state.players
        .filter(p => p.currentId === loser.id)
        .map(p => `<option value="${esc(p.name)}"></option>`).join("");
    $("tr-name").value = "";
    $("tr-note").value = "";
    $("tr-err").classList.add("hidden");
    $("transfer-modal").classList.remove("hidden");
    $("transfer-modal").classList.add("flex");
    setTimeout(() => $("tr-name").focus(), 60);
}

function closeTransferModal() {
    $("transfer-modal").classList.add("hidden");
    $("transfer-modal").classList.remove("flex");
    pendingTransfer = null;
}

function recordTransfer(winner, loser, name, note) {
    const key = name.trim().toLowerCase();
    let pl = state.players.find(p => p.currentId === loser.id && p.name.toLowerCase() === key);
    const step = { round: state.turn, from: loser.name, to: winner.name };
    if (pl) {
        pl.currentId = winner.id;
        pl.path.push(step);
        if (note) pl.note = note;
    } else {
        pl = {
            id: "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
            name: name.trim(),
            note: note || "",
            originId: loser.id,
            originName: loser.name,
            currentId: winner.id,
            path: [step]
        };
        state.players.push(pl);
    }
    return pl;
}

function completeBattle(name, note) {
    const pt = pendingTransfer;
    if (!pt) return;
    const winner = byId(pt.winnerId);
    const loser = byId(pt.loserId);
    if (!winner || !loser) { closeTransferModal(); return; }
    closeTransferModal();

    makeBackup(`Voor ronde ${state.turn}: ` + (pt.score ? scoreText(pt) : `${winner.name} \u2013 ${loser.name}`));
    winner.wins = (winner.wins || 0) + 1;
    let scoreHtml = "";
    if (pt.score) {
        const attC = byId(pt.attId), defC = byId(pt.defId);
        state.matches.push({
            round: state.turn,
            attId: pt.attId, attName: attC ? attC.name : "?",
            defId: pt.defId, defName: defC ? defC.name : "?",
            a: pt.score.att, d: pt.score.def, pens: pt.score.pens || null,
            winnerId: winner.id, loserId: loser.id
        });
        scoreHtml = ` <span class="text-white font-black">${esc(scoreText(pt))}</span>`;
    }
    if (state.events) state.events.push({ r: state.turn, k: "m", att: pt.attId, def: pt.defId, win: winner.id, lose: loser.id, a: pt.score ? pt.score.att : 0, d: pt.score ? pt.score.def : 0, pens: pt.score ? (pt.score.pens || null) : null, pl: name ? { n: name, note: note || "" } : null });
    const actionVerb = pt.attackerWon ? "veroverde" : "hield stand en annexeerde";
    const winColor = pt.attackerWon ? "text-amber-300" : "text-orange-400";

    let extra;
    if (name) {
        const pl = recordTransfer(winner, loser, name, note);
        extra = `<br><span class="text-sky-300"><i class="fa-solid fa-right-left mr-1"></i>${esc(pl.name)}</span> verhuist van ${esc(loser.name)} naar ${esc(winner.name)}`;
    } else {
        extra = `<br><span class="text-slate-500">Geen speler genomen.</span>`;
    }

    addLog(
        `Ronde ${state.turn}: <b class="${winColor}">${esc(winner.name)}</b> ${actionVerb} <b>${esc(loser.name)}</b>!${scoreHtml}${extra}`
    );

    annexTerritory(winner.id, loser.id);
    closeModal();
    checkVictory(winner);
    if (state.matches.length > 0 && state.matches.length % 10 === 0) {
        toast(`\u{1F4BE} ${state.matches.length} wedstrijden gespeeld \u2014 tip: exporteer een back-upbestand via Saves.`, 7000);
    }
}

function renderPlayers() {
    const box = $("pl-list");
    if (!box) return;
    if (!state.players.length) {
        box.innerHTML = `<div class="text-slate-500 italic text-center py-6">Nog geen spelers verhuisd. Na elke gewonnen wedstrijd noteer je hier de speler die de winnaar meeneemt.</div>`;
        return;
    }
    const q = ($("pl-filter").value || "").trim().toLowerCase();
    const list = state.players.filter(p => !q
        || p.name.toLowerCase().includes(q)
        || (p.note || "").toLowerCase().includes(q)
        || p.path.some(st => st.from.toLowerCase().includes(q) || st.to.toLowerCase().includes(q)));

    const groups = new Map();
    for (const p of list) {
        if (!groups.has(p.currentId)) groups.set(p.currentId, []);
        groups.get(p.currentId).push(p);
    }
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

    let html = `<div class="text-slate-400">${state.players.length} speler${state.players.length === 1 ? "" : "s"} verhuisd${q ? ` • ${list.length} gevonden` : ""}</div>`;
    if (!list.length) html += `<div class="text-slate-500 italic text-center py-4">Geen resultaten.</div>`;
    for (const [clubId, pls] of ordered) {
        const club = byId(clubId);
        const clubName = club ? club.name : "?";
        let sub = "";
        if (club && !club.isActive) {
            const owner = byId(club.ownerId);
            if (owner) sub = ` <span class="font-normal text-slate-500">(opgeslokt door ${esc(owner.name)})</span>`;
        }
        html += `<div class="rounded-lg border border-slate-800 bg-slate-950/75 p-2">
            <div class="flex justify-between font-bold text-amber-300"><span>${esc(clubName)}${sub}</span><span class="text-slate-400">${pls.length}</span></div>`;
        for (const p of pls) {
            const route = [p.path[0].from, ...p.path.map(st => st.to)].map(esc).join(" → ");
            html += `<div class="mt-1.5 pl-2 border-l-2 border-sky-500/50">
                <div class="text-slate-100 font-semibold">${esc(p.name)}${p.note ? ` <span class="font-normal text-slate-400">• ${esc(p.note)}</span>` : ""}</div>
                <div class="text-[11px] text-slate-400 leading-snug">${route}</div>
            </div>`;
        }
        html += `</div>`;
    }
    box.innerHTML = html;
}
