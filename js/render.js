/* ============================================================================
   6. MAP RENDERING & HIGH-VISIBILITY HIGHLIGHTS
   ============================================================================ */
function render() {
    renderPlayers();
    renderStats();
    saveGame();
    shapeLayer.clearLayers();
    vectorLayer.clearLayers();
    markerLayer.clearLayers();
    beaconLayer.clearLayers();

    const uniqueOwners = [...new Set(TEAMS.map(t => t.ownerId))];

    // Sort so Attacker and Defender render last (on top)
    uniqueOwners.sort((a, b) => {
        const score = id => (id === state.attacker || id === state.defender ? 10 : 0);
        return score(a) - score(b);
    });

    for (const ownerId of uniqueOwners) {
        const owner = byId(ownerId);
        if (!owner) continue;

        const isAtt = ownerId === state.attacker;
        const isDef = ownerId === state.defender;
        const isNeutral = owner.isNeutral;

        let fillColor = owner.color;
        let fillOpacity = isNeutral ? 0.35 : 0.62;
        let strokeColor = isNeutral ? "#475569" : "#0f172a";
        let weight = isNeutral ? 1 : 1.5;
        let className = "territory-poly";

        if (isAtt) {
            fillColor = "#ffd400";
            fillOpacity = 0.86;
            strokeColor = "#ffffff";
            weight = 4;
            className += " attacker-glow";
        } else if (isDef) {
            if (isNeutral) {
                fillColor = "#10b981";
                fillOpacity = 0.85;
                strokeColor = "#ffffff";
                weight = 4;
                className += " defender-neutral-glow";
            } else {
                fillColor = "#ff4d1a";
                fillOpacity = 0.86;
                strokeColor = "#ffffff";
                weight = 4;
                className += " defender-glow";
            }
        }

        const style = {
            fillColor,
            fillOpacity,
            color: strokeColor,
            weight,
            className,
            dashArray: isNeutral && !isDef ? "4,4" : null
        };

        const terrCount = members(ownerId).length;
        const tooltipHtml = isNeutral
            ? `<div class="font-bold text-emerald-400">${esc(owner.name)}</div><div class="text-[11px] text-slate-300">Onbezet gebied • Winnaar krijgt <b>+3 Upgrades</b></div>`
            : `<div class="font-bold text-white">${esc(owner.name)}</div><div class="text-[11px] text-slate-300">Regio's: <b>${terrCount}</b> • Upgrades: <b>+${owner.upgrades}</b> • Wins: <b>${owner.wins}</b></div>`;

        for (const feature of empireShape(ownerId)) {
            const layer = L.geoJSON(feature, { style })
                .bindTooltip(tooltipHtml, { sticky: true, className: "imperial-tooltip" })
                .on("click", () => openInspector(ownerId))
                .addTo(shapeLayer);

            if (isAtt || isDef) {
                layer.bringToFront();
            }
        }
    }

    // Draw Club Pins for Active Real Clubs
    for (const t of TEAMS.filter(t => t.isActive && !t.isNeutral)) {
        const upgradeBadge = t.upgrades > 0 ? ` <span style="color:#34d399">★${t.upgrades}</span>` : "";
        L.marker([t.lat, t.lng], {
            icon: L.divIcon({
                className: "club-pin",
                iconSize: [0, 0],
                html: `<div class="dot" style="--c:${t.color}"></div><div class="name">${esc(t.name)}${upgradeBadge}</div>`
            })
        })
            .on("click", () => openInspector(t.id))
            .addTo(markerLayer);
    }

    // Draw High-Visibility Beacons & Attack Vector Line for Attacker and Defender
    if (state.attacker) {
        const att = byId(state.attacker);
        if (att) {
            L.marker([att.lat, att.lng], {
                icon: L.divIcon({
                    className: "beacon-pin",
                    iconSize: [0, 0],
                    html: `
        <div class="beacon-ring" style="--beacon-color:#ffd400"></div>
        <div class="beacon-badge bg-amber-400 text-slate-950">⚔️ AANVALLER: ${esc(att.name)}</div>
      `
                })
            }).addTo(beaconLayer);
        }
    }

    if (state.defender) {
        const def = byId(state.defender);
        const att = byId(state.attacker);
        if (def) {
            const isNeu = def.isNeutral;
            const badgeBg = isNeu ? "bg-emerald-500 text-slate-950" : "bg-orange-600 text-white";
            const beaconCol = isNeu ? "#10b981" : "#ff4d1a";
            const prefix = isNeu ? "🎁 FREE UPGRADE" : "🛡️ VERDEDIGER";

            L.marker([def.lat, def.lng], {
                icon: L.divIcon({
                    className: "beacon-pin",
                    iconSize: [0, 0],
                    html: `
        <div class="beacon-ring" style="--beacon-color:${beaconCol}"></div>
        <div class="beacon-badge ${badgeBg}">${prefix}: ${esc(def.name)}</div>
      `
                })
            }).addTo(beaconLayer);

            // Animated dashed attack line connecting Attacker & Defender
            if (att) {
                L.polyline(
                    [
                        [att.lat, att.lng],
                        [def.lat, def.lng]
                    ],
                    {
                        color: "#ffffff",
                        weight: 3.5,
                        className: "attack-vector-line"
                    }
                ).addTo(vectorLayer);
            }
        }
    }

    updateUI();
}

function boundsOf(...ownerIds) {
    const features = ownerIds.flatMap(id => empireShape(id));
    return L.geoJSON(features).getBounds();
}
