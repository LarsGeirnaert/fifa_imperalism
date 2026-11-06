// Koppeling competitienaam (JSON) -> preset-code die de dropdown gebruikt
const LEAGUE_CODE = { "Liga Profesional (Argentinië)": "world", "A-League (Australië)": "world", "Austrian Bundesliga": "europe_other", "Jupiler Pro League": "belgium", "Chinese Super League": "world", "Superliga (Denemarken)": "europe_other", "Premier League": "uk", "Championship": "uk", "League One": "uk", "League Two": "uk", "Ligue 1": "france", "Ligue 2": "france", "Bundesliga": "germany", "2. Bundesliga": "germany", "3. Liga": "germany", "Indian Super League": "world", "Serie A": "italy", "Serie B": "italy", "Eredivisie": "eredivisie", "Eliteserien": "europe_other", "Ekstraklasa": "europe_other", "Liga Portugal": "portugal", "SSE Airtricity Premier Division": "europe_other", "K League 1": "world", "Rest of World": "europe_other", "Superliga (Roemenië)": "europe_other", "Saudi Pro League": "world", "Scottish Premiership": "uk", "La Liga": "spain", "LaLiga 2": "spain", "Allsvenskan": "europe_other", "Swiss Super League": "europe_other", "Süper Lig": "europe_other", "Major League Soccer": "world" };
const CLUB_CODE_OVERRIDE = { "rw_ain": "world", "rw_nac": "world", "rw_bah": "world", "rw_bur": "world" };

// Probeert eafc26_teams_by_league.json naast index.html in te laden (werkt via http/Live Server/GitHub Pages).
// Lukt dat niet (bv. dubbelklik = file://), dan blijft de ingebouwde lijst hierboven gewoon werken.
async function loadClubsFromJson() {
    try {
        const res = await fetch("eafc26_teams_by_league.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.teams;
        if (!Array.isArray(list) || list.length < 3) return;
        MASTER_CLUBS = list.map(c => ({ ...c, leagueName: c.league, league: CLUB_CODE_OVERRIDE[c.id] || LEAGUE_CODE[c.league] || c.league || "europe_other" }));
        SOURCE_CLUBS = [...MASTER_CLUBS];
    } catch (err) {
        console.info("JSON niet geladen, ingebouwde clublijst gebruikt.", err);
    }
}

function updatePresetLabels() {
    const n = f => MASTER_CLUBS.filter(f).length;
    const set = (v, txt) => { const o = document.querySelector('#preset-select option[value="' + v + '"]'); if (o) { o.textContent = txt; o.dataset.base = txt; } };
    set("all", `\u{1F30D} Alle EA FC 26 Teams (${MASTER_CLUBS.length} Clubs)`);
    set("belgium", `\u{1F1E7}\u{1F1EA} Belgi\u00eb \u2014 Jupiler Pro League (${n(c => c.league === "belgium")} Clubs)`);
    set("europe", `\u{1F3C6} Europa Top Competities (${n(c => c.league !== "world")} Clubs)`);
    set("uk", `\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} UK & Premier League (${n(c => c.league === "uk")} Clubs)`);
}
