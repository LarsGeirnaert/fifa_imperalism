/* ============================================================================
   2. GLOBAL STATE & LANDMASS GEOJSON LOADING
   ============================================================================ */
let SOURCE_CLUBS = [...MASTER_CLUBS];
let TEAMS = [];               // Includes both Real Clubs & Procedural Neutral Territories
let cells = new Map();        // id -> Voronoi polygon (clipped to landmass if available)
let adj = new Map();          // id -> Set of adjacent neighbor ids
let empireCache = new Map();  // key -> merged GeoJSON features
let landmassGeoJSON = null;   // Loaded world/europe landmass polygons for real borders
let inspectedOwnerId = null;

const state = {
    attacker: null,
    defender: null,
    turn: 1,
    over: false,
    isSpinning: false,
    players: [],
    matches: [],
    enableNeutral: true,
    enableClip: true,
    events: []
};

let LOG = [];                       // log-regels (nieuwste eerst), wordt mee opgeslagen
let compassAngle = 0;
let saveEnabled = false;
let lastPreset = "all";
let pendingTransfer = null;
let customSource = false;                            // true bij eigen teams (JSON), anders komen de clubs uit een preset
let activeSaveId = null;                             // id van de save waarin nu gespeeld wordt
let activeSaveName = "";
let activeCreatedAt = Date.now();
let BACKUPS = [];                                    // automatische back-ups van de actieve save
let saveFailedWarned = false;
let landmassPromise = null;

const $ = id => document.getElementById(id);
const byId = id => TEAMS.find(t => t.id === id);
const members = ownerId => TEAMS.filter(t => t.ownerId === ownerId);
const activeRealClubs = () => TEAMS.filter(t => t.isActive && !t.isNeutral);
const activeNeutralZones = () => TEAMS.filter(t => t.isActive && t.isNeutral && t.ownerId === t.id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
