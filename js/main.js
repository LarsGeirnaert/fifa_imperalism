/* ============================================================================
   10. INITIALIZATION & REAL WORLD BORDERS FETCH
   ============================================================================ */
(async function init() {
    await loadClubsFromJson();
    updatePresetLabels();
    buildCompassFace();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (err) { }
    migrateOldSaves();
    saveEnabled = true;
    // Landgrenzen op de achtergrond ophalen en meteen toepassen op een geopende save
    ensureLandmass().then(ok => {
        if (ok && activeSaveId && TEAMS.length) { buildGeometry(); render(); }
    });
    // Startscherm: hoofdmenu (Toernooien of Imperialism)
    showHub();
})();
