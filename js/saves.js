/* ---- Opslaan / herstellen (localStorage) ---- */
let saveTimer = null;
function saveGame() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 120);
}
/* ============================================================================
   SAVES: meerdere saves, automatische back-ups, export/import
   ============================================================================ */
const IDX_KEY = "eafc26_saves_index_v3";
const SAVE_PREFIX = "eafc26_save_v3_";
const MAX_BACKUPS = 25;
const PRESET_NAMES = { all: "Alle teams", belgium: "Belgi\u00eb", benelux: "BeNeLux", europe: "Europa", uk: "UK & Premier League" };
const clone = o => JSON.parse(JSON.stringify(o));
const newSaveId = () => "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

function toast(msg, ms = 3500) {
    let el = document.getElementById("toast-box");
    if (!el) {
        el = document.createElement("div");
        el.id = "toast-box";
        el.className = "fixed left-1/2 -translate-x-1/2 bottom-5 z-[3000] max-w-[92vw] px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-400/60 text-amber-200 text-xs font-bold shadow-2xl text-center";
        el.style.transition = "opacity 0.3s";
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; }, ms);
}

function readIndex() {
    try {
        const o = JSON.parse(localStorage.getItem(IDX_KEY));
        if (o && Array.isArray(o.order) && o.meta) return o;
    } catch (err) { }
    return { active: null, order: [], meta: {} };
}
function writeIndex(ix) {
    try { localStorage.setItem(IDX_KEY, JSON.stringify(ix)); return true; } catch (err) { return false; }
}
function readSave(id) {
    try {
        const sv = JSON.parse(localStorage.getItem(SAVE_PREFIX + id));
        return sv && Array.isArray(sv.teams) && sv.st ? sv : null;
    } catch (err) { return null; }
}
function metaOf(sv) {
    return {
        id: sv.id,
        name: sv.name,
        preset: sv.preset,
        custom: !!(sv.custom && sv.custom.length),
        enableNeutral: sv.enableNeutral !== false,
        enableClip: sv.enableClip !== false,
        round: (sv.st && sv.st.turn) || 1,
        matches: (sv.matches || []).length,
        backups: (sv.backups || []).length,
        createdAt: sv.createdAt || sv.savedAt || Date.now(),
        savedAt: sv.savedAt || Date.now()
    };
}
function writeSave(sv) {
    try {
        localStorage.setItem(SAVE_PREFIX + sv.id, JSON.stringify(sv));
        const ix = readIndex();
        ix.meta[sv.id] = metaOf(sv);
        if (!ix.order.includes(sv.id)) ix.order.push(sv.id);
        writeIndex(ix);
        return true;
    } catch (err) {
        console.warn("Opslaan mislukt", err);
        if (!saveFailedWarned) {
            saveFailedWarned = true;
            toast("\u26A0\uFE0F Opslaan mislukt (opslag vol of geblokkeerd)! Exporteer nu een back-up via Saves.", 10000);
        }
        return false;
    }
}

function snapshotCurrent() {
    return {
        v: 3,
        id: activeSaveId,
        name: activeSaveName,
        createdAt: activeCreatedAt,
        savedAt: Date.now(),
        preset: lastPreset,
        custom: customSource ? SOURCE_CLUBS : null,
        enableNeutral: state.enableNeutral,
        enableClip: state.enableClip,
        st: { attacker: state.attacker, defender: state.defender, turn: state.turn, over: state.over },
        teams: TEAMS,
        players: state.players,
        matches: state.matches,
        events: state.events,
        log: LOG,
        backups: BACKUPS
    };
}
function saveNow() {
    if (window.REPLAYING) return;
    if (!saveEnabled || !activeSaveId || TEAMS.length < 3) return;
    const ok = writeSave(snapshotCurrent());
    const el = $("save-status");
    if (el) {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
        el.textContent = ok ? `\u2713 ${hh}:${mm}` : "\u26A0 niet bewaard";
        el.className = (ok ? "text-emerald-400" : "text-red-400") + " text-[10px] font-bold whitespace-nowrap";
    }
    if (ok) {
        const ix = readIndex();
        if (ix.active !== activeSaveId) { ix.active = activeSaveId; writeIndex(ix); }
    }
}
function flushSave() {
    clearTimeout(saveTimer);
    saveNow();
}

/* ---- Automatische back-ups (compact: alleen de veranderlijke velden per team) ---- */
function buildBackup(teams, turn, over, players, matches, log, label, kind, full, events) {
    return {
        at: Date.now(),
        kind,
        label,
        turn,
        over: !!over,
        dyn: teams.map(t => [t.ownerId, t.isActive ? 1 : 0, t.upgrades || 0, t.wins || 0]),
        players: clone(players || []),
        matches: clone(matches || []),
        events: events ? clone(events) : undefined,
        logLen: (log || []).length,
        log: full ? (log || []).slice() : undefined
    };
}
function makeBackup(label, kind = "match", full = false) {
    if (!activeSaveId || !TEAMS.length) return;
    BACKUPS.push(buildBackup(TEAMS, state.turn, state.over, state.players, state.matches, LOG, label, kind, full, state.events));
    while (BACKUPS.length > MAX_BACKUPS) BACKUPS.shift();
}
/** Zet een back-up terug in een save-object (opgeslagen save). Bewaart eerst de huidige stand als veiligheidsback-up. */
function restoreBackupObj(sv, idx, removeUsed) {
    const b = (sv.backups || [])[idx];
    if (!b || !Array.isArray(b.dyn) || b.dyn.length !== sv.teams.length) return false;
    sv.backups.push(buildBackup(sv.teams, sv.st.turn, sv.st.over, sv.players, sv.matches, sv.log || [], `Voor herstel (${b.label})`, "safety", true, sv.events));
    sv.teams.forEach((t, i) => {
        const d = b.dyn[i];
        t.ownerId = d[0];
        t.isActive = !!d[1];
        t.upgrades = d[2];
        t.wins = d[3];
    });
    sv.st = { attacker: null, defender: null, turn: b.turn, over: !!b.over };
    sv.players = clone(b.players || []);
    sv.matches = clone(b.matches || []);
    sv.events = b.events ? clone(b.events) : null;
    const curLog = sv.log || [];
    sv.log = b.log ? b.log.slice() : curLog.slice(Math.max(0, curLog.length - (b.logLen || 0)));
    if (removeUsed) {
        const at = sv.backups.indexOf(b);
        if (at >= 0) sv.backups.splice(at, 1);
    }
    while (sv.backups.length > MAX_BACKUPS) sv.backups.shift();
    sv.savedAt = Date.now();
    return true;
}
function restoreBackup(id, idx, removeUsed) {
    if (activeSaveId) flushSave();
    const sv = readSave(id);
    if (!sv) { toast("Save niet gevonden."); return false; }
    if (!restoreBackupObj(sv, idx, removeUsed)) { toast("Deze back-up past niet bij de kaart van deze save."); return false; }
    if (!writeSave(sv)) return false;
    if (id === activeSaveId) applySave(sv);
    return true;
}
function undoLastMatch() {
    if (!activeSaveId) return;
    let idx = -1;
    for (let i = BACKUPS.length - 1; i >= 0; i--) if (BACKUPS[i].kind === "match") { idx = i; break; }
    if (idx < 0) { toast("Niets om ongedaan te maken."); return; }
    const label = BACKUPS[idx].label;
    if (!confirm(`Laatste wedstrijd ongedaan maken?\n\n${label}\n\nJe huidige stand wordt eerst bewaard in de back-ups.`)) return;
    if (restoreBackup(activeSaveId, idx, true)) toast("\u21B6 Laatste wedstrijd ongedaan gemaakt");
}
function resetCurrentSave() {
    if (!activeSaveId || !TEAMS.length) return;
    const typed = prompt(`"${activeSaveName}" herstarten?\n\nAlle rondes, scores, spelers en de kaartstand worden gewist. Er wordt eerst automatisch een back-up gemaakt (Saves \u2192 Back-ups).\n\nTyp HERSTART om te bevestigen:`);
    if (typed === null) return;
    if (typed.trim().toUpperCase() !== "HERSTART") { toast("Niet bevestigd \u2014 er is niets gewist."); return; }
    makeBackup("Voor herstart", "safety", true);
    for (const t of TEAMS) { t.ownerId = t.id; t.isActive = true; t.upgrades = 0; t.wins = 0; }
    state.attacker = null; state.defender = null; state.turn = 1; state.over = false;
    state.players = []; state.matches = []; state.events = []; LOG = [];
    pendingTransfer = null;
    $("transfer-modal").classList.add("hidden");
    $("transfer-modal").classList.remove("flex");
    $("inspector-card").classList.add("hidden");
    $("tab-log").innerHTML = `<div class="text-slate-500 italic text-center py-6">Save herstart.</div>`;
    empireCache.clear();
    render();
    fitToClubs();
    flushSave();
    toast("Save herstart \u2014 de oude stand staat in de back-ups");
}

function renderLogFromArray() {
    const box = $("tab-log");
    if (!LOG.length) {
        box.innerHTML = `<div class="text-slate-500 italic text-center py-6">Nog geen wedstrijden gespeeld.</div>`;
        return;
    }
    box.innerHTML = "";
    for (const html of LOG) {
        const item = document.createElement("div");
        item.className = "bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 leading-snug";
        item.innerHTML = html;
        box.appendChild(item);
    }
}
function fitToClubs() {
    const realClubs = TEAMS.filter(t => !t.isNeutral);
    if (!realClubs.length) return;
    const lats = realClubs.map(t => t.lat);
    const lngs = realClubs.map(t => t.lng);
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [45, 45] });
}
/** Laad een opgeslagen save in het scherm. */
function applySave(sv) {
    if (!sv || !Array.isArray(sv.teams) || sv.teams.length < 3 || !sv.st) return false;
    activeSaveId = sv.id;
    activeSaveName = sv.name || "Save";
    activeCreatedAt = sv.createdAt || Date.now();
    BACKUPS = Array.isArray(sv.backups) ? sv.backups : [];
    state.enableNeutral = sv.enableNeutral !== false;
    state.enableClip = sv.enableClip !== false;
    $("chk-clip").checked = state.enableClip;
    lastPreset = sv.preset || "all";
    if (Array.isArray(sv.custom) && sv.custom.length) {
        customSource = true;
        SOURCE_CLUBS = sv.custom;
    } else {
        customSource = false;
        SOURCE_CLUBS = presetClubs(lastPreset);
    }
    TEAMS = sv.teams;
    state.attacker = sv.st.attacker || null;
    state.defender = sv.st.defender || null;
    state.turn = sv.st.turn || 1;
    state.over = !!sv.st.over;
    state.players = Array.isArray(sv.players) ? sv.players : [];
    state.matches = Array.isArray(sv.matches) ? sv.matches : [];
    state.events = Array.isArray(sv.events) ? sv.events : null;
    LOG = Array.isArray(sv.log) ? sv.log : [];
    pendingTransfer = null;
    $("transfer-modal").classList.add("hidden");
    $("transfer-modal").classList.remove("flex");
    $("inspector-card").classList.add("hidden");
    if (LOG.length) renderLogFromArray();
    else $("tab-log").innerHTML = `<div class="text-slate-500 italic text-center py-6">Nog geen wedstrijden gespeeld.</div>`;
    lastScoreKey = null;
    empireCache.clear();
    buildGeometry();
    render();
    fitToClubs();
    updateSaveLabel();
    return true;
}

function updateSaveLabel() {
    const n = $("save-name-label");
    if (!n) return;
    n.textContent = activeSaveId ? activeSaveName : "Geen save gekozen";
    const mode = customSource ? "Eigen teams" : (PRESET_NAMES[lastPreset] || lastPreset);
    $("save-meta-label").textContent = activeSaveId ? `${mode} \u2022 vrije gebieden ${state.enableNeutral ? "aan" : "uit"}` : "";
}

/** Eenmalig: oude saves (v1 / v2 per-mode) omzetten naar het nieuwe systeem. De oude data blijft staan. */
function migrateOldSaves() {
    if (readIndex().order.length) return;
    const found = [];
    try {
        const raw = localStorage.getItem("eafc26_imperialism_slots_v2");
        if (raw) {
            const o = JSON.parse(raw);
            for (const [k, sv] of Object.entries(o.slots || {})) found.push({ key: k, sv, active: o.active === k });
        }
    } catch (err) { }
    if (!found.length) {
        try {
            const raw = localStorage.getItem("eafc26_imperialism_save_v1");
            if (raw) { const sv = JSON.parse(raw); found.push({ key: (sv && sv.preset) || "all", sv, active: true }); }
        } catch (err) { }
    }
    for (const f of found) {
        const sv = f.sv;
        if (!sv || !Array.isArray(sv.teams) || sv.teams.length < 3 || !sv.st) continue;
        const id = newSaveId();
        const obj = {
            ...sv, v: 3, id,
            name: `${PRESET_NAMES[f.key] || f.key} (overgenomen)`,
            createdAt: sv.savedAt || Date.now(),
            preset: sv.preset || f.key,
            matches: Array.isArray(sv.matches) ? sv.matches : [],
            backups: []
        };
        writeSave(obj);
        if (f.active) { const ix = readIndex(); ix.active = id; writeIndex(ix); }
    }
}

/* ---- Kaartgegevens (landgrenzen) ---- */
async function loadLandmass() {
    try {
        const res = await fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson");
        if (res.ok) { landmassGeoJSON = await res.json(); return true; }
    } catch (err) {
        console.warn("Kon wereldgrenzen niet ophalen, gebruikt standaard Voronoi-grenzen.", err);
    }
    return false;
}
function ensureLandmass() {
    if (landmassGeoJSON) return Promise.resolve(true);
    if (!landmassPromise) {
        landmassPromise = loadLandmass().then(ok => { if (!ok) landmassPromise = null; return ok; });
    }
    return landmassPromise;
}

/* ---- Nieuwe save / openen ---- */
async function createSave(opts) {
    const src = opts.custom && opts.custom.length ? opts.custom : presetClubs(opts.preset);
    if (!src || src.length < 3) { toast("Minstens 3 teams nodig."); return false; }
    const btn = $("ns-create"), st = $("ns-status");
    btn.disabled = true;
    if (opts.enableClip && !landmassGeoJSON) {
        st.textContent = "Kaartgegevens laden\u2026";
        st.classList.remove("hidden");
        await ensureLandmass();
    }
    st.classList.add("hidden");
    btn.disabled = false;

    if (activeSaveId) flushSave();                 // huidige save eerst veilig wegschrijven
    activeSaveId = newSaveId();
    activeSaveName = opts.name;
    activeCreatedAt = Date.now();
    BACKUPS = [];
    lastPreset = opts.preset;
    customSource = !!(opts.custom && opts.custom.length);
    SOURCE_CLUBS = src;
    state.enableNeutral = opts.enableNeutral;
    state.enableClip = opts.enableClip;
    $("chk-clip").checked = state.enableClip;
    saveEnabled = true;
    lastScoreKey = null;
    startGame(SOURCE_CLUBS);
    updateSaveLabel();
    flushSave();
    closeSaveMenu();
    toast(`Nieuwe save "${activeSaveName}" gestart`);
    return true;
}

function openSaveById(id) {
    if (id === activeSaveId && TEAMS.length) { closeSaveMenu(); return; }
    if (activeSaveId) flushSave();
    const sv = readSave(id);
    if (!sv || !applySave(sv)) { toast("Deze save kon niet geladen worden."); return; }
    saveEnabled = true;
    const ix = readIndex();
    ix.active = id;
    writeIndex(ix);
    closeSaveMenu();
    toast(`Save "${activeSaveName}" geladen`);
}

/* ---- Save-menu ---- */
function fmtDate(ts) {
    try { return new Date(ts).toLocaleString("nl-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (err) { return ""; }
}
function openSaveMenu() {
    if (activeSaveId) flushSave();
    renderSaveMenu();
    if (!$("ns-name").value.trim()) $("ns-name").value = `Save ${readIndex().order.length + 1}`;
    $("sm-close").classList.toggle("hidden", !activeSaveId);
    $("save-menu").classList.remove("hidden");
    $("save-menu").classList.add("flex");
}
function closeSaveMenu() {
    if (!activeSaveId) return;
    $("save-menu").classList.add("hidden");
    $("save-menu").classList.remove("flex");
}
function renderSaveMenu() {
    const ix = readIndex();
    const ids = ix.order.filter(id => ix.meta[id]).sort((a, b) => ix.meta[b].savedAt - ix.meta[a].savedAt);
    const box = $("sm-list");
    if (!ids.length) {
        box.innerHTML = `<div class="text-xs text-slate-500 italic text-center py-3">Nog geen saves. Maak hieronder je eerste save.</div>`;
        return;
    }
    const btn = "px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold";
    box.innerHTML = ids.map((id, i) => {
        const m = ix.meta[id];
        const isActive = id === activeSaveId;
        const mode = m.custom ? "Eigen teams" : (PRESET_NAMES[m.preset] || m.preset);
        return `<div class="rounded-xl border ${i === 0 ? "border-amber-400/60 bg-amber-400/5" : "border-slate-700 bg-slate-950/60"} p-3">
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <div class="font-bold text-white truncate">${esc(m.name)}${isActive ? ' <span class="text-[10px] text-emerald-400 font-black uppercase ml-1">actief</span>' : ""}</div>
                    <div class="text-[11px] text-slate-400">${esc(mode)} \u2022 vrije gebieden ${m.enableNeutral ? "aan" : "uit"} \u2022 landgrenzen ${m.enableClip ? "aan" : "uit"}</div>
                    <div class="text-[11px] text-slate-500">Ronde ${m.round} \u2022 ${m.matches} wedstrijd${m.matches === 1 ? "" : "en"} met score \u2022 ${esc(fmtDate(m.savedAt))}</div>
                </div>
                <button data-act="open" data-id="${id}" class="shrink-0 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs">${isActive ? "Verder" : "Openen"}</button>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <button data-act="backups" data-id="${id}" class="${btn}"><i class="fa-solid fa-clock-rotate-left mr-1"></i>Back-ups (${m.backups})</button>
                <button data-act="export" data-id="${id}" class="${btn}"><i class="fa-solid fa-download mr-1"></i>Exporteer</button>
                <button data-act="dup" data-id="${id}" class="${btn}"><i class="fa-regular fa-copy mr-1"></i>Dupliceer</button>
                <button data-act="rename" data-id="${id}" class="${btn}"><i class="fa-solid fa-pen mr-1"></i>Hernoem</button>
                <button data-act="delete" data-id="${id}" class="px-2 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold"><i class="fa-solid fa-trash mr-1"></i>Verwijder</button>
            </div>
        </div>`;
    }).join("");
}

function exportSave(id) {
    if (activeSaveId) flushSave();
    const sv = readSave(id);
    if (!sv) { toast("Save niet gevonden."); return; }
    const payload = { type: "eafc26-imperialism-save", v: 3, exportedAt: Date.now(), save: sv };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = String(sv.name || "save").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "save";
    a.href = url;
    a.download = `fc26_${slug}_ronde${(sv.st && sv.st.turn) || 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Back-upbestand gedownload \u2014 bewaar het ergens veilig");
}
function duplicateSave(id) {
    if (activeSaveId) flushSave();
    const sv = readSave(id);
    if (!sv) return;
    sv.id = newSaveId();
    sv.name = `${sv.name} (kopie)`;
    sv.createdAt = Date.now();
    sv.savedAt = Date.now();
    sv.backups = [];
    if (writeSave(sv)) { renderSaveMenu(); toast("Save gedupliceerd"); }
}
function renameSave(id) {
    if (activeSaveId) flushSave();
    const sv = readSave(id);
    if (!sv) return;
    const name = prompt("Nieuwe naam voor deze save:", sv.name);
    if (name === null || !name.trim()) return;
    if (id === activeSaveId) {
        activeSaveName = name.trim().slice(0, 40);
        updateSaveLabel();
        flushSave();
    } else {
        sv.name = name.trim().slice(0, 40);
        writeSave(sv);
    }
    renderSaveMenu();
}
function deleteSave(id) {
    const ix = readIndex();
    const m = ix.meta[id];
    if (!m) return;
    const typed = prompt(`Save "${m.name}" DEFINITIEF verwijderen?\n\nDit kan niet ongedaan gemaakt worden (ronde ${m.round}, ${m.matches} wedstrijden). Tip: exporteer eerst een back-up.\n\nTyp de naam van de save om te bevestigen:`);
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== String(m.name).trim().toLowerCase()) { toast("Naam klopt niet \u2014 er is niets verwijderd."); return; }
    try { localStorage.removeItem(SAVE_PREFIX + id); } catch (err) { }
    ix.order = ix.order.filter(x => x !== id);
    delete ix.meta[id];
    if (ix.active === id) ix.active = null;
    writeIndex(ix);
    if (id === activeSaveId) { location.reload(); return; }
    renderSaveMenu();
    toast("Save verwijderd");
}
function importSaveFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const sv = parsed && parsed.save ? parsed.save : parsed;
            if (!sv || !Array.isArray(sv.teams) || sv.teams.length < 3 || !sv.st) throw new Error("Dit is geen geldig back-upbestand.");
            sv.id = newSaveId();
            sv.name = `${sv.name || "Import"} (import)`.slice(0, 40);
            sv.savedAt = Date.now();
            sv.createdAt = sv.createdAt || Date.now();
            sv.backups = Array.isArray(sv.backups) ? sv.backups : [];
            sv.matches = Array.isArray(sv.matches) ? sv.matches : [];
            if (!writeSave(sv)) return;
            renderSaveMenu();
            toast(`Geïmporteerd als "${sv.name}"`);
        } catch (err) {
            toast("Import mislukt: " + err.message, 6000);
        }
    };
    reader.readAsText(file);
}

function openBackupModal(id) {
    if (activeSaveId) flushSave();
    const sv = readSave(id);
    if (!sv) return;
    $("bm-title").textContent = `Back-ups \u2014 ${sv.name}`;
    const bks = sv.backups || [];
    const box = $("bm-list");
    if (!bks.length) {
        box.innerHTML = `<div class="text-slate-500 italic text-center py-4">Nog geen back-ups. Ze ontstaan automatisch vanaf je eerste wedstrijd.</div>`;
    } else {
        box.innerHTML = bks.map((b, i) => ({ b, i })).reverse().map(({ b, i }) => `
            <div class="flex items-center justify-between gap-2 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <div class="min-w-0">
                    <div class="font-semibold text-slate-200 truncate">${esc(b.label)}</div>
                    <div class="text-[10px] text-slate-500">${esc(fmtDate(b.at))} \u2022 ronde ${b.turn}${b.kind === "safety" ? " \u2022 veiligheid" : ""}</div>
                </div>
                <button data-restore="${i}" data-id="${id}" class="shrink-0 px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px]">Herstel</button>
            </div>`).join("");
    }
    $("backup-modal").classList.remove("hidden");
    $("backup-modal").classList.add("flex");
}
function closeBackupModal() {
    $("backup-modal").classList.add("hidden");
    $("backup-modal").classList.remove("flex");
}
