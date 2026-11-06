/* ============================================================================
   WEDSTRIJD CORRIGEREN + TERUGSPELEN
   ============================================================================ */
const dynNow = () => TEAMS.map(t => [t.ownerId, t.isActive ? 1 : 0, t.upgrades || 0, t.wins || 0]);
function simulate(events, upto) {
    const idx = new Map(TEAMS.map((t, i) => [t.id, i]));
    const d = TEAMS.map(t => [t.id, 1, 0, 0]);
    const annex = (w, l) => { d.forEach(x => { if (x[0] === l) x[0] = w; }); const i = idx.get(l); if (i !== undefined) d[i][1] = 0; };
    for (let k = 0; k < Math.min(upto, events.length); k++) {
        const e = events[k];
        if (e.k === "n") { d[idx.get(e.att)][2] += 3; annex(e.att, e.def); }
        else { d[idx.get(e.win)][3] += 1; annex(e.win, e.lose); }
    }
    return d;
}
const sameDyn = (a, b) => a.length === b.length && a.every((x, i) => x[0] === b[i][0] && x[1] === b[i][1] && x[2] === b[i][2] && x[3] === b[i][3]);
/** Oudere saves hebben geen eventlijst: bouw die uit matches + log en controleer of de kaart klopt. */
function legacyEvents() {
    const ev = [];
    for (let r = 1; r < state.turn; r++) {
        const m = state.matches.find(x => x.round === r);
        if (m) {
            const pl = state.players.find(p => p.path.some(st => st.round === r && st.to === byId(m.winnerId)?.name && st.from === byId(m.loserId)?.name));
            ev.push({ r, k: "m", att: m.attId, def: m.defId, win: m.winnerId, lose: m.loserId, a: m.a, d: m.d, pens: m.pens || null, pl: pl ? { n: pl.name, note: pl.note || "" } : null });
        } else {
            const line = LOG.find(h => h.startsWith(`Ronde ${r}:`) && h.includes(" nam "));
            const mm = line && line.match(/<b[^>]*>(.*?)<\/b> nam <span[^>]*>(.*?)<\/span>/);
            const A = mm && TEAMS.find(t => esc(t.name) === mm[1]), D = mm && TEAMS.find(t => esc(t.name) === mm[2]);
            if (!A || !D) return null;
            ev.push({ r, k: "n", att: A.id, def: D.id });
        }
    }
    try { return sameDyn(simulate(ev, ev.length), dynNow()) ? ev : null; } catch (e) { return null; }
}
function ensureEvents() {
    if (state.events && sameDyn(simulate(state.events, state.events.length), dynNow())) return true;
    state.events = legacyEvents();
    return !!state.events;
}
const evText = e => { const A = byId(e.att), D = byId(e.def); return `${A ? A.name : "?"} ${e.a}-${e.d}${e.pens ? " (str. " + (e.pens === "att" ? A.name : D.name) + ")" : ""} ${D ? D.name : "?"}`; };
function evLogHtml(e) {
    const W = byId(e.k === "n" ? e.att : e.win), L = byId(e.k === "n" ? e.def : e.lose);
    if (e.k === "n") return `Ronde ${e.r}: <b class="text-amber-300">${esc(W.name)}</b> nam <span class="text-emerald-400">${esc(L.name)}</span> in en kreeg een <b>+3 Squad Upgrades</b>!`;
    const aw = e.win === e.att;
    const extra = e.pl ? `<br><span class="text-sky-300"><i class="fa-solid fa-right-left mr-1"></i>${esc(e.pl.n)}</span> verhuist van ${esc(L.name)} naar ${esc(W.name)}` : `<br><span class="text-slate-500">Geen speler genomen.</span>`;
    return `Ronde ${e.r}: <b class="${aw ? "text-amber-300" : "text-orange-400"}">${esc(W.name)}</b> ${aw ? "veroverde" : "hield stand en annexeerde"} <b>${esc(L.name)}</b>! <span class="text-white font-black">${esc(evText(e))}</span>${extra}`;
}
/** Zet de eventlijst om naar de echte stand (kaart, spelers, matches, log). */
function applyEvents(ev) {
    const d = simulate(ev, ev.length);
    TEAMS.forEach((t, i) => { t.ownerId = d[i][0]; t.isActive = !!d[i][1]; t.upgrades = d[i][2]; t.wins = d[i][3]; });
    state.events = ev;
    state.matches = ev.filter(e => e.k === "m").map(e => ({ round: e.r, attId: e.att, attName: byId(e.att).name, defId: e.def, defName: byId(e.def).name, a: e.a, d: e.d, pens: e.pens, winnerId: e.win, loserId: e.lose }));
    state.players = [];
    ev.forEach(e => { if (e.k === "m" && e.pl) { state.turn = e.r; recordTransfer(byId(e.win), byId(e.lose), e.pl.n, e.pl.note); } });
    const keepLog = LOG.filter(h => /^Ronde \d+:/.test(h) === false);
    LOG = [...keepLog, ...ev.map(evLogHtml).reverse()];
    state.turn = ev.length ? ev[ev.length - 1].r + 1 : 1;
    state.attacker = null; state.defender = null;
    state.over = activeRealClubs().length === 1 && activeNeutralZones().length === 0;
    empireCache.clear(); renderLogFromArray(); render(); updateUI(); flushSave();
}
function applyCorrection(i, a, dd, pens) {
    const ev = clone(state.events), e = ev[i];
    const attWon = a > dd || (a === dd && pens === "att");
    const newWin = attWon ? e.att : e.def, newLose = attWon ? e.def : e.att;
    const flipped = newWin !== e.win;
    const oldW = e.win;
    Object.assign(e, { a, d: dd, pens: a === dd ? pens : null, win: newWin, lose: newLose });
    if (flipped) {
        e.pl = null;   // de oude transfer klopt niet meer
        for (let k = i + 1; k < ev.length; k++) {   // het rijk van de oude winnaar is nu van de nieuwe winnaar
            for (const f of ["att", "def", "win", "lose"]) if (ev[k][f] === oldW) ev[k][f] = newWin;
        }
    }
    applyEvents(ev);
    toast(flipped ? "Score gecorrigeerd — latere rondes zijn herberekend." : "Score gecorrigeerd.");
}
function openEdit(i) {
    if (!activeSaveId) return;
    if (!ensureEvents()) { toast("Deze oudere save kan niet betrouwbaar herberekend worden. Terugspelen kan wel."); return; }
    const list = state.events.map((e, k) => [e, k]).filter(x => x[0].k === "m");
    if (!list.length) { toast("Nog geen wedstrijden om te corrigeren."); return; }
    const sel = $("ed-sel");
    sel.innerHTML = list.map(([e, k]) => `<option value="${k}">Ronde ${e.r}: ${esc(evText(e))}</option>`).join("");
    sel.value = String(i !== undefined && list.some(x => x[1] === i) ? i : list[list.length - 1][1]);
    fillEdit(); $("edit-modal").classList.remove("hidden"); $("edit-modal").classList.add("flex");
}
function fillEdit() {
    const k = +$("ed-sel").value, e = state.events[k];
    $("ed-att").textContent = byId(e.att).name; $("ed-def").textContent = byId(e.def).name;
    $("ed-a").value = e.a; $("ed-d").value = e.d;
    $("ed-pen").innerHTML = `<option value="att">Strafschoppen: ${esc(byId(e.att).name)} wint</option><option value="def">Strafschoppen: ${esc(byId(e.def).name)} wint</option>`;
    $("ed-pen").value = e.pens || (e.win === e.att ? "att" : "def");
    $("ed-err").classList.add("hidden"); editPreview();
}
function editPreview() {
    const k = +$("ed-sel").value, e = state.events[k];
    const a = parseInt($("ed-a").value, 10), d = parseInt($("ed-d").value, 10);
    $("ed-pen").classList.toggle("hidden", !(a === d));
    if (isNaN(a) || isNaN(d)) { $("ed-info").textContent = ""; return; }
    const win = a > d || (a === d && $("ed-pen").value === "att") ? e.att : e.def;
    const later = state.events.slice(k + 1).length;
    $("ed-info").innerHTML = win === e.win ? "De winnaar blijft gelijk: alleen de score verandert, de kaart blijft zoals ze is." : `<b class="text-amber-300">${esc(byId(win).name)}</b> wint nu. De transfer van deze ronde vervalt en de ${later} latere ronde(s) worden opnieuw doorgerekend.`;
}
function closeEdit() { $("edit-modal").classList.add("hidden"); $("edit-modal").classList.remove("flex"); }

/* ---- Terugspelen ---- */
let RP = null;
function replayFrames() {
    if (ensureEvents()) {
        const n = state.events.length;
        return { ev: state.events, frames: Array.from({ length: n + 1 }, (_, i) => simulate(state.events, i)) };
    }
    const bk = BACKUPS.filter(b => b.kind === "match" && b.dyn.length === TEAMS.length);
    return { ev: null, frames: [...bk.map(b => b.dyn), dynNow()], labels: [...bk.map(b => b.label), "Huidige stand"] };
}
function showFrame(i) {
    RP.i = i;
    const d = RP.frames[i];
    TEAMS.forEach((t, k) => { t.ownerId = d[k][0]; t.isActive = !!d[k][1]; t.upgrades = d[k][2]; t.wins = d[k][3]; });
    empireCache.clear(); render();
    const left = TEAMS.filter(t => t.isActive && !t.isNeutral).length;
    let lab;
    if (RP.ev) lab = i === 0 ? "Startstand" : `Ronde ${RP.ev[i - 1].r}: ` + (RP.ev[i - 1].k === "m" ? evText(RP.ev[i - 1]) : `${byId(RP.ev[i - 1].att).name} claimt ${byId(RP.ev[i - 1].def).name}`);
    else lab = RP.labels[i];
    $("rp-label").textContent = lab + ` • ${left} clubs over`;
    $("rp-range").max = RP.frames.length - 1; $("rp-range").value = i;
    $("rp-edit").disabled = !(RP.ev && i > 0 && RP.ev[i - 1].k === "m");
    $("rp-edit").style.opacity = $("rp-edit").disabled ? .35 : 1;
}
function replayStop() { clearInterval(RP && RP.timer); if (RP) RP.timer = null; $("rp-play").innerHTML = '<i class="fa-solid fa-play"></i>'; }
function replayToggle() {
    if (RP.timer) return replayStop();
    if (RP.i >= RP.frames.length - 1) showFrame(0);
    $("rp-play").innerHTML = '<i class="fa-solid fa-pause"></i>';
    RP.timer = setInterval(() => { if (RP.i >= RP.frames.length - 1) replayStop(); else showFrame(RP.i + 1); }, 900);
}
function openReplay() {
    if (!activeSaveId || !TEAMS.length) return;
    if (state.attacker && !confirm("Er loopt een beurt. Die wordt gepauzeerd tijdens het terugspelen. Doorgaan?")) return;
    const r = replayFrames();
    if (r.frames.length < 2) { toast("Nog niets om terug te spelen."); return; }
    RP = { ...r, live: dynNow(), att: state.attacker, def: state.defender, timer: null, i: 0 };
    window.REPLAYING = true; state.attacker = null; state.defender = null;
    document.body.classList.add("replaying");
    $("replay-bar").classList.remove("hidden");
    $("rp-note").textContent = r.ev ? "Volledige tijdlijn" : "Oudere save: tijdlijn uit de laatste back-ups (max. 25 rondes)";
    showFrame(0); fitToClubs();
}
function closeReplay() {
    if (!RP) return;
    replayStop();
    TEAMS.forEach((t, k) => { const d = RP.live[k]; t.ownerId = d[0]; t.isActive = !!d[1]; t.upgrades = d[2]; t.wins = d[3]; });
    state.attacker = RP.att; state.defender = RP.def; RP = null;
    window.REPLAYING = false; document.body.classList.remove("replaying");
    $("replay-bar").classList.add("hidden");
    empireCache.clear(); render(); updateUI();
}
$("btn-replay").onclick = openReplay; $("rp-close").onclick = closeReplay;
$("rp-play").onclick = replayToggle;
$("rp-start").onclick = () => { replayStop(); showFrame(0); };
$("rp-prev").onclick = () => { replayStop(); showFrame(Math.max(0, RP.i - 1)); };
$("rp-next").onclick = () => { replayStop(); showFrame(Math.min(RP.frames.length - 1, RP.i + 1)); };
$("rp-range").oninput = e => { replayStop(); showFrame(+e.target.value); };
$("rp-edit").onclick = () => { const k = RP.i - 1; closeReplay(); openEdit(k); };
$("btn-edit-match").onclick = () => openEdit();
$("ed-sel").onchange = fillEdit; $("ed-a").oninput = $("ed-d").oninput = $("ed-pen").onchange = editPreview;
$("ed-cancel").onclick = closeEdit;
$("ed-save").onclick = () => {
    const a = parseInt($("ed-a").value, 10), d = parseInt($("ed-d").value, 10), k = +$("ed-sel").value;
    if (isNaN(a) || isNaN(d) || a < 0 || d < 0) { $("ed-err").textContent = "Vul twee geldige scores in."; $("ed-err").classList.remove("hidden"); return; }
    const e = state.events[k], pens = $("ed-pen").value;
    const win = a > d || (a === d && pens === "att") ? e.att : e.def;
    if (win !== e.win && !confirm(`${byId(win).name} wordt nu winnaar. Latere rondes worden opnieuw doorgerekend. Doorgaan?`)) return;
    makeBackup(`Voor correctie ronde ${e.r}`, "safety", true);
    closeEdit(); applyCorrection(k, a, d, pens);
};
