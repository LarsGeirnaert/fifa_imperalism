/* ============================================================================
   TOERNOOI-UI
   ============================================================================ */
const TUI = (() => {
    const E = TEngine;
    const KEY = "eafc26_tournaments_v1";
    let DB = { items: [] };
    let UI = { screen: "list", tid: null, tab: "overview", sub: "table", team: "" };
    let W = null;
    let GS = { tab: "overview", scope: "all", sort: "winp", dir: 1, min: 1, team: "", a: "", b: "" };
    let TM = new Map();

    const root = () => document.getElementById("trn-root");
    const g = id => document.getElementById(id);
    const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const say = (m, ms) => { if (typeof toast === "function") toast(m, ms); else alert(m); };
    const hashColor = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h},68%,50%)`; };
    const LEAGUE_LABEL = { belgium: "België", uk: "Verenigd Koninkrijk", france: "Frankrijk", germany: "Duitsland", italy: "Italië", spain: "Spanje", eredivisie: "Nederland", portugal: "Portugal", europe_other: "Rest van Europa", world: "Rest van de wereld" };
    const CLUB_COUNTRY = (() => { const C = ["Argentinië", "Australië", "Azerbeidzjan", "België", "Brazilië", "Canada", "China", "Colombia", "Cyprus", "Denemarken", "Duitsland", "Engeland", "Finland", "Frankrijk", "Griekenland", "Hongarije", "Ierland", "India", "Italië", "Kroatië", "Nederland", "Noorwegen", "Oekraïne", "Oostenrijk", "Polen", "Portugal", "Roemenië", "Saoedi-Arabië", "Schotland", "Spanje", "Thailand", "Tsjechië", "Turkije", "Verenigde Arabische Emiraten", "Verenigde Staten", "Wales", "Zuid-Korea", "Zweden", "Zwitserland"], M = { "boc": 0, "riv": 0, "ar_ald": 0, "ar_tuc": 0, "ar_arg": 0, "ar_bar": 0, "ar_ban": 0, "ar_bel": 0, "ar_cco": 0, "ar_dyj": 0, "ar_rie": 0, "ar_est": 0, "ar_gim": 0, "ar_god": 0, "ar_hur": 0, "ar_ind": 0, "ar_iri": 0, "ar_ins": 0, "ar_lan": 0, "ar_new": 0, "ar_pla": 0, "ar_rac": 0, "ar_ros": 0, "ar_sms": 0, "ar_slo": 0, "ar_sar": 0, "ar_tal": 0, "ar_tig": 0, "ar_uni": 0, "ar_vel": 0, "ar_gme": 0, "ar_erc": 0, "au_ade": 1, "au_auc": 1, "au_bri": 1, "au_ccm": 1, "au_mac": 1, "au_mci": 1, "au_mvi": 1, "au_new": 1, "au_per": 1, "au_syd": 1, "au_wsw": 1, "au_wel": 1, "au_wun": 1, "rbs": 23, "sts": 23, "las": 23, "rap": 23, "aus": 23, "wac": 23, "tsh": 23, "alt": 23, "bwl": 23, "wsg": 23, "gak": 23, "rie": 23, "clu": 3, "and": 3, "usg": 3, "gnk": 3, "ant": 3, "gnt": 3, "sta": 3, "cer": 3, "kvm": 3, "stv": 3, "cha": 3, "wes": 3, "ohl": 3, "den": 3, "lal": 3, "zul": 3, "cn_bei": 6, "cn_cha": 6, "cn_che": 6, "cn_dal": 6, "cn_hen": 6, "cn_mei": 6, "cn_qhn": 6, "cn_qwc": 6, "cn_sha": 6, "cn_shs": 6, "cn_shp": 6, "cn_szp": 6, "cn_tia": 6, "cn_yun": 6, "cn_wuh": 6, "cn_zhe": 6, "cn_lia": 6, "cn_cqt": 6, "cph": 9, "mid": 9, "bif": 9, "agf": 9, "sif": 9, "rfc": 9, "vib": 9, "nsj": 9, "son": 9, "veb": 9, "frd": 9, "obo": 9, "ars": 11, "avl": 11, "bou": 11, "bre": 11, "bha": 11, "bur": 11, "che": 11, "cry": 11, "eve": 11, "ful": 11, "lee": 11, "liv": 11, "mci": 11, "mun": 11, "new": 11, "nfo": 11, "sun": 11, "tot": 11, "whu": 11, "wol": 11, "bir": 11, "blb": 11, "bri": 11, "chr": 11, "cov": 11, "der": 11, "hul": 11, "ips": 11, "lei": 11, "mbr": 11, "mlw": 11, "nor": 11, "oxf": 11, "pmp": 11, "pre": 11, "qpr": 11, "shu": 11, "shw": 11, "sou": 11, "stk": 11, "swa": 35, "wat": 11, "wba": 11, "wre": 35, "bsl": 11, "bkp": 11, "bwf": 11, "bfc": 11, "bua": 11, "car": 35, "dnr": 11, "exe": 11, "hud": 11, "ley": 11, "lin": 11, "lut": 11, "mns": 11, "nth": 11, "pet": 11, "ply": 11, "pvl": 11, "rea": 11, "rot": 11, "stg": 11, "stc": 11, "wig": 11, "wyc": 11, "awm": 11, "acc": 11, "brw": 11, "brr": 11, "brm": 11, "cmb": 11, "chl": 11, "chf": 11, "col": 11, "crw": 11, "cra": 11, "fle": 11, "gil": 11, "grm": 11, "har": 11, "mkd": 11, "nwp": 35, "ntc": 11, "old": 11, "sal": 11, "shr": 11, "swi": 11, "tra": 11, "wal": 11, "brn": 11, "psg": 13, "asm": 13, "sb29": 13, "losc": 13, "ogcn": 13, "ol": 13, "rcl": 13, "om": 13, "srfc": 13, "rcs": 13, "nan": 13, "tou": 13, "aux": 13, "ang": 13, "lha": 13, "lor": 13, "met": 13, "pfc": 13, "sdr": 13, "ami": 13, "ann": 13, "bas": 13, "cle": 13, "dkq": 13, "gre": 13, "gui": 13, "lav": 13, "lem": 13, "mon": 13, "nca": 13, "pau": 13, "red": 13, "rod": 13, "sae": 13, "tro": 13, "blg": 13, "fcb_de": 10, "bvb": 10, "b04": 10, "rbl": 10, "vfb": 10, "sge": 10, "tsg": 10, "scf": 10, "fch": 10, "svw": 10, "fcaa": 10, "wob": 10, "m05": 10, "bmg": 10, "fcu": 10, "stp": 10, "hsv": 10, "koe": 10, "vfl": 10, "ksv": 10, "heb": 10, "h96": 10, "f95": 10, "fcnb": 10, "ksc": 10, "d98": 10, "spb": 10, "sve": 10, "fck": 10, "fcm": 10, "sgf": 10, "ebs": 10, "pmu": 10, "s04": 10, "dsc": 10, "sgd": 10, "d3_saa": 10, "d3_sch": 10, "d3_aac": 10, "d3_cot": 10, "d3_aue": 10, "d3_ing": 10, "d3_vik": 10, "d3_ros": 10, "d3_reg": 10, "d3_msv": 10, "d3_ess": 10, "d3_ver": 10, "d3_ulm": 10, "d3_wal": 10, "d3_tsg": 10, "d3_1860": 10, "d3_hav": 10, "d3_vfb": 10, "d3_osn": 10, "d3_weh": 10, "in_mbg": 17, "in_blr": 17, "in_che": 17, "in_eb": 17, "in_goa": 17, "in_scd": 17, "in_jam": 17, "in_ker": 17, "in_moh": 17, "in_mum": 17, "in_neu": 17, "in_odi": 17, "in_pun": 17, "in_kas": 17, "int": 18, "mil": 18, "juv": 18, "nap": 18, "rom": 18, "laz": 18, "ata": 18, "fio": 18, "bol": 18, "tor": 18, "gen": 18, "udi": 18, "cag": 18, "lec": 18, "ver": 18, "par": 18, "com": 18, "sas": 18, "cre": 18, "pis": 18, "avi": 18, "bar": 18, "crr": 18, "cat": 18, "ces": 18, "emp": 18, "fro": 18, "jst": 18, "mnt": 18, "mod": 18, "mnz": 18, "pad": 18, "pal": 18, "pes": 18, "reg": 18, "smp": 18, "spz": 18, "ven": 18, "ent": 18, "sud": 18, "ajx": 20, "psv": 20, "fey": 20, "az": 20, "twe": 20, "utr": 20, "hee": 20, "gro": 20, "spa": 20, "nec": 20, "gae": 20, "fos": 20, "pec": 20, "her": 20, "nac": 20, "tel": 20, "exc": 20, "vol": 20, "bod": 21, "brs": 21, "vik": 21, "ros": 21, "mld": 21, "tik": 21, "sar": 21, "fre": 21, "vif": 21, "kfu": 21, "sfo": 21, "kbk": 21, "fkh": 21, "hkm": 21, "sgo": 21, "bry": 21, "no_lil": 21, "no_sta": 21, "no_aal": 21, "lgw": 24, "lpz": 24, "rkc": 24, "jag": 24, "pgs": 24, "crk": 24, "gor": 24, "mtr": 24, "kkl": 24, "pgl": 24, "rdm": 24, "zlu": 24, "wid": 24, "lgd": 24, "wpl": 24, "ark": 24, "bbt": 24, "gks": 24, "scp": 25, "slb": 25, "fcp": 25, "bra": 25, "vsc": 25, "fam": 25, "est": 25, "mor": 25, "giv": 25, "aro": 25, "rio": 25, "scl": 25, "cpi": 25, "cdn": 25, "ema": 25, "alv": 25, "ton": 25, "avs": 25, "ie_boh": 16, "ie_cor": 16, "ie_der": 16, "ie_dro": 16, "ie_gal": 16, "ie_sha": 16, "ie_sli": 16, "ie_shl": 16, "ie_stp": 16, "ie_wat": 16, "ie_dun": 16, "kr_dae": 36, "kr_djn": 36, "kr_any": 36, "kr_seo": 36, "kr_gan": 36, "kr_gim": 36, "kr_gwa": 36, "kr_jeo": 36, "kr_jej": 36, "kr_poh": 36, "kr_suw": 36, "kr_uls": 36, "kr_inc": 36, "kr_buc": 36, "oly": 14, "rw_aek": 14, "rw_ain": 33, "rw_apo": 8, "rw_nac": 7, "rw_bah": 4, "rw_bur": 30, "rw_diz": 19, "rw_dky": 22, "rw_fer": 15, "rw_haj": 19, "rw_hjk": 12, "rw_pan": 14, "rw_pao": 14, "rw_qar": 2, "rw_sha": 22, "rw_sla": 31, "rw_spa": 31, "rw_plz": 31, "ro_arg": 26, "ro_bot": 26, "ro_csi": 26, "ro_cfr": 26, "ro_din": 26, "ro_far": 26, "ro_fcs": 26, "ro_her": 26, "ro_met": 26, "ro_ote": 26, "ro_pet": 26, "ro_rap": 26, "ro_slo": 26, "ro_ucj": 26, "ro_ucr": 26, "ro_uta": 26, "hil": 27, "nas": 27, "ait": 27, "aah": 27, "aqa": 27, "ash": 27, "aet": 27, "atw": 27, "afa": 27, "afy": 27, "akh": 27, "aok": 27, "ari": 27, "dmc": 27, "neo": 27, "akl": 27, "anj": 27, "ahz": 27, "cel_sc": 28, "ran": 28, "hom": 28, "hib": 28, "abe": 28, "dun": 28, "dnd": 28, "kil": 28, "mot": 28, "stm": 28, "fal": 28, "lvn": 28, "rma": 29, "fcb": 29, "atm": 29, "sev": 29, "bet": 29, "val": 29, "vil": 29, "ath": 29, "rso": 29, "cel": 29, "get": 29, "osa": 29, "gir": 29, "ray": 29, "esp": 29, "mal": 29, "ala": 29, "lev": 29, "elc": 29, "ovi": 29, "alb": 29, "alm": 29, "bcf": 29, "cad": 29, "cas": 29, "ceu": 29, "cor": 29, "dep": 29, "eib": 29, "gra": 29, "hue": 29, "lpa": 29, "leg": 29, "mlg": 29, "mir": 29, "rac": 29, "rsb": 29, "rva": 29, "spg": 29, "zar": 29, "and_ad": 29, "cul": 29, "mff": 37, "aik": 37, "dif": 37, "ham": 37, "ifk": 37, "hac": 37, "ino": 37, "elf": 37, "mjb": 37, "sir": 37, "bpk": 37, "hbk": 37, "gai": 37, "deg": 37, "vrn": 37, "ost": 37, "se_vas": 37, "se_kal": 37, "se_ory": 37, "baf": 38, "yb": 38, "ser": 38, "lug": 38, "fcz": 38, "gcz": 38, "fcsg": 38, "lzn": 38, "lau": 38, "sio": 38, "thu": 38, "win": 38, "gal": 32, "fen": 32, "bes": 32, "trb": 32, "ibf": 32, "sam": 32, "goz": 32, "kon": 32, "kas": 32, "aly": 32, "atp": 32, "kay": 32, "riz": 32, "eyp": 32, "gaz": 32, "koc": 32, "gcb": 32, "fkk": 32, "mia": 34, "lag": 34, "lafc": 34, "sea": 34, "nyc": 34, "rbn": 34, "atl": 34, "clb": 34, "por": 34, "tfc": 5, "us_atx": 34, "us_mtl": 5, "us_clt": 34, "us_chi": 34, "us_col": 34, "us_dcu": 34, "us_cin": 34, "us_dal": 34, "us_hou": 34, "us_min": 34, "us_nsh": 34, "us_ner": 34, "us_orl": 34, "us_phi": 34, "us_rsl": 34, "us_sdg": 34, "us_sje": 34, "us_skc": 34, "us_stl_c": 34, "us_van": 5 }, o = {}; for (const k in M) o[k] = C[M[k]]; return o; })();
    const pool = () => (typeof MASTER_CLUBS !== "undefined" ? MASTER_CLUBS : []).map(c => ({ id: c.id, name: c.name, color: c.color || hashColor(c.id), lg: c.leagueName || null, elo: c.elo, label: c.leagueName || LEAGUE_LABEL[c.league] || c.league || "Overig", cn: CLUB_COUNTRY[c.id] || c.leagueName || LEAGUE_LABEL[c.league] || "Onbekend" }));

    /* ---------- opslag ---------- */
    function load() { try { const o = JSON.parse(localStorage.getItem(KEY)); if (o && Array.isArray(o.items)) DB = o; } catch (e) { } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { say("⚠️ Opslaan mislukt (opslag vol?). Exporteer je toernooi als back-up.", 8000); } }
    const cur = () => DB.items.find(t => t.id === UI.tid);
    function persist() { const t = cur(); if (t) t.updatedAt = Date.now(); save(); }
    function setTM(t) { TM = new Map(t.teams.map(x => [x.id, x])); }
    const nm = id => (TM.get(id) ? TM.get(id).name : "?");
    const dot = id => `<span class="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-white/50" style="background:${esc((TM.get(id) || {}).color || "#64748b")}"></span>`;
    const teamHtml = id => `<span class="inline-flex items-center gap-1.5 min-w-0">${dot(id)}<span class="truncate">${esc(nm(id))}</span></span>`;
    const phaseIdx = () => (/^p\d+$/.test(UI.tab) ? +UI.tab.slice(1) : -1);

    /* ---------- hub ---------- */
    function showHub() {
        if (typeof activeSaveId !== "undefined" && activeSaveId && typeof flushSave === "function") { try { flushSave(); } catch (e) { } }
        g("trn-root").classList.add("hidden");
        const n = DB.items.length;
        g("hub-trn-count").textContent = n ? `${n} toernooi${n === 1 ? "" : "en"} bewaard` : "Nog geen toernooien";
        g("hub").classList.remove("hidden"); g("hub").classList.add("flex");
    }
    function hideHub() { g("hub").classList.add("hidden"); g("hub").classList.remove("flex"); }
    function openTournaments() {
        hideHub(); UI.screen = "list";
        g("trn-root").classList.remove("hidden");
        render();
    }
    function enterImperialism() {
        hideHub(); g("trn-root").classList.add("hidden");
        if (typeof activeSaveId !== "undefined" && activeSaveId) { closeSaveMenu(); try { map.invalidateSize(); } catch (e) { } }
        else openSaveMenu();
    }

    /* ---------- render ---------- */
    function render(toTop) {
        const r = root(); if (!r) return;
        const sc = toTop ? 0 : r.scrollTop;
        let html = "";
        if (UI.screen === "list") html = listScreen();
        else if (UI.screen === "wizard") html = wizardScreen();
        else if (UI.screen === "gstats") html = gstatsScreen();
        else { const t = cur(); if (!t) { UI.screen = "list"; html = listScreen(); } else { setTM(t); html = viewScreen(t); } }
        r.innerHTML = html;
        if (UI.screen === "wizard") { refreshPicker(); refreshPlan(); }
        /* Pas terugzetten NA het vullen van de wizard-onderdelen: anders is de pagina even te kort en springt het scherm naar boven. */
        r.scrollTop = sc;
        requestAnimationFrame(() => { r.scrollTop = sc; });
    }
    const topbar = (title, right = "") => `<div class="sticky top-0 z-20 bg-[#050b16]/95 backdrop-blur border-b border-slate-800 px-3 py-2.5 flex items-center gap-2">
<button data-a="hub" class="btn" title="Hoofdmenu"><i class="fa-solid fa-house"></i></button>
<div class="font-broadcast text-xl font-extrabold text-white truncate flex-1 min-w-0">${title}</div>${right}</div>`;

    /* ---------- lijst ---------- */
    function listScreen() {
        const items = [...DB.items].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        let h = topbar("Toernooien", `<label class="btn btn-sky cursor-pointer"><i class="fa-solid fa-file-import mr-1"></i>Importeer<input id="trn-import" type="file" accept="application/json,.json" class="hidden"></label>
    <button data-a="gstats" class="btn btn-sky"><i class="fa-solid fa-chart-column mr-1"></i>Statistieken</button>
    <button data-a="new" class="btn btn-gold"><i class="fa-solid fa-plus mr-1"></i>Nieuw toernooi</button>`);
        h += `<div class="max-w-3xl mx-auto p-3 space-y-3">`;
        if (!items.length) h += `<div class="card text-center py-10"><div class="text-amber-400 text-3xl mb-2"><i class="fa-solid fa-trophy"></i></div><div class="text-white font-bold">Nog geen toernooien</div><p class="text-xs text-slate-400 mt-1">Maak je eerste toernooi: kies teams en een formaat.</p><button data-a="new" class="btn btn-gold mt-4">Nieuw toernooi</button></div>`;
        for (const t of items) {
            setTM(t);
            const done = t.phases.filter(p => p.status === "done").length, champ = E.champion(t);
            h += `<div class="card"><div class="flex items-start justify-between gap-2">
        <div class="min-w-0"><div class="font-bold text-white truncate">${esc(t.name)}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">${t.teams.length} teams • ${t.phases.map(p => esc(p.name)).join(" → ")}</div>
        <div class="text-[11px] mt-0.5 ${champ ? "text-amber-300 font-bold" : "text-slate-500"}">${champ ? "\u{1F3C6} " + esc(nm(champ)) : `Fase ${Math.min(done + 1, t.phases.length)} van ${t.phases.length} bezig`}</div></div>
        <button data-a="open" data-id="${t.id}" class="btn btn-gold shrink-0">Openen</button></div>
        <div class="flex gap-1.5 mt-2.5"><button data-a="export-t" data-id="${t.id}" class="btn"><i class="fa-solid fa-download mr-1"></i>Exporteer</button>
        <button data-a="del-t" data-id="${t.id}" class="btn btn-red"><i class="fa-solid fa-trash mr-1"></i>Verwijder</button></div></div>`;
        }
        return h + `<p class="text-[10px] text-slate-500 text-center pt-2">Toernooien staan in de browser van dit toestel. Exporteer af en toe een bestand als back-up.</p></div>`;
    }

    /* ---------- statistieken over alle toernooien ---------- */
    function gstatsScreen() {
        if (GS.scope !== "all" && !DB.items.some(t => t.id === GS.scope)) GS.scope = "all";
        const D = TStats.build(DB.items, GS.scope, pool());
        return topbar("Statistieken", `<button data-a="list" class="btn"><i class="fa-solid fa-arrow-left mr-1"></i>Toernooien</button>`)
            + `<div class="max-w-5xl mx-auto p-3 space-y-3">${TStats.html(D, GS, esc, DB.items.map(t => ({ id: t.id, name: t.name })))}</div>`;
    }

    /* ---------- wizard ---------- */
    function newWizard() {
        W = { name: "", teams: [], tpl: "league1", dirty: false, rules: { win: 3, draw: 1, loss: 0, tiebreak: "gd" }, q: "", lg: "all", cn: 0, sort: "default", phases: [] };
        W.phases = E.template("league1", 16);
    }
    function reapplyTpl() { if (W.tpl !== "custom" && !W.dirty) W.phases = E.template(W.tpl, W.teams.length || 16); }
    function wizardScreen() {
        const tplBtn = (k, label, sub) => `<button data-a="tpl" data-v="${k}" class="text-left rounded-xl border p-2.5 ${W.tpl === k ? "border-amber-400 bg-amber-400/10" : "border-slate-700 bg-slate-950/60 hover:border-slate-500"}"><div class="text-xs font-extrabold ${W.tpl === k ? "text-amber-300" : "text-white"}">${label}</div><div class="text-[10px] text-slate-400 leading-snug">${sub}</div></button>`;
        return topbar("Nieuw toernooi", `<button data-a="cancel-w" class="btn">Annuleren</button>`) + `<div class="max-w-5xl mx-auto p-3 space-y-3">
<div class="card"><span class="lbl">1. Naam</span><input id="w-name" data-live="name" class="inp" maxlength="50" placeholder="bv. Vrienden Champions League" value="${esc(W.name)}"></div>

<div class="card"><div class="flex items-center justify-between mb-2"><span class="lbl !mb-0">2. Teams <span id="w-count" class="text-amber-300"></span></span>
    <span class="text-[10px] text-slate-500">Volgorde = seeding (sterkste bovenaan)</span></div>
    <div class="grid md:grid-cols-2 gap-3">
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-2"><select id="w-lg" data-live="lg" class="inp"></select><input id="w-q" data-live="q" class="inp" placeholder="Zoek club..." autocomplete="off" value="${esc(W.q)}"></div>
        <div><span class="lbl">Sorteer lijst</span><select id="w-sortsel" data-live="sort" class="inp"><option value="default">Standaard</option><option value="elo_desc">Elo hoog → laag</option><option value="elo_asc">Elo laag → hoog</option><option value="az">A–Z</option></select></div>
        <div class="flex flex-wrap gap-1.5"><button data-a="w-all" class="btn">Alles in filter</button><button data-a="w-none" class="btn">Filter wissen</button><button data-a="w-clear" class="btn btn-red">Alles wissen</button></div>
        <div class="rounded-lg border border-slate-700 bg-slate-950/60 p-2.5 space-y-2">
          <span class="lbl !mb-0"><i class="fa-solid fa-wand-magic-sparkles mr-1 text-amber-300"></i>Slimme selectie <span class="text-slate-500 normal-case font-normal">(binnen het filter hierboven, vervangt je huidige selectie)</span></span>
          <div class="grid grid-cols-3 gap-2">
            <div><span class="lbl">Aantal teams</span><input id="w-rn" type="number" min="1" class="inp" placeholder="bv. 16"></div>
            <div><span class="lbl">Max per land</span><input id="w-mc" type="number" min="1" class="inp" placeholder="geen"></div>
            <div><span class="lbl">Max landen</span><input id="w-ml" type="number" min="1" class="inp" placeholder="geen"></div>
          </div>
          <div class="flex flex-wrap gap-1.5"><button data-a="w-top" class="btn btn-gold"><i class="fa-solid fa-ranking-star mr-1"></i>Hoogste Elo</button><button data-a="w-rand" class="btn"><i class="fa-solid fa-dice mr-1"></i>Willekeurig</button></div>
          <div class="text-[10px] text-slate-500 leading-snug">Max per land: bv. 16 teams met max 2 per land = de 16 beste teams, maar nooit meer dan 2 uit hetzelfde land. Max landen: teams komen uit hooguit zoveel verschillende landen. Beide ook bij "Willekeurig" te gebruiken.</div>
        </div>
        <div id="w-results" class="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1"></div>
        <div><span class="lbl">Eigen teams (één naam per regel)</span><textarea id="w-custom" rows="3" class="inp" placeholder="Lars&#10;Jonas&#10;Team Pizza"></textarea><button data-a="w-addcustom" class="btn mt-1.5">Toevoegen</button></div>
      </div>
      <div><div class="flex gap-1.5 mb-1.5"><button data-a="w-shuffle" class="btn"><i class="fa-solid fa-shuffle mr-1"></i>Husselen</button><button data-a="w-sort" class="btn">A–Z</button><button data-a="w-sortelo" class="btn">Elo ↓</button></div>
      <div id="w-sel" class="max-h-96 overflow-y-auto space-y-1 pr-1"></div></div>
    </div></div>

<div class="card"><span class="lbl">3. Formaat</span>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      ${tplBtn("league1", "Competitie", "Iedereen speelt één keer tegen elkaar")}
      ${tplBtn("league2", "Competitie heen & terug", "Thuis- en uitwedstrijd")}
      ${tplBtn("ko", "Knock-out", "Enkele eliminatie, bracket met vrijstellingen")}
      ${tplBtn("groups_ko", "Groepen + knock-out", "Groepen, top 2 gaat door")}
      ${tplBtn("groups_best", "Groepen + beste nummers 3", "Zoals WK/EK: bracket van 2^n")}
      ${tplBtn("ucl", "Champions League-stijl", "Eén league phase, top 2/3 naar knock-out heen & terug")}
      ${tplBtn("ucl_po", "Champions League + play-offs", "De beste teams slaan de play-offs over en gaan direct naar de knock-out")}
      ${tplBtn("custom", "Eigen formaat", "Begin leeg en stapel zelf fases")}
    </div>
    <div id="w-phases" class="space-y-2 mt-3"></div>
    <div class="flex flex-wrap items-center gap-2 mt-2"><select id="w-addtype" class="inp !w-auto"><option value="league">Competitie</option><option value="groups">Groepsfase</option><option value="swiss">League phase (Zwitsers)</option><option value="knockout">Knock-out</option></select><button data-a="add-ph" class="btn btn-sky"><i class="fa-solid fa-plus mr-1"></i>Fase toevoegen</button></div>
</div>

<div class="card"><span class="lbl">4. Punten & gelijke stand</span>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div><span class="lbl">Winst</span><input data-c="rule" data-k="win" data-t="n" type="number" class="inp" value="${W.rules.win}"></div>
      <div><span class="lbl">Gelijk</span><input data-c="rule" data-k="draw" data-t="n" type="number" class="inp" value="${W.rules.draw}"></div>
      <div><span class="lbl">Verlies</span><input data-c="rule" data-k="loss" data-t="n" type="number" class="inp" value="${W.rules.loss}"></div>
      <div><span class="lbl">Bij gelijke punten</span><select data-c="rule" data-k="tiebreak" class="inp"><option value="gd" ${W.rules.tiebreak === "gd" ? "selected" : ""}>Doelsaldo</option><option value="h2h" ${W.rules.tiebreak === "h2h" ? "selected" : ""}>Onderling resultaat</option></select></div>
    </div></div>

<div class="card"><div id="w-summary"></div></div></div>`;
    }
    function refreshPicker() {
        const sel = new Set(W.teams.map(t => t.id));
        const all = pool();
        const labels = [...new Set(all.map(c => c.label))].sort((a, b) => a.localeCompare(b));
        const lgSel = g("w-lg");
        if (lgSel && !lgSel.dataset.built) {
            lgSel.innerHTML = `<option value="all">Alle competities</option>` + labels.map(l => `<option value="${esc(l)}">${esc(l)} (${all.filter(c => c.label === l).length})</option>`).join("");
            lgSel.dataset.built = "1";
        }
        if (lgSel) lgSel.value = W.lg;
        const q = W.q.trim().toLowerCase();
        const list = all.filter(c => (W.lg === "all" || c.label === W.lg) && (!q || c.name.toLowerCase().includes(q)));
        const so = W.sort || "default";
        if (so === "elo_desc") list.sort((a, b) => (b.elo || 0) - (a.elo || 0));
        else if (so === "elo_asc") list.sort((a, b) => (a.elo || 0) - (b.elo || 0));
        else if (so === "az") list.sort((a, b) => a.name.localeCompare(b.name));
        const ssel = g("w-sortsel"); if (ssel) ssel.value = so;
        const shown = list.slice(0, 200);
        const rs = g("w-results");
        if (rs) rs.innerHTML = shown.map(c => `<button data-a="w-toggle" data-id="${esc(c.id)}" class="chip ${sel.has(c.id) ? "on" : ""}"><span class="w-2 h-2 rounded-full inline-block" style="background:${esc(c.color)}"></span>${esc(c.name)}${typeof c.elo === "number" ? ` <span class="text-slate-500 text-[10px]">${c.elo}</span>` : ""}</button>`).join("") + (list.length > shown.length ? `<div class="text-[10px] text-slate-500 w-full">+${list.length - shown.length} meer, verfijn je zoekopdracht</div>` : "") + (!list.length ? `<div class="text-xs text-slate-500">Geen clubs gevonden.</div>` : "");
        const cnt = g("w-count"); if (cnt) cnt.textContent = `• ${W.teams.length} gekozen`;
        const sl = g("w-sel");
        if (sl) sl.innerHTML = W.teams.length ? W.teams.map((t, i) => `<div class="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1">
    <span class="text-[10px] text-slate-500 w-5 text-right">${i + 1}</span><span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${esc(t.color)}"></span>
    <span class="flex-1 truncate text-xs text-slate-100 font-semibold">${esc(t.name)}${t.cn ? ` <span class="text-slate-500 font-normal">· ${esc(t.cn)}</span>` : (t.lg ? ` <span class="text-slate-500 font-normal">· ${esc(t.lg)}</span>` : "")}${typeof t.elo === "number" ? ` <span class="text-amber-300/80 font-normal text-[10px]">${t.elo}</span>` : ""}</span>
    <button data-a="w-up" data-i="${i}" class="text-slate-400 hover:text-white px-1">▲</button><button data-a="w-down" data-i="${i}" class="text-slate-400 hover:text-white px-1">▼</button><button data-a="w-rm" data-i="${i}" class="text-rose-400 px-1">✕</button></div>`).join("") : `<div class="text-xs text-slate-500 italic py-4 text-center">Nog geen teams gekozen. Klik clubs links aan of typ eigen namen.</div>`;
    }
    function teamsChanged() { reapplyTpl(); refreshPicker(); refreshPlan(); }

    const phaseFields = (p, i) => {
        const f = (label, inner) => `<div><span class="lbl">${label}</span>${inner}</div>`;
        const num = (k, v, min = 1) => `<input data-c="ph" data-i="${i}" data-k="${k}" data-t="n" type="number" min="${min}" class="inp" value="${v == null ? "" : v}">`;
        const sel = (k, v, opts, t = "s") => `<select data-c="ph" data-i="${i}" data-k="${k}" data-t="${t}" class="inp">${opts.map(([val, lab]) => `<option value="${val}" ${String(v) === String(val) ? "selected" : ""}>${lab}</option>`).join("")}</select>`;
        const chk = (k, v, lab) => `<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" data-c="ph" data-i="${i}" data-k="${k}" data-t="b" ${v ? "checked" : ""} class="accent-amber-400 w-4 h-4">${lab}</label>`;
        const c = p.cfg;
        if (p.type === "league") return f("Wedstrijden per paar", sel("cfg.legs", c.legs, [[1, "1x (enkel)"], [2, "2x (heen & terug)"]], "n"));
        if (p.type === "groups") return f("Aantal groepen", num("cfg.groups", c.groups)) + f("Wedstrijden per paar", sel("cfg.legs", c.legs, [[1, "1x"], [2, "2x (heen & terug)"]], "n")) + f("Loting", sel("cfg.draw", c.draw, [["pots", "Potten (op seeding)"], ["random", "Volledig willekeurig"]]));
        if (p.type === "swiss") return f("Wedstrijden per team", num("cfg.games", c.games)) + f("Aantal potten", num("cfg.pots", c.pots)) + `<div class="flex items-end">${chk("cfg.avoid", c.avoid, "Vermijd clubs uit dezelfde competitie")}</div>`;
        return f("Seeding", sel("cfg.seeding", c.seeding, [["seeded", "Op rangorde (1 vs laatste)"], ["random", "Willekeurig"]])) + `<div class="space-y-1.5 flex flex-col justify-end">${chk("cfg.twoLegged", c.twoLegged, "Heen & terug (behalve finale)")}${chk("cfg.finalTwoLegged", c.finalTwoLegged, "Finale ook heen & terug")}${chk("cfg.thirdPlace", c.thirdPlace, "Troostfinale")}</div>` + f("Aantal rondes (leeg = tot de finale)", num("cfg.rounds", c.rounds));
    };
    function remapRoutes(fn) {
        W.phases.forEach(p => { p.routes = (p.routes || []).map(r => ({ ...r, dest: fn(r.dest) })).filter(r => r.dest >= 0); });
    }
    function refreshPlan() {
        const box = g("w-phases"); if (!box) return;
        const n = W.teams.length, pl = E.plan(W.phases, n || 0), L = W.phases.length;
        const cn = v => (typeof v === "number" && !Number.isNaN(v)) ? v : "?";
        box.innerHTML = W.phases.map((p, i) => {
            const info = pl.info[i] || { count: NaN, matches: 0 };
            const cnt = info.count, last = i === L - 1, next = W.phases[i + 1];
            let flow = "";
            if (last) {
                flow = `<div class="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-2">🏆 Laatste fase: de nummer 1 is de winnaar van het toernooi.</div>`;
            } else {
                const adv = p.advance, miss = adv == null || adv === "" || !(+adv >= 1);
                const routes = p.routes || [];
                const skipSum = routes.reduce((q, r) => q + (+r.count || 0), 0);
                const rest = miss ? null : (+adv - skipSum);
                const routeRows = routes.map((r, k) => {
                    let opts = ""; for (let j = i + 2; j < L; j++) opts += `<option value="${j}" ${+r.dest === j ? "selected" : ""}>Fase ${j + 1} (${esc(W.phases[j].name)})</option>`;
                    if (!(r.dest >= i + 2 && r.dest < L)) opts = `<option value="" selected>Kies fase…</option>` + opts;
                    return `<div class="flex flex-wrap items-center gap-2 text-xs text-slate-200 bg-slate-900/70 border border-slate-700 rounded-lg p-2">De beste <input data-c="route" data-i="${i}" data-r="${k}" data-k="count" type="number" min="1" class="inp !w-16" value="${r.count == null ? "" : r.count}"> teams slaan <b>${esc(next.name)}</b> over en gaan direct naar <select data-c="route" data-i="${i}" data-r="${k}" data-k="dest" class="inp !w-auto">${opts}</select><button data-a="route-rm" data-i="${i}" data-r="${k}" class="btn btn-red ml-auto" title="Verwijder">✕</button></div>`;
                }).join("");
                const canRoute = i + 2 < L;
                flow = `<div class="rounded-lg border ${miss ? "border-rose-400 bg-rose-500/10" : "border-sky-400/40 bg-sky-500/10"} p-2.5 space-y-2">
                  <div><span class="lbl">Hoeveel teams gaan door naar de volgende ronde? *</span>
                  <div class="flex flex-wrap items-center gap-2"><input data-c="ph" data-i="${i}" data-k="advance" data-t="n" type="number" min="1" class="inp !w-24" placeholder="aantal" value="${adv == null ? "" : adv}">
                  <span class="text-[11px] text-slate-300">van de ${cn(cnt)} teams${!miss && typeof cnt === "number" && +adv <= cnt ? ` • ${cnt - adv} vallen af` : ""}</span></div></div>
                  ${routeRows}
                  ${canRoute ? `<button data-a="route-add" data-i="${i}" class="btn btn-sky"><i class="fa-solid fa-forward mr-1"></i>Laat de beste teams een ronde overslaan</button>` : `<div class="text-[10px] text-slate-500">Wil je dat de beste teams een ronde overslaan? Voeg dan eerst nog een fase toe na de volgende fase.</div>`}
                  ${!miss && rest != null ? (rest >= 0 ? `<div class="text-[11px] text-slate-200">→ <b>${rest}</b> team${rest === 1 ? "" : "s"} gaan naar <b>${esc(next.name)}</b>${skipSum ? ` • <b>${skipSum}</b> direct verder` : ""}</div>` : "") : `<div class="text-[11px] text-rose-300">Vul in hoeveel teams er doorgaan, dan weet het systeem wie er naar de volgende fase mag.</div>`}
                  ${p.type === "knockout" && info.remain != null && !miss && +adv !== info.remain ? `<div class="text-[11px] text-amber-300">Let op: na deze knock-out blijven er ${info.remain} winnaar${info.remain === 1 ? "" : "s"} over, maar jij laat er ${adv} door.</div>` : ""}
                </div>`;
            }
            return `<div class="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><div class="flex items-center gap-2 mb-2"><span class="text-[10px] font-black text-amber-300 uppercase">Fase ${i + 1}</span><span class="text-[10px] text-slate-400">${esc(E.TYPE_LABEL[p.type])}</span>
        <input data-live="phname" data-i="${i}" class="inp !py-1 flex-1" value="${esc(p.name)}"><button data-a="ph-up" data-i="${i}" class="btn">▲</button><button data-a="ph-down" data-i="${i}" class="btn">▼</button><button data-a="ph-rm" data-i="${i}" class="btn btn-red">✕</button></div>
        <div class="text-[11px] text-slate-300 mb-2"><b>${cn(cnt)}</b> teams doen mee${i === 0 ? " (alle gekozen teams)" : ""}${info.matches ? ` • ca. ${info.matches} wedstrijden` : ""}</div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">${phaseFields(p, i)}</div>
        <div class="mt-3">${flow}</div></div>`;
        }).join("") || `<div class="text-xs text-slate-500 italic">Geen fases. Kies een sjabloon of voeg een fase toe.</div>`;
        const total = pl.info.reduce((s, x) => s + x.matches, 0);
        const ok = !pl.errors.length && n >= 2 && W.name.trim().length > 0;
        const errs = [...pl.errors]; if (n < 2) errs.unshift("Kies minstens 2 teams."); if (!W.name.trim()) errs.unshift("Geef het toernooi een naam.");
        g("w-summary").innerHTML = `<div class="flex flex-wrap items-center justify-between gap-2"><div><div class="text-sm font-bold text-white">${n} teams • ${W.phases.length} fase${W.phases.length === 1 ? "" : "s"} • ca. ${total} wedstrijden</div>
    ${errs.length ? `<ul class="text-xs text-rose-300 mt-1 space-y-0.5">${errs.map(e => `<li>• ${esc(e)}</li>`).join("")}</ul>` : `<div class="text-xs text-emerald-300 mt-1">Klaar om te starten.</div>`}</div>
    <button data-a="w-create" class="btn btn-green !text-sm !px-5 !py-2.5" ${ok ? "" : "disabled"}>Start toernooi</button></div>`;
    }
    function setPath(obj, path, val) { const ks = path.split("."); let o = obj; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; }

    function createTournament() {
        const pl = E.plan(W.phases, W.teams.length);
        if (pl.errors.length || W.teams.length < 2 || !W.name.trim()) return;
        try {
            const t = E.create(W.name.trim(), W.teams, W.phases, W.rules);
            DB.items.push(t); UI = { screen: "view", tid: t.id, tab: "p0", sub: "table", team: "" };
            persist(); W = null; render(true);
        } catch (e) { say("⚠️ " + e.message, 7000); }
    }

    /* ---------- toernooi-overzicht ---------- */
    function viewScreen(t) {
        const tabs = [["overview", "Overzicht"], ...t.phases.map((p, i) => ["p" + i, esc(p.name)]), ["stats", "Statistieken"]];
        let h = topbar(esc(t.name), `<button data-a="list" class="btn">Alle toernooien</button>`);
        h += `<div class="sticky top-[53px] z-10 bg-[#050b16]/95 border-b border-slate-800 overflow-x-auto flex px-2">${tabs.map(([k, l]) => `<button data-a="tab" data-v="${k}" class="tab ${UI.tab === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
        h += `<div class="max-w-5xl mx-auto p-3 space-y-3">`;
        if (UI.tab === "overview") h += overviewHTML(t);
        else if (UI.tab === "stats") h += statsHTML(t);
        else { const i = phaseIdx(); h += t.phases[i] ? phaseHTML(t, i) : overviewHTML(t); }
        return h + `</div>`;
    }
    function advanceText(t, i) {
        const p = t.phases[i], L = t.phases.length;
        if (i === L - 1) return "🏆 Laatste fase: de nummer 1 is de winnaar van het toernooi.";
        const next = t.phases[i + 1], cnt = p.entrants ? p.entrants.length : null;
        if (!t.v2) {
            const from = Math.max(1, +(next.take || {}).from || 1), to = +(next.take || {}).to || cnt;
            return `Plaats ${from}${to ? ` t/m ${to}` : " en lager"} gaan door naar <b>${esc(next.name)}</b>.`;
        }
        const adv = Math.floor(+p.advance) || 0; let rest = adv, pos = 0; const bits = [];
        for (const r of (p.routes || [])) {
            const c = Math.floor(+r.count) || 0; if (c < 1) continue;
            bits.push(`plaats ${pos + 1}${c > 1 ? "–" + (pos + c) : ""} → direct naar <b>${esc((t.phases[r.dest] || {}).name || "?")}</b>`);
            pos += c; rest -= c;
        }
        if (rest > 0) bits.push(`plaats ${pos + 1}${rest > 1 ? "–" + adv : ""} → <b>${esc(next.name)}</b>`);
        return `<b>${adv}</b>${cnt ? ` van de ${cnt}` : ""} teams gaan door: ${bits.join(" • ")}.${cnt && cnt > adv ? ` De overige ${cnt - adv} vallen af.` : ""}`;
    }
    function statusBadge(p) {
        const pr = E.progress(p);
        if (p.status === "done") return `<span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">KLAAR</span>`;
        if (p.status === "active") return `<span class="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">BEZIG ${pr.done}/${pr.total}</span>`;
        return `<span class="text-[10px] font-black px-2 py-0.5 rounded bg-slate-700 text-slate-300">WACHT</span>`;
    }
    function overviewHTML(t) {
        const champ = E.champion(t);
        let h = champ ? `<div class="card text-center border-amber-400/60 bg-amber-400/10"><div class="text-4xl">\u{1F3C6}</div><div class="text-[10px] uppercase tracking-widest text-amber-300 font-black mt-1">Winnaar</div><div class="font-broadcast text-3xl font-extrabold text-white">${esc(nm(champ))}</div></div>` : "";
        h += `<div class="space-y-2">` + t.phases.map((p, i) => {
            const prevDone = i === 0 || t.phases[i - 1].status === "done";
            let action = "";
            if (p.status === "pending" && prevDone) action = `<button data-a="start-ph" data-i="${i}" class="btn btn-green">Start (loting)</button>`;
            else if (p.status !== "pending") action = `<button data-a="tab" data-v="p${i}" class="btn btn-gold">Openen</button>`;
            const cnt = p.entrants ? p.entrants.length : null;
            return `<div class="card flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black text-amber-300">${i + 1}</div>
        <div class="flex-1 min-w-0"><div class="font-bold text-white truncate">${esc(p.name)} ${statusBadge(p)}</div><div class="text-[11px] text-slate-400">${esc(E.TYPE_LABEL[p.type])}${cnt ? ` • ${cnt} teams` : ""}${p.status === "pending" && !prevDone ? " • wacht op vorige fase" : ""}</div><div class="text-[11px] text-sky-300/90 mt-0.5">${advanceText(t, i)}</div></div>${action}</div>`;
        }).join("") + `</div>`;
        h += `<div class="card"><span class="lbl">Teams (${t.teams.length})</span><div class="flex flex-wrap gap-1.5">${t.teams.map(x => `<span class="chip" style="cursor:default" title="${typeof x.elo === 'number' ? 'Elo ' + x.elo : ''}"><span class="w-2 h-2 rounded-full inline-block" style="background:${esc(x.color)}"></span>${esc(x.name)}${typeof x.elo === "number" ? ` <span class="text-slate-500 text-[10px]">${x.elo}</span>` : ""}</span>`).join("")}</div>
    <div class="text-[11px] text-slate-500 mt-2">Punten: winst ${t.rules.win}, gelijk ${t.rules.draw}, verlies ${t.rules.loss} • bij gelijke stand: ${t.rules.tiebreak === "h2h" ? "onderling resultaat" : "doelsaldo"}</div></div>
    <div class="flex gap-2 flex-wrap"><button data-a="export-t" data-id="${t.id}" class="btn"><i class="fa-solid fa-download mr-1"></i>Exporteer toernooi</button><button data-a="rename-t" class="btn">Hernoem</button><button data-a="del-t" data-id="${t.id}" class="btn btn-red"><i class="fa-solid fa-trash mr-1"></i>Verwijder</button></div>`;
        return h;
    }

    /* ---------- fase-weergave ---------- */
    /* ---------- simuleren (UI) ---------- */
    function simLabel() {
        const n = (UI.simEx || []).length;
        return n ? `Simuleer alles behalve ${n} geselecteerd${n === 1 ? " team" : "e teams"}` : "Simuleer alles behalve… (selecteer eerst teams)";
    }
    function simHTML(t, idx) {
        const p = t.phases[idx];
        if (p.status !== "active") return "";
        const ex = new Set(UI.simEx || []);
        const chips = p.entrants.map(id => `<button data-a="sim-toggle" data-id="${esc(id)}" class="chip ${ex.has(id) ? "on" : ""}">${dot(id)}${esc(nm(id))}</button>`).join("");
        return `<div class="card space-y-2.5"><span class="lbl !mb-0"><i class="fa-solid fa-dice mr-1 text-amber-300"></i>Simuleren</span>
            <div class="text-[11px] text-slate-400 -mt-1">Uitslagen worden vooral bepaald door de <b class="text-amber-300">Elo</b> van beide teams: een sterker team scoort gemiddeld meer, maar een verrassing blijft mogelijk.</div>
            <div class="flex flex-wrap gap-2"><button data-a="sim-next" class="btn btn-sky"><i class="fa-solid fa-forward-step mr-1"></i>Simuleer volgende wedstrijd</button>
            <button data-a="sim-all" class="btn btn-green"><i class="fa-solid fa-forward-fast mr-1"></i>Simuleer alles</button></div>
            <div><span class="lbl">Teams die je zelf speelt (hun wedstrijden worden overgeslagen)</span>
            <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">${chips}</div>
            <div class="flex flex-wrap gap-2 mt-2"><button id="sim-ex-btn" data-a="sim-ex" class="btn btn-gold">${simLabel()}</button><button data-a="sim-clear" class="btn">Selectie wissen</button></div></div></div>`;
    }
    function refreshSimBtn() { const b = g("sim-ex-btn"); if (b) b.textContent = simLabel(); }
    function simNextUI() {
        const t = cur(), idx = phaseIdx(); if (!t || idx < 0) return;
        const ph = t.phases[idx]; if (ph.status !== "active") { say("Deze fase is al klaar."); return; }
        const r = E.simNext(t, idx);
        if (!r) { say("Geen wedstrijden meer om te simuleren."); return; }
        persist(); render();
        let msg = r.m ? `Gesimuleerd: ${nm(r.m.home)} ${r.h}-${r.a} ${nm(r.m.away)}` : "Strafschoppen gesimuleerd";
        if (ph.status === "done") msg += ` • ${ph.name} is klaar!`;
        say(msg, 4000);
    }
    function simAllUI(useEx) {
        const t = cur(), idx = phaseIdx(); if (!t || idx < 0) return;
        const ph = t.phases[idx]; if (ph.status !== "active") { say("Deze fase is al klaar."); return; }
        const ex = useEx ? new Set(UI.simEx || []) : new Set();
        if (useEx && !ex.size) { say("Selecteer eerst de teams die je zelf wilt spelen."); return; }
        const q = useEx ? `Alle openstaande wedstrijden simuleren, behalve die van ${ex.size} geselecteerd(e) team(s)?` : "Alle openstaande wedstrijden van deze fase simuleren?";
        if (!confirm(q)) return;
        const n = E.simAll(t, idx, ex);
        persist(); render();
        let msg = n ? `${n} wedstrijd${n === 1 ? "" : "en"} gesimuleerd` : "Niets te simuleren";
        if (ph.status === "done") msg += ` • ${ph.name} is klaar!`;
        else if (useEx) msg += " • de rest is voor jou";
        say(msg, 5000);
    }

    function phaseHTML(t, idx) {
        const p = t.phases[idx], prevDone = idx === 0 || t.phases[idx - 1].status === "done";
        if (p.status === "pending") return `<div class="card text-center py-8"><div class="font-bold text-white">${esc(p.name)}</div><p class="text-xs text-slate-400 mt-1">${prevDone ? "Klaar om te starten." : "Deze fase start zodra de vorige fase klaar is."}</p>${prevDone ? `<button data-a="start-ph" data-i="${idx}" class="btn btn-green mt-3">Start fase (loting)</button>` : ""}</div>`;
        let h = "";
        const next = t.phases[idx + 1];
        if (p.status === "done") {
            if (next && next.status === "pending") h += `<div class="card flex flex-wrap items-center justify-between gap-2 border-emerald-500/50 bg-emerald-500/10"><div class="text-sm text-emerald-200 font-bold">✓ ${esc(p.name)} is klaar. ${esc(next.name)} kan starten.</div><button data-a="start-ph" data-i="${idx + 1}" class="btn btn-green">Start ${esc(next.name)} →</button></div>`;
            else if (!next) h += `<div class="card border-amber-400/50 bg-amber-400/10 text-center"><div class="text-amber-300 font-black">\u{1F3C6} Toernooi afgerond: ${esc(nm(p.ranking[0]))}</div></div>`;
        }
        if (p.warn) h += `<div class="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">${esc(p.warn)}</div>`;
        h += `<div class="text-xs text-sky-200 bg-sky-500/10 border border-sky-400/30 rounded-lg px-3 py-2">${advanceText(t, idx)}</div>`;
        setNextCtx(t, p);
        h += nextBannerHTML();
        h += simHTML(t, idx);
        if (p.type === "knockout") {
            h += koHTML(t, idx);
        } else {
            h += `<div class="flex items-center gap-2"><button data-a="sub" data-v="table" class="btn ${UI.sub === "table" ? "btn-gold" : ""}">Stand</button><button data-a="sub" data-v="fixtures" class="btn ${UI.sub === "fixtures" ? "btn-gold" : ""}">Programma</button>${!E.played(p) ? `<button data-a="redraw" data-i="${idx}" class="btn btn-sky ml-auto"><i class="fa-solid fa-shuffle mr-1"></i>Opnieuw loten</button>` : ""}</div>`;
            h += UI.sub === "table" ? tablesHTML(t, idx) : fixturesHTML(t, idx);
        }
        return h;
    }
    function tableHTML(rows, qual, ni) {
        let h = `<div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-slate-400 uppercase text-[10px]"><th>#</th><th class="l">Team</th><th>G</th><th>W</th><th>GL</th><th>V</th><th>DP</th><th>DS</th><th>PT</th></tr></thead><tbody>`;
        rows.forEach((r, i) => {
            const q = qual && qual.has(r.id), skip = q && qual.get(r.id) !== ni;
            const nxt = isNextTeam(r.id);
            const opp = nxt ? (NX.m.home === r.id ? NX.m.away : NX.m.home) : null;
            h += `<tr class="border-t border-slate-800/70 ${nxt ? "bg-amber-400/15 ring-1 ring-inset ring-amber-400/60" : q ? (skip ? "bg-sky-500/15" : "bg-emerald-500/10") : ""}"><td class="text-slate-400 ${q ? (skip ? "border-l-2 border-sky-400" : "border-l-2 border-emerald-400") : ""}">${i + 1}</td><td class="l text-slate-100 font-semibold">${teamHtml(r.id)}${nxt ? `<span class="ml-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 whitespace-nowrap" title="Speelt de volgende wedstrijd tegen ${esc(nm(opp))}"><i class="fa-solid fa-forward-step mr-0.5"></i>volgende vs ${esc(nm(opp))}</span>` : ""}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="text-slate-300">${r.gf}-${r.ga}</td><td class="${r.gd >= 0 ? "text-emerald-300" : "text-red-300"}">${r.gd > 0 ? "+" : ""}${r.gd}</td><td class="font-black text-white">${r.pts}</td></tr>`;
        });
        return h + `</tbody></table></div>`;
    }
    function qualSet(t, idx) {
        const q = E.qualify(t, idx); if (!q) return null;
        const set = new Map(); q.groups.forEach(gp => gp.ids.forEach(id => set.set(id, gp.dest)));
        return { set, groups: q.groups, ni: idx + 1 };
    }
    function tablesHTML(t, idx) {
        const p = t.phases[idx], qs = qualSet(t, idx);
        let h = "";
        if (p.type === "groups") {
            h += `<div class="grid md:grid-cols-2 gap-3">` + E.groupTables(t, p).map((rows, gi) => `<div class="card"><div class="font-bold text-amber-300 text-sm mb-1">${esc(p.groups[gi].name)}</div>${tableHTML(rows, qs && qs.set, qs && qs.ni)}</div>`).join("") + `</div>`;
        } else h += `<div class="card">${tableHTML(E.phaseTable(t, p), qs && qs.set, qs && qs.ni)}</div>`;
        if (NX.m) h += `<div class="text-[11px] text-slate-400"><span class="inline-block w-2.5 h-2.5 bg-amber-400/40 border border-amber-400 mr-1 align-middle"></span>Speelt de volgende wedstrijd</div>`;
        if (qs) h += `<div class="text-[11px] text-slate-400 space-y-0.5">` + qs.groups.filter(gp => gp.ids.length).map(gp => {
            const skip = gp.dest !== qs.ni;
            return `<div><span class="inline-block w-2.5 h-2.5 ${skip ? "bg-sky-500/40 border-sky-400" : "bg-emerald-500/40 border-emerald-400"} border-l-2 mr-1 align-middle"></span>Gaat (voorlopig) ${skip ? "direct " : ""}door naar ${esc((t.phases[gp.dest] || {}).name || "?")}${t.v2 ? ` (${gp.ids.length} team${gp.ids.length === 1 ? "" : "s"})` : ""}</div>`;
        }).join("") + `</div>`;
        return h;
    }
    /* ---------- volgende wedstrijd: markering + positie in de stand ---------- */
    let NX = { m: null, ranks: new Map() };
    function nextMatchOf(p) {
        if (!p || p.status !== "active") return null;
        return E.pendingMatches(p).find(m => m.home && m.away) || null;
    }
    function rankMapOf(t, p) {
        const map = new Map();
        if (p.type === "knockout") return map;
        const tables = p.type === "groups" ? E.groupTables(t, p) : [E.phaseTable(t, p)];
        tables.forEach(rows => rows.forEach((r, i) => map.set(r.id, { pos: i + 1, of: rows.length, p: r.p })));
        return map;
    }
    function setNextCtx(t, p) { NX = { m: nextMatchOf(p), ranks: rankMapOf(t, p) }; }
    const isNextTeam = id => !!(NX.m && (NX.m.home === id || NX.m.away === id));
    function rankBadge(id) {
        const r = NX.ranks.get(id); if (!r) return "";
        const txt = r.p > 0 ? `${r.pos}e` : "–";
        return `<span class="shrink-0 ml-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40" title="${r.p > 0 ? `Staat ${r.pos}e van ${r.of}` : "Nog geen wedstrijd gespeeld"}">${txt}</span>`;
    }
    function nextBannerHTML() {
        const m = NX.m; if (!m) return "";
        const side = id => `<span class="inline-flex items-center gap-1 font-bold text-white">${teamHtml(id)}${rankBadge(id)}</span>`;
        return `<div class="rounded-xl border border-amber-400/60 bg-amber-400/10 px-3 py-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950"><i class="fa-solid fa-forward-step mr-1"></i>Volgende wedstrijd</span>${side(m.home)}<span class="text-slate-400 font-black">vs</span>${side(m.away)}${m.stage ? `<span class="text-slate-400 ml-auto">${esc(m.stage)}</span>` : ""}</div>`;
    }
    function matchRow(m) {
        const pl = m.h != null;
        const inp = (k, v) => `<input data-m${k}="${m.id}" type="number" inputmode="numeric" min="0" max="99" value="${v == null ? "" : v}" class="inp score">`;
        const nx = NX.m && NX.m.id === m.id;
        const rk = id => nx ? rankBadge(id) : "";
        return `<div class="flex items-center gap-1.5 py-1 ${nx ? "rounded-lg ring-1 ring-amber-400/70 bg-amber-400/10 px-1.5 my-0.5" : ""}">${nx ? `<span class="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950" title="Volgende wedstrijd"><i class="fa-solid fa-forward-step"></i></span>` : ""}<div class="flex-1 min-w-0 text-right text-xs font-semibold text-slate-100 flex justify-end items-center">${teamHtml(m.home)}${rk(m.home)}</div>${inp("h", m.h)}<span class="text-slate-500 font-black">-</span>${inp("a", m.a)}<div class="flex-1 min-w-0 text-xs font-semibold text-slate-100 flex items-center">${teamHtml(m.away)}${rk(m.away)}</div>
    <button data-a="save-m" data-m="${m.id}" class="btn ${pl ? "" : "btn-gold"}" title="Opslaan"><i class="fa-solid fa-check"></i></button>${pl ? `<button data-a="clear-m" data-m="${m.id}" class="btn btn-red" title="Wis score">✕</button>` : ""}</div>`;
    }
    function fixturesHTML(t, idx) {
        const p = t.phases[idx];
        let ms = p.matches;
        const filter = `<select data-c="team" class="inp"><option value="">Alle teams</option>${p.entrants.map(id => `<option value="${id}" ${UI.team === id ? "selected" : ""}>${esc(nm(id))}</option>`).join("")}</select>`;
        if (UI.team) ms = ms.filter(m => m.home === UI.team || m.away === UI.team);
        const total = ms.length;
        if (UI.onlyOpen) ms = ms.filter(m => m.h == null || m.a == null);
        const groups = new Map();
        for (const m of ms) { if (!groups.has(m.stage)) groups.set(m.stage, []); groups.get(m.stage).push(m); }
        const openCnt = p.matches.filter(m => m.h == null || m.a == null).length;
        let h = `<div class="flex flex-wrap items-center gap-3"><div class="w-full max-w-xs">${filter}</div><label class="flex items-center gap-2 text-xs text-slate-200 cursor-pointer"><input type="checkbox" data-c="onlyopen" ${UI.onlyOpen ? "checked" : ""} class="accent-amber-400 w-4 h-4">Enkel nog te spelen wedstrijden <span class="text-slate-500">(${openCnt} open)</span></label></div>`;
        for (const [stage, list] of groups) h += `<div class="card !p-2.5"><div class="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-1">${esc(stage)}</div>${list.map(matchRow).join("")}</div>`;
        if (!ms.length) h += `<div class="text-xs text-slate-500 italic">${UI.onlyOpen && total ? "Alle wedstrijden zijn gespeeld." : "Geen wedstrijden."}</div>`;
        return h;
    }
    function koHTML(t, idx) {
        const p = t.phases[idx], R = p.rounds;
        const srcLabel = s => {
            if (s.team !== undefined) return s.team ? teamHtml(s.team) : `<span class="text-slate-500 italic">vrijstelling</span>`;
            const src = p.ties.find(x => x.id === (s.from || s.fromLoser));
            const cnt = p.ties.filter(x => x.round === src.round && !x.third).length;
            return `<span class="text-slate-500 italic">${s.from ? "Winnaar" : "Verliezer"} ${esc(src.name)}${cnt > 1 ? " " + (src.idx + 1) : ""}</span>`;
        };
        const card = tie => {
            const cnt = p.ties.filter(x => x.round === tie.round && !x.third).length;
            const title = esc(tie.name) + (!tie.third && cnt > 1 ? " " + (tie.idx + 1) : "");
            const side = (team, src, other) => {
                const win = tie.winner && tie.winner === team;
                return `<div class="flex items-center justify-between gap-2 px-2 py-1 rounded ${win ? "bg-emerald-500/15" : ""}"><div class="min-w-0 text-xs font-bold ${win ? "text-emerald-300" : "text-slate-100"}">${team ? teamHtml(team) : srcLabel(src)}</div>${tie.agg && tie.legs === 2 ? `<span class="font-broadcast text-lg font-extrabold text-white">${tie.agg[team === tie.ta ? 0 : 1]}</span>` : ""}</div>`;
            };
            let body = side(tie.ta, tie.a) + side(tie.tb, tie.b);
            if (tie.bye) body += `<div class="text-[10px] text-slate-500 px-2 pb-1">Gaat door zonder wedstrijd</div>`;
            else if (tie.matchIds.length) {
                body += `<div class="border-t border-slate-800 mt-1 pt-1">` + tie.matchIds.map((id, k) => { const m = p.matches.find(x => x.id === id); return (tie.legs === 2 ? `<div class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">${k === 0 ? "Heenwedstrijd" : "Terugwedstrijd"}</div>` : "") + matchRow(m); }).join("") + `</div>`;
                if (tie.agg && tie.agg[0] === tie.agg[1]) {
                    const last = p.matches.find(x => x.id === tie.matchIds[tie.matchIds.length - 1]);
                    body += `<div class="mt-1"><span class="lbl">Gelijk — winnaar na strafschoppen</span><select data-c="pens" data-tie="${tie.id}" class="inp"><option value="">Kies winnaar…</option><option value="${tie.ta}" ${last.pens === tie.ta ? "selected" : ""}>${esc(nm(tie.ta))}</option><option value="${tie.tb}" ${last.pens === tie.tb ? "selected" : ""}>${esc(nm(tie.tb))}</option></select></div>`;
                }
            }
            return `<div class="card !p-2.5 ${tie.winner ? "" : ""}"><div class="text-[10px] uppercase tracking-wider text-amber-300 font-black mb-1">${title}</div>${body}</div>`;
        };
        let cols = "";
        for (let r = 1; r <= R; r++) {
            const ties = p.ties.filter(x => x.round === r);
            cols += `<div class="tie flex flex-col justify-around gap-3">${ties.map(card).join("")}</div>`;
        }
        const extra = !E.played(p) ? `<div class="mb-2"><button data-a="redraw" data-i="${idx}" class="btn btn-sky"><i class="fa-solid fa-shuffle mr-1"></i>Opnieuw loten</button></div>` : "";
        return extra + `<div class="overflow-x-auto pb-3"><div class="flex gap-4 items-stretch min-w-max">${cols}</div></div><div class="text-[11px] text-slate-500">Bij gelijke totaalscore na de laatste wedstrijd kies je de winnaar na strafschoppen. Geen uitdoelpunten-regel.</div>`;
    }

    /* ---------- statistieken ---------- */
    /* ---------- extra statistieken (reeksen, vorm, stunts, ...) ---------- */
    function extraStatsHTML(ms) {
        const R = new Map();
        const rec = id => { if (!R.has(id)) R.set(id, { id, form: [], cw: 0, bw: 0, cu: 0, bu: 0, cn: 0, bn: 0, cs: 0, fts: 0, d: 0, p: 0, gf: 0, ga: 0 }); return R.get(id); };
        for (const m of ms) {
            if (!TM.has(m.home) || !TM.has(m.away)) continue;
            [[m.home, m.h, m.a], [m.away, m.a, m.h]].forEach(([id, f, a]) => {
                const r = rec(id), res = f > a ? "W" : f < a ? "L" : "D";
                r.p++; r.gf += f; r.ga += a; r.form.push(res);
                if (a === 0) r.cs++;
                if (f === 0) r.fts++;
                if (res === "D") r.d++;
                if (res === "W") { r.cw++; r.bw = Math.max(r.bw, r.cw); } else r.cw = 0;
                if (res !== "L") { r.cu++; r.bu = Math.max(r.bu, r.cu); } else r.cu = 0;
                if (res !== "W") { r.cn++; r.bn = Math.max(r.bn, r.cn); } else r.cn = 0;
            });
        }
        const teams = [...R.values()], n = ms.length;
        const pct = k => Math.round(100 * k / n) + "%";
        const card = (l, v, sub) => `<div class="card text-center !p-2"><div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">${l}</div><div class="font-broadcast text-2xl font-extrabold text-amber-300">${v}</div>${sub ? `<div class="text-[10px] text-slate-500">${sub}</div>` : ""}</div>`;
        const list = (icon, label, rows) => rows.length ? `<div class="card"><span class="lbl"><i class="fa-solid ${icon} mr-1 text-amber-300"></i>${label}</span>${rows.slice(0, 5).map((r, i) => `<div class="flex justify-between gap-2 text-xs py-0.5"><span class="text-slate-200 truncate">${i + 1}. ${esc(nm(r.id))}</span><span class="font-bold text-white whitespace-nowrap">${r.txt}</span></div>`).join("")}</div>` : "";
        const rows = (arr, val, fmt) => arr.filter(r => val(r) > 0).sort((a, b) => val(b) - val(a)).map(r => ({ id: r.id, txt: fmt(r) }));
        const flame = r => (r.cw === r.bw && r.bw > 0 ? " \u{1F525}" : "");

        const hw = ms.filter(m => m.h > m.a).length, dr = ms.filter(m => m.h === m.a).length, aw = n - hw - dr;
        const nil = ms.filter(m => m.h === 0 && m.a === 0).length, close = ms.filter(m => Math.abs(m.h - m.a) === 1).length;
        const csTot = ms.reduce((s, m) => s + (m.a === 0 ? 1 : 0) + (m.h === 0 ? 1 : 0), 0);
        let h = `<div class="text-[10px] uppercase tracking-widest text-amber-300 font-black pt-2">Extra statistieken</div>
<div class="grid grid-cols-3 gap-2">${card("Thuisploeg wint", pct(hw), hw + "×")}${card("Gelijkspel", pct(dr), dr + "×")}${card("Uitploeg wint", pct(aw), aw + "×")}</div>
<div class="grid grid-cols-3 gap-2">${card("Nipte uitslagen", pct(close), "1 goal verschil")}${card("Clean sheets", csTot, "totaal")}${card("0-0", nil, "doelpuntloos")}</div>`;

        h += `<div class="grid md:grid-cols-3 gap-3">`
            + list("fa-fire", "Langste winstreeks", rows(teams, r => r.bw, r => r.bw + " op rij" + flame(r)))
            + list("fa-shield-halved", "Langste ongeslagen reeks", rows(teams, r => r.bu, r => r.bu + " wedstrijden"))
            + list("fa-snowflake", "Langste reeks zonder winst", rows(teams, r => r.bn >= 2 ? r.bn : 0, r => r.bn + " wedstrijden"))
            + list("fa-hand", "Meeste clean sheets", rows(teams, r => r.cs, r => r.cs))
            + list("fa-bullseye", "Beste aanval (gem. per wedstrijd)", rows(teams, r => r.gf / r.p, r => (r.gf / r.p).toFixed(2)))
            + list("fa-lock", "Beste verdediging (gem. tegen)", [...teams].sort((a, b) => a.ga / a.p - b.ga / b.p || b.p - a.p).map(r => ({ id: r.id, txt: (r.ga / r.p).toFixed(2) })))
            + list("fa-scale-balanced", "Beste doelsaldo", teams.filter(r => r.gf - r.ga > 0).sort((a, b) => (b.gf - b.ga) - (a.gf - a.ga)).map(r => ({ id: r.id, txt: "+" + (r.gf - r.ga) })))
            + list("fa-handshake", "Gelijkspelkoningen", rows(teams, r => r.d, r => r.d + "×"))
            + list("fa-ban", "Meeste wedstrijden zonder scoren", rows(teams, r => r.fts, r => r.fts + "×"))
            + `</div>`;

        // vorm: laatste 5 wedstrijden
        const dotF = x => `<span class="inline-flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-black ${x === "W" ? "bg-emerald-500 text-slate-950" : x === "L" ? "bg-red-500 text-white" : "bg-slate-500 text-white"}">${x === "D" ? "G" : x === "L" ? "V" : "W"}</span>`;
        const fpts = r => r.form.slice(-5).reduce((s, x) => s + (x === "W" ? 3 : x === "D" ? 1 : 0), 0);
        const form = [...teams].sort((a, b) => fpts(b) - fpts(a) || (b.gf - b.ga) - (a.gf - a.ga));
        h += `<div class="card"><span class="lbl"><i class="fa-solid fa-chart-line mr-1 text-amber-300"></i>Vorm (laatste 5 wedstrijden)</span><div class="max-h-64 overflow-y-auto pr-1">${form.map((r, i) => `<div class="flex items-center justify-between gap-2 text-xs py-0.5"><span class="text-slate-200 truncate">${i + 1}. ${esc(nm(r.id))}</span><span class="flex items-center gap-0.5">${r.form.slice(-5).map(dotF).join("")}<span class="ml-1.5 w-8 text-right font-bold text-white">${fpts(r)} pt</span></span></div>`).join("")}</div></div>`;

        // stunts (lagere Elo wint) + doelpuntrijke gelijke spelen
        const elo = id => { const e = (TM.get(id) || {}).elo; return typeof e === "number" ? e : null; };
        const upsets = ms.map(m => {
            const eh = elo(m.home), ea = elo(m.away); if (eh == null || ea == null || m.h === m.a) return null;
            const w = m.h > m.a ? m.home : m.away, l = w === m.home ? m.away : m.home, gap = elo(l) - elo(w);
            return gap > 0 ? { m, w, l, gap } : null;
        }).filter(Boolean).sort((a, b) => b.gap - a.gap).slice(0, 5);
        const draws = ms.filter(m => m.h === m.a && m.h > 0).sort((a, b) => b.h - a.h).slice(0, 5);
        const line = m => `<div class="flex justify-between gap-2 py-0.5 text-xs"><span class="truncate text-slate-200">${esc(nm(m.home))} ${m.h}-${m.a} ${esc(nm(m.away))}</span><span class="text-slate-500 whitespace-nowrap">${esc(m.phase)}</span></div>`;
        h += `<div class="grid md:grid-cols-2 gap-3">`
            + (upsets.length ? `<div class="card"><span class="lbl"><i class="fa-solid fa-bolt mr-1 text-amber-300"></i>Grootste stunts (laagste Elo wint)</span>${upsets.map(u => `<div class="flex justify-between gap-2 py-0.5 text-xs"><span class="truncate text-slate-200">${esc(nm(u.w))} ${u.m.h > u.m.a ? u.m.h + "-" + u.m.a : u.m.a + "-" + u.m.h} ${esc(nm(u.l))}</span><span class="text-amber-300 font-bold whitespace-nowrap">+${u.gap} Elo</span></div>`).join("")}</div>` : "")
            + (draws.length ? `<div class="card"><span class="lbl"><i class="fa-solid fa-equals mr-1 text-amber-300"></i>Doelpuntrijkste gelijke spelen</span>${draws.map(line).join("")}</div>` : "")
            + `</div>`;
        return h;
    }
    function statsHTML(t) {
        const o = E.overallStats(t), ms = o.matches;
        if (!ms.length) return `<div class="card text-center text-slate-500 italic py-8">Nog geen wedstrijden gespeeld.</div>`;
        const goals = ms.reduce((s, m) => s + m.h + m.a, 0);
        const card = (l, v) => `<div class="card text-center !p-2"><div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">${l}</div><div class="font-broadcast text-2xl font-extrabold text-sky-400">${v}</div></div>`;
        const line = m => `<div class="flex justify-between gap-2 py-0.5 text-xs"><span class="truncate text-slate-200">${esc(nm(m.home))} ${m.h}-${m.a} ${esc(nm(m.away))}</span><span class="text-slate-500 whitespace-nowrap">${esc(m.phase)}</span></div>`;
        const top = (label, arr, f, sfx = "") => `<div class="card"><span class="lbl">${label}</span>${arr.slice(0, 5).map((r, i) => `<div class="flex justify-between text-xs py-0.5"><span class="text-slate-200 truncate">${i + 1}. ${esc(nm(r.id))}</span><span class="font-bold text-white">${f(r)}${sfx}</span></div>`).join("")}</div>`;
        const pl = o.teams.filter(x => x.p > 0);
        return `<div class="grid grid-cols-3 gap-2">${card("Wedstrijden", ms.length)}${card("Doelpunten", goals)}${card("Gemiddeld", (goals / ms.length).toFixed(2))}</div>
<div class="grid md:grid-cols-3 gap-3">${top("Meeste goals gemaakt", [...pl].sort((a, b) => b.gf - a.gf), r => r.gf)}${top("Minste tegendoelpunten", [...pl].sort((a, b) => a.ga / a.p - b.ga / b.p), r => r.ga)}${top("Meeste winsten", [...pl].sort((a, b) => b.w - a.w), r => r.w)}</div>
<div class="grid md:grid-cols-2 gap-3"><div class="card"><span class="lbl">Grootste overwinningen</span>${[...ms].sort((a, b) => Math.abs(b.h - b.a) - Math.abs(a.h - a.a) || (b.h + b.a) - (a.h + a.a)).slice(0, 5).map(line).join("")}</div>
<div class="card"><span class="lbl">Meeste doelpunten</span>${[...ms].sort((a, b) => (b.h + b.a) - (a.h + a.a)).slice(0, 5).map(line).join("")}</div></div>
${extraStatsHTML(ms)}
<button data-a="csv" class="btn"><i class="fa-solid fa-file-csv mr-1"></i>Exporteer wedstrijden (CSV)</button>`;
    }
    function download(name, text, type) {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
    }
    const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "toernooi";

    /* ---------- acties ---------- */
    const parseGoals = v => { const s = String(v).trim(); return /^\d{1,2}$/.test(s) ? Number(s) : null; };
    function guardEdit(t, idx) {
        if (E.laterStarted(t, idx)) {
            if (!confirm("Latere fases zijn al gestart. Als je dit wijzigt worden die fases gewist en moet je ze opnieuw starten (nieuwe loting). Doorgaan?")) return false;
            E.resetFrom(t, idx + 1);
        }
        return true;
    }
    function nextEmptyAfter(mid) {
        const ins = [...root().querySelectorAll("input[data-mh]")];
        const k = ins.findIndex(i => i.dataset.mh === mid);
        for (let j = k + 1; j < ins.length; j++) if (ins[j].value === "" && ins[j].dataset.mh !== mid) return ins[j].dataset.mh;
        return null;
    }
    function afterChange(idx, focusId) {
        const t = cur(), was = t.phases[idx].status;
        persist(); render();
        if (focusId) { const el = root().querySelector(`[data-mh="${focusId}"]`); if (el) { el.focus({ preventScroll: true }); try { el.scrollIntoView({ block: "nearest" }); } catch (e) { } } }
        return was;
    }
    function saveMatch(mid) {
        const t = cur(), idx = phaseIdx(); if (!t || idx < 0) return;
        const hi = root().querySelector(`[data-mh="${mid}"]`), ai = root().querySelector(`[data-ma="${mid}"]`);
        const h = parseGoals(hi.value), a = parseGoals(ai.value);
        if (h === null || a === null) { say("Vul bij beide teams de doelpunten in (0 t/m 99)."); return; }
        if (!guardEdit(t, idx)) return;
        const before = t.phases[idx].status, nxt = nextEmptyAfter(mid);
        E.setScore(t, idx, mid, h, a);
        afterChange(idx, nxt);
        if (before !== "done" && t.phases[idx].status === "done") say(`✓ ${t.phases[idx].name} is klaar!` + (t.phases[idx + 1] ? " Start de volgende fase bovenaan." : ""), 5000);
    }
    function clearMatch(mid) {
        const t = cur(), idx = phaseIdx(); if (!t || idx < 0) return;
        if (!guardEdit(t, idx)) return;
        E.setScore(t, idx, mid, null, null); afterChange(idx);
    }
    function startPhase(i, keep) {
        const t = cur();
        try { E.startPhase(t, i); } catch (e) { say("⚠️ " + e.message, 7000); return; }
        UI.tab = "p" + i; UI.sub = "table"; UI.team = ""; persist(); render(!keep);
    }

    function onClick(e) {
        const b = e.target.closest("[data-a]"); if (!b) return;
        const a = b.dataset.a, t = cur();
        switch (a) {
            case "hub": showHub(); break;
            case "new": newWizard(); UI.screen = "wizard"; render(true); break;
            case "cancel-w": W = null; UI.screen = "list"; render(); break;
            case "list": UI.screen = "list"; render(); break;
            case "gstats": UI.screen = "gstats"; render(true); break;
            case "gs-tab": GS.tab = b.dataset.v; render(); break;
            case "gs-sort": if (GS.sort === b.dataset.v) GS.dir = -GS.dir; else { GS.sort = b.dataset.v; GS.dir = b.dataset.v === "gapg" || b.dataset.v === "l" ? -1 : 1; } render(); break;
            case "gs-team": GS.team = b.dataset.id; GS.tab = "team"; render(true); break;
            case "open": UI = { screen: "view", tid: b.dataset.id, tab: "overview", sub: "table", team: "" }; { const x = cur(); if (x) { const act = x.phases.findIndex(p => p.status === "active"); if (act >= 0) UI.tab = "p" + act; } } render(true); break;
            case "tab": UI.tab = b.dataset.v; UI.team = ""; UI.simEx = []; render(); break;
            case "sim-next": simNextUI(); break;
            case "sim-all": simAllUI(false); break;
            case "sim-ex": simAllUI(true); break;
            case "sim-toggle": {
                const id = b.dataset.id, s = new Set(UI.simEx || []);
                if (s.has(id)) s.delete(id); else s.add(id);
                UI.simEx = [...s]; b.classList.toggle("on", s.has(id)); refreshSimBtn(); break;
            }
            case "sim-clear": UI.simEx = []; root().querySelectorAll('[data-a="sim-toggle"]').forEach(c => c.classList.remove("on")); refreshSimBtn(); break;
            case "sub": UI.sub = b.dataset.v; render(); break;
            case "start-ph": startPhase(+b.dataset.i); break;
            case "redraw": { const i = +b.dataset.i; if (E.played(t.phases[i])) { say("Er zijn al wedstrijden gespeeld."); break; } startPhase(i, true); break; }
            case "save-m": saveMatch(b.dataset.m); break;
            case "clear-m": clearMatch(b.dataset.m); break;
            case "export-t": { const x = DB.items.find(q => q.id === (b.dataset.id || UI.tid)); if (x) download(`toernooi_${slug(x.name)}.json`, JSON.stringify({ type: "eafc26-toernooi", v: 1, tournament: x }), "application/json"); break; }
            case "del-t": {
                const x = DB.items.find(q => q.id === (b.dataset.id || UI.tid)); if (!x) break;
                if (!confirm(`Toernooi "${x.name}" definitief verwijderen? Exporteer eerst een back-up als je het wilt bewaren.`)) break;
                DB.items = DB.items.filter(q => q.id !== x.id); save(); UI.screen = "list"; render(); break;
            }
            case "rename-t": { const n = prompt("Nieuwe naam:", t.name); if (n && n.trim()) { t.name = n.trim().slice(0, 50); persist(); render(); } break; }
            case "csv": {
                const q = v => `"${String(v).replace(/"/g, '""')}"`, lines = ["fase,ronde,thuis,doelpunten_thuis,doelpunten_uit,uit,strafschoppen_winnaar"];
                for (const ph of t.phases) for (const m of (ph.matches || [])) if (m.h != null) lines.push([q(ph.name), q(m.stage || ""), q(nm(m.home)), m.h, m.a, q(nm(m.away)), q(m.pens ? nm(m.pens) : "")].join(","));
                download(`toernooi_${slug(t.name)}_wedstrijden.csv`, lines.join("\n"), "text/csv;charset=utf-8"); break;
            }
            /* wizard */
            case "tpl": W.tpl = b.dataset.v; W.dirty = false; W.phases = b.dataset.v === "custom" ? [] : E.template(b.dataset.v, W.teams.length || 16); render(); break;
            case "add-ph": W.phases.push(E.newPhaseDraft(g("w-addtype").value)); W.tpl = "custom"; W.dirty = true; render(); break;
            case "ph-rm": { const i = +b.dataset.i; W.phases.splice(i, 1); remapRoutes(d => d === i ? -1 : d > i ? d - 1 : d); W.dirty = true; refreshPlan(); break; }
            case "route-add": { const i = +b.dataset.i, p = W.phases[i]; (p.routes = p.routes || []).push({ count: 1, dest: i + 2 }); W.dirty = true; refreshPlan(); break; }
            case "route-rm": { const p = W.phases[+b.dataset.i]; p.routes.splice(+b.dataset.r, 1); W.dirty = true; refreshPlan(); break; }
            case "ph-up": { const i = +b.dataset.i; if (i > 0) { [W.phases[i - 1], W.phases[i]] = [W.phases[i], W.phases[i - 1]]; remapRoutes(d => d === i ? i - 1 : d === i - 1 ? i : d); W.dirty = true; refreshPlan(); } break; }
            case "ph-down": { const i = +b.dataset.i; if (i < W.phases.length - 1) { [W.phases[i + 1], W.phases[i]] = [W.phases[i], W.phases[i + 1]]; remapRoutes(d => d === i ? i + 1 : d === i + 1 ? i : d); W.dirty = true; refreshPlan(); } break; }
            case "w-toggle": {
                const id = b.dataset.id, k = W.teams.findIndex(x => x.id === id);
                if (k >= 0) W.teams.splice(k, 1); else { const c = pool().find(x => x.id === id); if (c) W.teams.push({ id: c.id, name: c.name, color: c.color, lg: c.lg, elo: c.elo, cn: c.cn }); }
                teamsChanged(); break;
            }
            case "w-all": case "w-none": {
                const all = pool(), q = W.q.trim().toLowerCase();
                let list = all.filter(c => (W.lg === "all" || c.label === W.lg) && (!q || c.name.toLowerCase().includes(q)));
                if (a === "w-none") { const ids = new Set(list.map(c => c.id)); W.teams = W.teams.filter(x => !ids.has(x.id)); }
                else {
                    const have = new Set(W.teams.map(x => x.id));
                    for (const c of list) if (!have.has(c.id)) W.teams.push({ id: c.id, name: c.name, color: c.color, lg: c.lg, elo: c.elo, cn: c.cn });
                }
                teamsChanged(); break;
            }
            case "w-top": case "w-rand": {
                const q = W.q.trim().toLowerCase();
                const list = pool().filter(c => (W.lg === "all" || c.label === W.lg) && (!q || c.name.toLowerCase().includes(q)));
                const n = parseInt(g("w-rn").value, 10) || 0, perCn = parseInt(g("w-mc").value, 10) || 0, maxCn = parseInt(g("w-ml").value, 10) || 0;
                if (n < 1) { say("Vul eerst het aantal teams in."); break; }
                const arr = a === "w-top" ? [...list].sort((x, y) => (y.elo || 0) - (x.elo || 0)) : E.shuffle(list);
                const cnt = new Map(), out = [];
                for (const c of arr) {
                    if (out.length >= n) break;
                    const used = cnt.get(c.cn) || 0;
                    if (perCn && used >= perCn) continue;
                    if (maxCn && used === 0 && cnt.size >= maxCn) continue;
                    cnt.set(c.cn, used + 1); out.push(c);
                }
                W.teams = out.map(c => ({ id: c.id, name: c.name, color: c.color, lg: c.lg, elo: c.elo, cn: c.cn }));
                if (a === "w-top") W.teams.sort((x, y) => (y.elo || 0) - (x.elo || 0));
                teamsChanged();
                say(out.length < n ? `Maar ${out.length} van de ${n} teams gevonden met deze limieten.` : `${out.length} teams gekozen uit ${cnt.size} landen.`, 4500);
                break;
            }
            case "w-sortelo": W.teams.sort((x, y) => (y.elo || 0) - (x.elo || 0)); refreshPicker(); break;
            case "w-clear": W.teams = []; teamsChanged(); break;
            case "w-up": { const i = +b.dataset.i; if (i > 0) { [W.teams[i - 1], W.teams[i]] = [W.teams[i], W.teams[i - 1]]; refreshPicker(); } break; }
            case "w-down": { const i = +b.dataset.i; if (i < W.teams.length - 1) { [W.teams[i + 1], W.teams[i]] = [W.teams[i], W.teams[i + 1]]; refreshPicker(); } break; }
            case "w-rm": W.teams.splice(+b.dataset.i, 1); teamsChanged(); break;
            case "w-shuffle": W.teams = E.shuffle(W.teams); refreshPicker(); break;
            case "w-sort": W.teams.sort((x, y) => x.name.localeCompare(y.name)); refreshPicker(); break;
            case "w-addcustom": {
                const names = g("w-custom").value.split("\n").map(s => s.trim()).filter(Boolean);
                for (const n of names) { W.cn++; const id = "c" + Date.now().toString(36) + W.cn; W.teams.push({ id, name: n.slice(0, 40), color: hashColor(id), lg: null }); }
                g("w-custom").value = ""; teamsChanged(); break;
            }
            case "w-create": createTournament(); break;
        }
    }
    function onChange(e) {
        const el = e.target;
        if (el.id === "trn-import") {
            const f = el.files[0]; el.value = ""; if (!f) return;
            const rd = new FileReader();
            rd.onload = () => {
                try {
                    const o = JSON.parse(rd.result), t = o.tournament || o;
                    if (!t || !Array.isArray(t.teams) || !Array.isArray(t.phases)) throw new Error("Dit is geen geldig toernooibestand.");
                    t.id = E.uid(); t.name = (t.name + " (import)").slice(0, 50); DB.items.push(t); save(); render(); say("Geïmporteerd");
                } catch (err) { say("Import mislukt: " + err.message, 6000); }
            };
            rd.readAsText(f); return;
        }
        const c = el.dataset.c;
        if (c === "gs") { GS[el.dataset.k] = el.value; render(); }
        else if (c === "team") { UI.team = el.value; render(); }
        else if (c === "onlyopen") { UI.onlyOpen = el.checked; render(); }
        else if (c === "pens") {
            const t = cur(), idx = phaseIdx(); if (!t) return;
            if (!guardEdit(t, idx)) { render(); return; }
            const before = t.phases[idx].status;
            E.setPens(t, idx, el.dataset.tie, el.value); afterChange(idx);
            if (before !== "done" && t.phases[idx].status === "done") say(`✓ ${t.phases[idx].name} is klaar!`, 4000);
        }
        else if (c === "rule") { W.rules[el.dataset.k] = el.dataset.t === "n" ? (parseInt(el.value, 10) || 0) : el.value; }
        else if (c === "ph") {
            const i = +el.dataset.i, p = W.phases[i];
            let v = el.dataset.t === "b" ? el.checked : el.dataset.t === "n" ? (el.value === "" ? null : Number(el.value)) : el.value;
            if (v === null && el.dataset.k !== "advance" && el.dataset.k !== "cfg.rounds") v = 1;
            setPath(p, el.dataset.k, v); W.dirty = true; refreshPlan();
        }
        else if (c === "route") {
            const p = W.phases[+el.dataset.i], r = p && p.routes[+el.dataset.r]; if (!r) return;
            r[el.dataset.k] = el.value === "" ? null : Number(el.value); W.dirty = true; refreshPlan();
        }
        else if (el.dataset.live === "lg") { W.lg = el.value; refreshPicker(); }
        else if (el.dataset.live === "sort") { W.sort = el.value; refreshPicker(); }
    }
    function onInput(e) {
        const el = e.target, k = el.dataset.live; if (!k) return;
        if (k === "name") { W.name = el.value; refreshPlan(); }
        else if (k === "q") { W.q = el.value; refreshPicker(); }
        else if (k === "phname") { W.phases[+el.dataset.i].name = el.value; }
    }
    function onKey(e) {
        if (e.key !== "Enter") return;
        const el = e.target, mid = el.dataset && (el.dataset.mh || el.dataset.ma);
        if (mid) { e.preventDefault(); saveMatch(mid); }
    }

    function init() {
        load();
        document.addEventListener("click", e => {
            if (e.target.closest("#hub-trn")) { openTournaments(); return; }
            if (e.target.closest("#hub-imp")) { enterImperialism(); return; }
            if (e.target.closest("#btn-hub")) { showHub(); return; }
        });
        const r = root();
        r.addEventListener("click", onClick); r.addEventListener("change", onChange); r.addEventListener("input", onInput); r.addEventListener("keydown", onKey);
    }
    init();
    return { showHub, openTournaments, enterImperialism };
})();
window.showHub = TUI.showHub;