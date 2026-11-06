/* ============================================================================
   9. PRESETS, IMPORT/EXPORT & EVENT LISTENERS
   ============================================================================ */
function presetClubs(presetKey) {
    let filtered = [...MASTER_CLUBS];
    if (presetKey === "belgium") {
        filtered = MASTER_CLUBS.filter(c => c.league === "belgium");
    } else if (presetKey === "benelux") {
        filtered = MASTER_CLUBS.filter(c => c.league === "belgium" || c.league === "eredivisie");
    } else if (presetKey === "uk") {
        filtered = MASTER_CLUBS.filter(c => c.league === "uk");
    } else if (presetKey === "europe") {
        filtered = MASTER_CLUBS.filter(c => c.league !== "world");
    }
    return filtered;
}

function startGame(rawClubs) {
    state.attacker = null;
    state.defender = null;
    state.turn = 1;
    state.over = false;
    state.players = [];
    state.matches = [];
    state.events = [];
    LOG = [];
    pendingTransfer = null;
    $("transfer-modal").classList.add("hidden");
    $("transfer-modal").classList.remove("flex");
    $("inspector-card").classList.add("hidden");
    $("tab-log").innerHTML = `<div class="text-slate-500 italic text-center py-6">Nieuwe game gestart.</div>`;

    TEAMS = normalizeAndGenerateTeams(rawClubs);
    if (TEAMS.length < 3) {
        $("status-message").textContent = "Minstens 3 geldige teams nodig om een Voronoi-kaart te maken.";
        return;
    }

    buildGeometry();
    render();

    const realClubs = TEAMS.filter(t => !t.isNeutral);
    const lats = realClubs.map(t => t.lat);
    const lngs = realClubs.map(t => t.lng);
    map.fitBounds(
        [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ],
        { padding: [45, 45] }
    );
}

// Wire UI Buttons
$("btn-roll-att").onclick = rollAttacker;
$("btn-roll-def").onclick = rollDefender;
$("btn-resolve").onclick = openModal;

wireScoreBox("in");
wireScoreBox("md");
$("btn-inline-upgrade").onclick = () => resolveBattle(true);

$("btn-modal-claim-neutral").onclick = () => resolveBattle(true);
$("btn-modal-close").onclick = closeModal;

$("btn-fit-all").onclick = () => {
    const realClubs = TEAMS.filter(t => !t.isNeutral);
    if (!realClubs.length) return;
    const lats = realClubs.map(t => t.lat);
    const lngs = realClubs.map(t => t.lng);
    map.flyToBounds(
        [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ],
        { padding: [50, 50], duration: 0.8 }
    );
};

$("btn-toggle-theme").onclick = () => {
    document.body.classList.toggle("dark-tiles");
    const isDark = document.body.classList.contains("dark-tiles");
    $("theme-label").textContent = isDark ? "Dark" : "Light";
};

$("chk-clip").onchange = e => {
    state.enableClip = e.target.checked;
    buildGeometry();
    render();
};

$("btn-close-insp").onclick = () => $("inspector-card").classList.add("hidden");

$("btn-force-att").onclick = () => {
    if (!inspectedOwnerId) return;
    const owner = byId(inspectedOwnerId);
    if (!owner || owner.isNeutral) return;
    state.attacker = inspectedOwnerId;
    state.defender = null;
    render();
};

$("btn-force-def").onclick = () => {
    if (!inspectedOwnerId || inspectedOwnerId === state.attacker) return;
    state.defender = inspectedOwnerId;
    render();
};

$("btn-reset-game").onclick = resetCurrentSave;

// Saves
$("btn-open-saves").onclick = openSaveMenu;
$("sm-close").onclick = closeSaveMenu;
$("btn-undo").onclick = undoLastMatch;
$("ns-create").onclick = () => {
    const name = ($("ns-name").value || "").trim().slice(0, 40) || `Save ${readIndex().order.length + 1}`;
    createSave({
        name,
        preset: $("preset-select").value,
        enableNeutral: $("chk-neutral").checked,
        enableClip: $("ns-clip").checked,
        custom: null
    }).then(ok => { if (ok) $("ns-name").value = ""; });
};
$("sm-list").onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const id = b.dataset.id;
    switch (b.dataset.act) {
        case "open": openSaveById(id); break;
        case "backups": openBackupModal(id); break;
        case "export": exportSave(id); break;
        case "dup": duplicateSave(id); break;
        case "rename": renameSave(id); break;
        case "delete": deleteSave(id); break;
    }
};
$("sm-import").onchange = e => {
    const f = e.target.files[0];
    if (f) importSaveFile(f);
    e.target.value = "";
};
$("bm-close").onclick = closeBackupModal;
$("bm-list").onclick = e => {
    const b = e.target.closest("[data-restore]");
    if (!b) return;
    const id = b.dataset.id, idx = Number(b.dataset.restore);
    const sv = readSave(id);
    const bk = sv && sv.backups && sv.backups[idx];
    if (!bk) return;
    if (!confirm(`Terugzetten naar:\n\n${bk.label}\n(${fmtDate(bk.at)})\n\nJe huidige stand wordt eerst bewaard als back-up, dus je kunt altijd terug.`)) return;
    if (restoreBackup(id, idx, false)) {
        closeBackupModal();
        renderSaveMenu();
        if (id === activeSaveId) closeSaveMenu();
        toast("Back-up teruggezet");
    }
};

// Speler-transfer modal
$("tr-confirm").onclick = () => {
    const name = $("tr-name").value.trim();
    if (!name) {
        $("tr-err").textContent = "Vul de naam van de speler in, of kies 'Geen speler nemen'.";
        $("tr-err").classList.remove("hidden");
        $("tr-name").focus();
        return;
    }
    completeBattle(name, $("tr-note").value.trim());
};
$("tr-skip").onclick = () => completeBattle(null, "");
$("tr-cancel").onclick = closeTransferModal;
$("tr-name").onkeydown = e => { if (e.key === "Enter") $("tr-confirm").click(); };
$("tr-note").onkeydown = e => { if (e.key === "Enter") $("tr-confirm").click(); };
$("pl-filter").oninput = renderPlayers;

window.addEventListener("pagehide", saveNow);
window.addEventListener("beforeunload", saveNow);

// Tab switching
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(b => {
            b.className = "tab-btn flex-1 py-2 text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition";
        });
        btn.className = "tab-btn flex-1 py-2 text-amber-400 border-b-2 border-amber-400 transition";
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.add("hidden"));
        $(btn.dataset.tab).classList.remove("hidden");
    };
});

// Teams-JSON importeren: maakt een NIEUWE save (de huidige save blijft bewaard)
function importTeamsAsNewSave(file, merge) {
    if (!confirm("Dit maakt een NIEUWE save met deze teams. Je huidige save blijft bewaard. Doorgaan?")) return;
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const parsed = JSON.parse(reader.result);
            const list = Array.isArray(parsed) ? parsed : parsed.teams;
            if (!Array.isArray(list)) throw new Error("JSON moet een array van clubs zijn.");
            const base = file.name.replace(/\.json$/i, "");
            await createSave({
                name: (merge ? `Kaart + ${base}` : `Eigen teams (${base})`).slice(0, 40),
                preset: lastPreset,
                enableNeutral: state.enableNeutral,
                enableClip: state.enableClip,
                custom: merge ? [...SOURCE_CLUBS, ...list] : list
            });
        } catch (err) {
            $("status-message").textContent = "Import mislukt: " + err.message;
        }
    };
    reader.readAsText(file);
}
$("file-input").onchange = e => {
    const f = e.target.files[0];
    if (f) importTeamsAsNewSave(f, false);
    e.target.value = "";
};
$("btn-add-json-teams").onclick = () => $("file-merge-input").click();
$("file-merge-input").onchange = e => {
    const f = e.target.files[0];
    if (f) importTeamsAsNewSave(f, true);
    e.target.value = "";
};

// Export current real clubs to JSON
$("btn-export-json").onclick = () => {
    const cleanList = TEAMS.filter(t => !t.isNeutral).map(t => ({
        id: t.id,
        name: t.name,
        lat: t.lat,
        lng: t.lng,
        color: t.color
    }));
    const blob = new Blob([JSON.stringify(cleanList, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ea_fc26_imperialism_teams.json";
    a.click();
    URL.revokeObjectURL(url);
};
