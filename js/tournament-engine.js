/* ============================================================================
   TOERNOOI-ENGINE (puur, geen DOM)
   Een toernooi = lijst fases. Fases: league | groups | swiss | knockout.
   Elke fase levert een ranking; de volgende fase pakt daar plaats from..to uit.
   ============================================================================ */
const TEngine = (() => {
    const rnd = Math.random;
    const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[x[i], x[j]] = [x[j], x[i]]; } return x; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const nextPow2 = n => { let p = 1; while (p < n) p *= 2; return p; };
    const uid = () => 't' + Date.now().toString(36) + Math.floor(rnd() * 1e6).toString(36);
    const TYPE_LABEL = { league: "Competitie", groups: "Groepsfase", swiss: "League phase (Zwitsers)", knockout: "Knock-out" };

    function mk(t, f) {
        t.seq = (t.seq || 0) + 1;
        return { id: "m" + t.seq, day: f.day || null, group: f.group === undefined ? null : f.group, stage: f.stage || null, home: f.home, away: f.away, h: null, a: null, pens: null, tie: f.tie || null, leg: f.leg || 1 };
    }

    /* ---------- fixtures ---------- */
    function roundRobin(ids, legs) {
        const arr = [...ids]; if (arr.length % 2) arr.push(null);
        const n = arr.length, rounds = n - 1, out = [];
        let rot = arr.slice();
        for (let r = 0; r < rounds; r++) {
            for (let i = 0; i < n / 2; i++) {
                let a = rot[i], b = rot[n - 1 - i];
                if (a === null || b === null) continue;
                if ((i === 0 && r % 2 === 1) || (i > 0 && (r + i) % 2 === 1)) [a, b] = [b, a];
                out.push({ day: r + 1, home: a, away: b });
            }
            rot = [rot[0], rot[n - 1], ...rot.slice(1, n - 1)];
        }
        if (legs === 2) { const base = out.slice(); for (const m of base) out.push({ day: m.day + rounds, home: m.away, away: m.home }); }
        return out;
    }

    function drawGroups(ids, G, mode) {
        const groups = Array.from({ length: G }, (_, i) => ({ name: "Groep " + (G <= 26 ? String.fromCharCode(65 + i) : (i + 1)), ids: [] }));
        if (mode === "pots") {
            for (let i = 0; i < ids.length; i += G) {
                const chunk = shuffle(ids.slice(i, i + G));
                const gi = shuffle([...Array(G).keys()]).slice(0, chunk.length);
                chunk.forEach((id, k) => groups[gi[k]].ids.push(id));
            }
        } else {
            shuffle(ids).forEach((id, i) => groups[i % G].ids.push(id));
        }
        return groups;
    }

    /* Zwitserse league phase: elk team speelt M verschillende tegenstanders, optioneel verdeeld over P potten */
    function swissGraph(ids, M, P, avoid, leagueOf) {
        const N = ids.length, potSize = N / P, cap = M / P;
        const potOf = i => Math.floor(i / potSize);
        for (let attempt = 0; attempt < 800; attempt++) {
            const relax = attempt >= 560;
            const useAvoid = avoid && !relax;
            const need = ids.map(() => Array(P).fill(cap));
            const adj = ids.map(() => new Set());
            const edges = []; let ok = true;
            const cand = i => {
                const r = [], li = leagueOf(ids[i]);
                for (let j = 0; j < N; j++) {
                    if (j === i || adj[i].has(j)) continue;
                    if (need[i][potOf(j)] <= 0 || need[j][potOf(i)] <= 0) continue;
                    if (useAvoid && li && li === leagueOf(ids[j])) continue;
                    r.push(j);
                }
                return r;
            };
            for (; ;) {
                let minLen = Infinity, pool = [];
                for (let i = 0; i < N; i++) {
                    if (need[i].every(x => x <= 0)) continue;
                    const c = cand(i);
                    if (!c.length) { ok = false; break; }
                    if (c.length < minLen) { minLen = c.length; pool = [[i, c]]; }
                    else if (c.length === minLen) pool.push([i, c]);
                }
                if (!ok || !pool.length) break;
                const [i, c] = pick(pool);
                const j = pick(c);
                adj[i].add(j); adj[j].add(i);
                need[i][potOf(j)]--; need[j][potOf(i)]--;
                edges.push([i, j]);
            }
            if (ok && need.every(r => r.every(x => x === 0))) return { edges, relaxed: !!(avoid && relax) };
        }
        return null;
    }
    function orient(edges, N) {
        const home = Array(N).fill(0), away = Array(N).fill(0);
        const es = shuffle(edges).map(([a, b]) => {
            let h = a, w = b;
            const da = home[a] - away[a], db = home[b] - away[b];
            if (da > db || (da === db && rnd() < .5)) { h = b; w = a; }
            home[h]++; away[w]++; return [h, w];
        });
        for (let pass = 0; pass < 40; pass++) {
            let changed = false;
            for (const e of es) {
                const [h, w] = e;
                if ((home[h] - away[h]) - (home[w] - away[w]) >= 3) {
                    home[h]--; away[h]++; home[w]++; away[w]--; e[0] = w; e[1] = h; changed = true;
                }
            }
            if (!changed) break;
        }
        return es;
    }
    function colorDays(edges, minDays) {
        let best = null;
        for (let att = 0; att < 80; att++) {
            const es = shuffle(edges), busy = [], out = [];
            for (const e of es) {
                let d = 0;
                for (; ; d++) { if (!busy[d]) busy[d] = new Set(); if (!busy[d].has(e[0]) && !busy[d].has(e[1])) break; }
                busy[d].add(e[0]); busy[d].add(e[1]); out.push({ e, d: d + 1 });
            }
            if (!best || busy.length < best.n) best = { n: busy.length, out };
            if (best.n <= minDays) break;
        }
        return best.out;
    }

    /* ---------- knock-out ---------- */
    function bracketOrder(size) { let arr = [1]; while (arr.length < size) arr = arr.flatMap(s => [s, arr.length * 2 + 1 - s]); return arr; }
    function roundName(size, r) {
        const rem = size / Math.pow(2, r - 1);
        return rem === 2 ? "Finale" : rem === 4 ? "Halve finale" : rem === 8 ? "Kwartfinale" : rem === 16 ? "Achtste finale" : rem === 32 ? "Zestiende finale" : "Laatste " + rem;
    }
    function genKnockout(t, ph) {
        let ids = [...ph.entrants]; const n = ids.length;
        if (ph.cfg.seeding === "random") ids = shuffle(ids);
        const size = nextPow2(n), Rfull = Math.round(Math.log2(size)), order = bracketOrder(size);
        /* cfg.rounds: speel maar een deel van de bracket (bv. 1 ronde = play-offs). Leeg = tot de finale. */
        const r0 = ph.cfg.rounds ? Math.max(1, Math.min(Rfull, Math.floor(+ph.cfg.rounds) || Rfull)) : Rfull;
        const R = r0, partial = r0 < Rfull;
        const legsFor = r => r === Rfull ? (ph.cfg.finalTwoLegged ? 2 : 1) : (ph.cfg.twoLegged ? 2 : 1);
        ph.ties = []; ph.matches = [];
        if (partial) {
            /* Beperkt aantal rondes: elke ronde halveert het aantal teams (oneven aantal = beste team krijgt vrijstelling).
               60 teams en 2 rondes -> 30 -> 15 teams. */
            let slots = ids.map(team => ({ team }));
            for (let r = 1; r <= R; r++) {
                const m = slots.length, list = slots.slice(), cur = [];
                const byeSlot = m % 2 ? list.shift() : null;
                const nmr = m === 2 ? "Finale" : m === 4 ? "Halve finale" : m === 8 ? "Kwartfinale" : m === 16 ? "Achtste finale" : m === 32 ? "Zestiende finale" : "Ronde " + r;
                let k = 0;
                if (byeSlot) { cur.push({ id: `k${r}_${k}`, round: r, idx: k, name: nmr, a: byeSlot, b: { team: null }, bye: true, legs: 1, matchIds: [] }); k++; }
                for (let i = 0; i < list.length / 2; i++, k++) cur.push({ id: `k${r}_${k}`, round: r, idx: k, name: nmr, a: list[i], b: list[list.length - 1 - i], bye: false, legs: legsFor(r), matchIds: [] });
                ph.ties.push(...cur);
                slots = cur.map(x => ({ from: x.id }));
            }
            ph.rounds = R; ph.partial = true;
            syncKnockout(t, ph);
            return;
        }
        let prev = [];
        for (let i = 0; i < size / 2; i++) {
            const A = ids[order[2 * i] - 1] || null, B = ids[order[2 * i + 1] - 1] || null;
            prev.push({ id: "k1_" + i, round: 1, idx: i, name: roundName(size, 1), a: { team: A }, b: { team: B }, bye: !A || !B, legs: legsFor(1), matchIds: [] });
        }
        ph.ties.push(...prev);
        for (let r = 2; r <= R; r++) {
            const cur = [];
            for (let i = 0; i < prev.length / 2; i++) cur.push({ id: `k${r}_${i}`, round: r, idx: i, name: roundName(size, r), a: { from: prev[2 * i].id }, b: { from: prev[2 * i + 1].id }, bye: false, legs: legsFor(r), matchIds: [] });
            ph.ties.push(...cur); prev = cur;
        }
        if (ph.cfg.thirdPlace && n >= 4 && R >= 2 && !partial) {
            const semis = ph.ties.filter(x => x.round === R - 1);
            ph.ties.push({ id: "k_third", round: R, idx: 1, third: true, name: "Troostfinale", a: { fromLoser: semis[0].id }, b: { fromLoser: semis[1].id }, bye: false, legs: 1, matchIds: [] });
        }
        ph.rounds = R; ph.partial = partial;
        syncKnockout(t, ph);
    }
    function resolveSrc(ph, s) {
        if (s.team !== undefined) return s.team;
        const id = s.from || s.fromLoser;
        const src = ph.ties.find(x => x.id === id);
        if (!src) return null;
        return s.from ? (src.winner || null) : (src.loser || null);
    }
    function syncKnockout(t, ph) {
        for (const tie of ph.ties) {
            const ta = resolveSrc(ph, tie.a), tb = resolveSrc(ph, tie.b);
            if (tie.bye) { tie.ta = ta; tie.tb = tb; tie.winner = ta || tb; tie.loser = null; tie.agg = null; tie.needPens = false; continue; }
            if (ta !== tie.ta || tb !== tie.tb) {
                ph.matches = ph.matches.filter(m => m.tie !== tie.id);
                tie.matchIds = []; tie.ta = ta; tie.tb = tb;
            }
            if (ta && tb && !tie.matchIds.length) {
                for (let l = 1; l <= tie.legs; l++) {
                    const m = mk(t, { home: l === 1 ? ta : tb, away: l === 1 ? tb : ta, tie: tie.id, leg: l, stage: tie.name });
                    tie.matchIds.push(m.id); ph.matches.push(m);
                }
            }
            tie.winner = null; tie.loser = null; tie.agg = null; tie.needPens = false;
            const ms = tie.matchIds.map(id => ph.matches.find(m => m.id === id)).filter(Boolean);
            if (ms.length && ms.every(m => m.h != null && m.a != null)) {
                let ga = 0, gb = 0;
                for (const m of ms) { if (m.home === ta) { ga += m.h; gb += m.a; } else { ga += m.a; gb += m.h; } }
                tie.agg = [ga, gb];
                if (ga !== gb) { tie.winner = ga > gb ? ta : tb; }
                else {
                    const last = ms[ms.length - 1];
                    if (last.pens === ta || last.pens === tb) tie.winner = last.pens; else tie.needPens = true;
                }
                if (tie.winner) tie.loser = tie.winner === ta ? tb : ta;
            }
        }
    }

    /* ---------- standen & ranking ---------- */
    function standings(ids, matches, rules, tiebreak) {
        const S = new Map(ids.map(id => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, gd: 0 }]));
        for (const m of matches) {
            if (m.h == null || m.a == null) continue;
            const H = S.get(m.home), A = S.get(m.away); if (!H || !A) continue;
            H.p++; A.p++; H.gf += m.h; H.ga += m.a; A.gf += m.a; A.ga += m.h;
            if (m.h > m.a) { H.w++; A.l++; H.pts += rules.win; A.pts += rules.loss; }
            else if (m.h < m.a) { A.w++; H.l++; A.pts += rules.win; H.pts += rules.loss; }
            else { H.d++; A.d++; H.pts += rules.draw; A.pts += rules.draw; }
        }
        const rows = [...S.values()]; rows.forEach(r => r.gd = r.gf - r.ga);
        const idx = new Map(ids.map((id, i) => [id, i]));
        const base = (x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || y.w - x.w || idx.get(x.id) - idx.get(y.id);
        if (tiebreak !== "h2h") return rows.sort(base);
        rows.sort((x, y) => y.pts - x.pts);
        const out = []; let i = 0;
        while (i < rows.length) {
            let j = i; while (j < rows.length && rows[j].pts === rows[i].pts) j++;
            const blk = rows.slice(i, j);
            if (blk.length > 1) {
                const set = new Set(blk.map(r => r.id)), h = new Map(blk.map(r => [r.id, { pts: 0, gd: 0, gf: 0 }]));
                for (const m of matches) {
                    if (m.h == null || m.a == null || !set.has(m.home) || !set.has(m.away)) continue;
                    const a = h.get(m.home), b = h.get(m.away);
                    a.gf += m.h; a.gd += m.h - m.a; b.gf += m.a; b.gd += m.a - m.h;
                    if (m.h > m.a) a.pts += rules.win; else if (m.h < m.a) b.pts += rules.win; else { a.pts += rules.draw; b.pts += rules.draw; }
                }
                blk.sort((x, y) => { const a = h.get(x.id), b = h.get(y.id); return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || base(x, y); });
            }
            out.push(...blk); i = j;
        }
        return out;
    }
    function groupTables(t, ph) {
        return ph.groups.map((g, gi) => standings(g.ids, ph.matches.filter(m => m.group === gi), t.rules, t.rules.tiebreak));
    }
    function phaseTable(t, ph) { return standings(ph.entrants, ph.matches, t.rules, t.rules.tiebreak); }

    function koRanking(t, ph) {
        const R = ph.rounds, partial = !!ph.partial;
        const fin = partial ? null : ph.ties.find(x => x.round === R && !x.third);
        const lastW = new Set(partial ? ph.ties.filter(x => x.round === R && !x.third && x.winner).map(x => x.winner) : []);
        const third = ph.ties.find(x => x.third);
        const elim = new Map();
        for (const tie of ph.ties) { if (tie.bye || !tie.loser || tie.third) continue; elim.set(tie.loser, tie.round); }
        const gd = new Map(ph.entrants.map(id => [id, 0]));
        for (const m of ph.matches) { if (m.h == null) continue; gd.set(m.home, (gd.get(m.home) || 0) + m.h - m.a); gd.set(m.away, (gd.get(m.away) || 0) + m.a - m.h); }
        const idx = new Map(ph.entrants.map((id, i) => [id, i]));
        const score = id => {
            if (lastW.has(id)) return 1e6;
            if (fin && id === fin.winner) return 1e6;
            if (fin && id === fin.loser) return 1e6 - 1;
            if (third && id === third.winner) return 1e6 - 2;
            if (third && id === third.loser) return 1e6 - 3;
            return (elim.get(id) || 0) * 10;
        };
        return [...ph.entrants].sort((a, b) => score(b) - score(a) || (gd.get(b) - gd.get(a)) || idx.get(a) - idx.get(b));
    }
    function groupsRanking(t, ph) {
        const tables = groupTables(t, ph), out = [];
        const maxLen = Math.max(...tables.map(x => x.length));
        for (let pos = 0; pos < maxLen; pos++) {
            const rows = tables.map((tb, gi) => tb[pos] && { ...tb[pos], gi }).filter(Boolean);
            rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || y.w - x.w || x.gi - y.gi);
            out.push(...rows.map(r => r.id));
        }
        return out;
    }
    function computeRanking(t, ph) {
        if (ph.type === "knockout") return koRanking(t, ph);
        if (ph.type === "groups") return groupsRanking(t, ph);
        return phaseTable(t, ph).map(r => r.id);
    }
    function isComplete(ph) {
        if (!ph.entrants) return false;
        if (ph.type === "knockout") {
            const R = ph.rounds, th = ph.ties.find(x => x.third);
            if (ph.partial) { const last = ph.ties.filter(x => x.round === R && !x.third); return last.length > 0 && last.every(x => x.winner); }
            const fin = ph.ties.find(x => x.round === R && !x.third);
            return !!(fin && fin.winner && (!th || th.winner));
        }
        return ph.matches.length > 0 && ph.matches.every(m => m.h != null && m.a != null);
    }
    function progress(ph) {
        if (!ph.entrants) return { done: 0, total: 0 };
        if (ph.type === "knockout") { const real = ph.ties.filter(x => !x.bye); return { done: real.filter(x => x.winner).length, total: real.length }; }
        return { done: ph.matches.filter(m => m.h != null).length, total: ph.matches.length };
    }
    function refreshPhase(t, idx) {
        const ph = t.phases[idx];
        if (ph.type === "knockout") syncKnockout(t, ph);
        if (isComplete(ph)) { ph.ranking = computeRanking(t, ph); ph.status = "done"; }
        else { ph.ranking = null; ph.status = "active"; }
    }

    /* ---------- fasen starten / resetten ---------- */
    /* Nieuwe toernooien (t.v2): elke fase zegt zelf hoeveel teams er doorgaan (advance) en welke
       beste teams een fase overslaan (routes: [{count, dest}]). De rest gaat naar de volgende fase. */
    function splitRoutes(t, i, rk) {
        const ph = t.phases[i], out = [];
        const N = Math.min(rk.length, Math.max(0, Math.floor(+ph.advance) || 0));
        let pos = 0;
        for (const r of (ph.routes || [])) {
            const c = Math.min(Math.floor(+r.count) || 0, N - pos);
            if (c > 0) { out.push({ ids: rk.slice(pos, pos + c), dest: r.dest, from: pos + 1, to: pos + c }); pos += c; }
        }
        if (pos < N) out.push({ ids: rk.slice(pos, N), dest: i + 1, from: pos + 1, to: N });
        return out;
    }
    function entrantsFor(t, idx) {
        if (idx === 0) return t.teams.map(x => x.id);
        if (!t.v2) {
            const rk = t.phases[idx - 1].ranking || [], tk = t.phases[idx].take || {};
            const from = Math.max(1, +tk.from || 1), to = Math.min(rk.length, +tk.to || rk.length);
            return rk.slice(from - 1, to);
        }
        const out = [];
        for (let i = 0; i < idx; i++) {
            const rk = t.phases[i].ranking || [];
            for (const sl of splitRoutes(t, i, rk)) if (sl.dest === idx) out.push(...sl.ids);
        }
        return out;
    }
    function qualify(t, idx) {
        const p = t.phases[idx], next = t.phases[idx + 1]; if (!next) return null;
        const rk = computeRanking(t, p);
        if (!t.v2) {
            const from = Math.max(1, +(next.take || {}).from || 1), to = +(next.take || {}).to || rk.length;
            return { groups: [{ ids: rk.slice(from - 1, to), dest: idx + 1, from, to }] };
        }
        return { groups: splitRoutes(t, idx, rk) };
    }
    function startPhase(t, idx) {
        if (idx > 0 && t.phases.slice(0, idx).some(x => x.status !== "done")) throw new Error("De vorige fase is nog niet klaar.");
        const ph = t.phases[idx];
        ph.entrants = entrantsFor(t, idx);
        ph.matches = []; ph.ties = null; ph.groups = null; ph.ranking = null; ph.warn = null;
        const ids = ph.entrants;
        if (ids.length < 2) throw new Error("Te weinig teams voor deze fase.");
        if (ph.type === "league") {
            for (const f of roundRobin(ids, ph.cfg.legs)) ph.matches.push(mk(t, { ...f, stage: "Speeldag " + f.day }));
        } else if (ph.type === "groups") {
            ph.groups = drawGroups(ids, ph.cfg.groups, ph.cfg.draw);
            ph.groups.forEach((g, gi) => { for (const f of roundRobin(g.ids, ph.cfg.legs)) ph.matches.push(mk(t, { ...f, group: gi, stage: g.name + " \u2022 speeldag " + f.day })); });
        } else if (ph.type === "swiss") {
            const leagueOf = id => { const tm = t.teams.find(x => x.id === id); return tm && tm.lg ? tm.lg : null; };
            const g = swissGraph(ids, ph.cfg.games, ph.cfg.pots, ph.cfg.avoid, leagueOf);
            if (!g) throw new Error("Loting mislukt: met deze instellingen is geen geldig schema te maken. Verlaag het aantal potten of wedstrijden.");
            if (g.relaxed) ph.warn = "Clubs uit dezelfde competitie konden niet volledig vermeden worden.";
            const oriented = orient(g.edges, ids.length);
            for (const { e, d } of colorDays(oriented, ph.cfg.games)) ph.matches.push(mk(t, { day: d, home: ids[e[0]], away: ids[e[1]], stage: "Speeldag " + d }));
            ph.matches.sort((a, b) => a.day - b.day);
        } else if (ph.type === "knockout") {
            genKnockout(t, ph);
        }
        ph.status = "active";
        return ph;
    }
    function resetFrom(t, idx) {
        for (let j = idx; j < t.phases.length; j++) {
            const ph = t.phases[j];
            ph.status = "pending"; ph.entrants = null; ph.matches = []; ph.ties = null; ph.groups = null; ph.ranking = null; ph.warn = null;
        }
    }
    function laterStarted(t, idx) { return t.phases.slice(idx + 1).some(p => p.status !== "pending"); }
    function played(ph) { return (ph.matches || []).some(m => m.h != null); }

    function setScore(t, idx, mid, h, a) {
        const ph = t.phases[idx], m = ph.matches.find(x => x.id === mid); if (!m) return;
        m.h = h; m.a = a;
        if (h === null || a === null) { m.h = null; m.a = null; }
        refreshPhase(t, idx);
    }
    function setPens(t, idx, tieId, teamId) {
        const ph = t.phases[idx], tie = ph.ties.find(x => x.id === tieId); if (!tie) return;
        const last = ph.matches.find(m => m.id === tie.matchIds[tie.matchIds.length - 1]); if (!last) return;
        last.pens = teamId || null;
        refreshPhase(t, idx);
    }

    /* ---------- simuleren ---------- */
    function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
    const randGoals = () => Math.min(9, poisson(1.4));
    /* ---------- Elo-gebaseerde simulatie ---------- */
    /* Elo per team: eerst uit het toernooi zelf, anders uit de clublijst (oudere opgeslagen toernooien hebben nog geen Elo). */
    let _eloSrc = null, _eloMap = null;
    function eloFor(t, id) {
        const x = t.teams.find(q => q.id === id);
        if (x && typeof x.elo === "number") return x.elo;
        if (typeof MASTER_CLUBS !== "undefined") {
            if (_eloSrc !== MASTER_CLUBS) { _eloSrc = MASTER_CLUBS; _eloMap = new Map(MASTER_CLUBS.map(c => [c.id, c.elo])); }
            const v = _eloMap.get(id); if (typeof v === "number") return v;
        }
        return null;
    }
    /* Verwachte doelpunten per team: 1,35 gemiddeld, verschoven door het Elo-verschil (200 punten verschil ≈ 72% puntenverwachting). Zonder Elo: gelijke kans. */
    function eloGoals(t, homeId, awayId) {
        const a = eloFor(t, homeId), b = eloFor(t, awayId);
        const x = (a == null || b == null) ? 0 : Math.max(-1.2, Math.min(1.2, (a - b) * 0.0022));
        return [Math.min(9, poisson(1.35 * Math.exp(x))), Math.min(9, poisson(1.35 * Math.exp(-x)))];
    }
    /* Strafschoppen: bijna een muntworp, met een kleine voorsprong voor het sterkere team (max 60/40). */
    function penPick(t, ta, tb) {
        const a = eloFor(t, ta), b = eloFor(t, tb);
        const p = (a == null || b == null) ? 0.5 : 0.5 + Math.max(-0.1, Math.min(0.1, (a - b) * 0.0002));
        return rnd() < p ? ta : tb;
    }
    function pendingMatches(ph) {
        return (ph.matches || []).map((m, i) => [m, i]).filter(([m]) => m.h == null || m.a == null)
            .sort((x, y) => ((x[0].day || 0) - (y[0].day || 0)) || (x[1] - y[1])).map(x => x[0]);
    }
    /* Gelijke stand na de laatste wedstrijd van een knock-outronde: loot een winnaar na strafschoppen (slaat ties met uitgesloten teams over) */
    function simPens(t, idx, skip) {
        const ph = t.phases[idx]; let n = 0;
        if (ph.type !== "knockout") return 0;
        for (let guard = 0; guard < 300; guard++) {
            const tie = ph.ties.find(x => x.needPens && !skip.has(x.ta) && !skip.has(x.tb));
            if (!tie) break;
            setPens(t, idx, tie.id, penPick(t, tie.ta, tie.tb)); n++;
        }
        return n;
    }
    /* Simuleert de eerstvolgende openstaande wedstrijd van een fase */
    function simNext(t, idx) {
        const ph = t.phases[idx], none = new Set();
        const m = pendingMatches(ph)[0];
        if (m) {
            const [h, a] = eloGoals(t, m.home, m.away);
            setScore(t, idx, m.id, h, a);
            simPens(t, idx, none);
            return { m, h, a };
        }
        if (simPens(t, idx, none) > 0) return { pens: true };
        return null;
    }
    /* Simuleert alle openstaande wedstrijden, behalve die waar een team uit `excluded` aan meedoet */
    function simAll(t, idx, excluded) {
        const ph = t.phases[idx]; let n = 0;
        for (let guard = 0; guard < 5000; guard++) {
            const m = pendingMatches(ph).find(x => !excluded.has(x.home) && !excluded.has(x.away));
            if (m) { { const [gh, ga] = eloGoals(t, m.home, m.away); setScore(t, idx, m.id, gh, ga); } n++; simPens(t, idx, excluded); continue; }
            if (simPens(t, idx, excluded) > 0) continue;
            break;
        }
        return n;
    }

    /* ---------- statistieken ---------- */
    function allPlayed(t) {
        const out = [];
        for (const ph of t.phases) for (const m of (ph.matches || [])) if (m.h != null && m.a != null) out.push({ ...m, phase: ph.name });
        return out;
    }
    function overallStats(t) {
        const ms = allPlayed(t), S = new Map(t.teams.map(x => [x.id, { id: x.id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }]));
        for (const m of ms) {
            const H = S.get(m.home), A = S.get(m.away); if (!H || !A) continue;
            H.p++; A.p++; H.gf += m.h; H.ga += m.a; A.gf += m.a; A.ga += m.h;
            if (m.h > m.a) { H.w++; A.l++; } else if (m.h < m.a) { A.w++; H.l++; } else { H.d++; A.d++; }
        }
        return { matches: ms, teams: [...S.values()] };
    }

    /* ---------- templates + validatie ---------- */
    function potChoice(n, M) {
        for (const P of [4, 3, 2]) {
            if (n % P === 0 && M % P === 0) {
                const size = n / P, cap = M / P;
                if (cap <= size - 1 && (size * cap) % 2 === 0) return P;
            }
        }
        return 1;
    }
    function template(key, n) {
        n = Math.max(2, n || 16);
        const ph = (type, name, cfg, advance) => ({ type, name, cfg, advance: advance == null ? null : advance, routes: [] });
        const ko = (extra = {}, advance, name) => ph("knockout", name || "Knock-outfase", { twoLegged: false, finalTwoLegged: false, thirdPlace: false, seeding: "seeded", rounds: null, ...extra }, advance);
        const swiss = () => {
            let M = Math.min(8, n - 1); if ((n * M) % 2) M--; M = Math.max(1, M);
            return { games: M, pots: potChoice(n, M), avoid: true };
        };
        switch (key) {
            case "league1": return [ph("league", "Competitie", { legs: 1 })];
            case "league2": return [ph("league", "Competitie", { legs: 2 })];
            case "ko": return [ko({ seeding: "random" })];
            case "groups_ko": {
                const G = Math.max(1, Math.round(n / 4));
                return [ph("groups", "Groepsfase", { groups: G, legs: 1, draw: "pots" }, Math.min(n, Math.max(2, G * 2))), ko({})];
            }
            case "groups_best": {
                const G = Math.max(1, Math.round(n / 4));
                return [ph("groups", "Groepsfase", { groups: G, legs: 1, draw: "pots" }, Math.min(n, Math.max(2, nextPow2(n) / 2))), ko({})];
            }
            case "ucl":
                return [ph("swiss", "League phase", swiss(), Math.max(2, Math.round(n * 2 / 3))), ko({ twoLegged: true })];
            case "ucl_po": {
                if (n < 3) return template("ucl", n);
                let K = 1; while (K * 6 <= n) K *= 2;   /* grootste macht van 2 met 3K <= n */
                const lp = ph("swiss", "League phase", swiss(), 3 * K);
                lp.routes = [{ count: K, dest: 2 }];
                return [lp, ko({ twoLegged: true, rounds: 1 }, K, "Play-offs"), ko({ twoLegged: true })];
            }
            default: return [];
        }
    }
    function newPhaseDraft(type) {
        const base = { league: { legs: 1 }, groups: { groups: 4, legs: 1, draw: "pots" }, swiss: { games: 6, pots: 1, avoid: false }, knockout: { twoLegged: false, finalTwoLegged: false, thirdPlace: false, seeding: "seeded", rounds: null } }[type];
        return { type, name: TYPE_LABEL[type], cfg: { ...base }, advance: null, routes: [] };
    }
    function plan(phases, n) {
        const errors = [], info = [], L = phases.length;
        const incoming = phases.map(() => 0);
        if (!L) errors.push("Voeg minstens één fase toe."); else incoming[0] = n;
        const unknownAfter = i => { for (let j = i + 1; j < L; j++) incoming[j] = NaN; };
        phases.forEach((p, i) => {
            const nm = `Fase ${i + 1} (${p.name})`;
            const cnt = incoming[i], last = i === L - 1;
            if (Number.isNaN(cnt)) { info.push({ count: NaN, matches: 0, advance: null, last, remain: null }); unknownAfter(i); return; }
            let matches = 0, remain = null;
            if (cnt < 2) errors.push(`${nm}: minstens 2 teams nodig (nu ${cnt}).`);
            else if (p.type === "league") { matches = p.cfg.legs * cnt * (cnt - 1) / 2; }
            else if (p.type === "groups") {
                const G = Math.floor(+p.cfg.groups || 0);
                if (G < 1) errors.push(`${nm}: minstens 1 groep.`);
                else if (cnt < 2 * G) errors.push(`${nm}: ${cnt} teams is te weinig voor ${G} groepen (minstens 2 per groep).`);
                else { const base = Math.floor(cnt / G), extra = cnt % G; for (let g = 0; g < G; g++) { const s = base + (g < extra ? 1 : 0); matches += p.cfg.legs * s * (s - 1) / 2; } }
            } else if (p.type === "swiss") {
                const M = Math.floor(+p.cfg.games || 0), P = Math.floor(+p.cfg.pots || 1);
                if (M < 1) errors.push(`${nm}: minstens 1 wedstrijd per team.`);
                else if (M > cnt - 1) errors.push(`${nm}: ${M} wedstrijden per team kan niet met ${cnt} teams (max ${cnt - 1}).`);
                else if ((cnt * M) % 2) errors.push(`${nm}: ${cnt} teams × ${M} wedstrijden is oneven. Kies een ander aantal.`);
                else if (P > 1 && (cnt % P || M % P)) errors.push(`${nm}: met ${P} potten moet het aantal teams (${cnt}) en wedstrijden (${M}) deelbaar zijn door ${P}.`);
                else if (P > 1 && (M / P > cnt / P - 1 || ((cnt / P) * (M / P)) % 2)) errors.push(`${nm}: deze combinatie van potten en wedstrijden kan niet (te veel tegenstanders per pot of oneven).`);
                else matches = cnt * M / 2;
            } else if (p.type === "knockout") {
                const size = nextPow2(cnt), R = Math.round(Math.log2(size));
                let r0 = p.cfg.rounds ? Math.floor(+p.cfg.rounds) : R;
                if (!(r0 >= 1)) r0 = R;
                if (r0 > R) { errors.push(`${nm}: ${r0} rondes kan niet met ${cnt} teams (max ${R}).`); r0 = R; }
                remain = Math.ceil(cnt / Math.pow(2, r0));
                const third = (r0 === R && p.cfg.thirdPlace && cnt >= 4) ? 1 : 0;
                matches = (cnt - remain + third) * (p.cfg.twoLegged ? 2 : 1);
            }
            let adv = null;
            if (!last) {
                const a = p.advance;
                if (a == null || a === "" || !(Math.floor(+a) >= 1)) { errors.push(`${nm}: vul in hoeveel teams er doorgaan naar de volgende ronde.`); unknownAfter(i); }
                else if (Math.floor(+a) > cnt) { errors.push(`${nm}: ${Math.floor(+a)} teams laten doorgaan kan niet, er doen er maar ${cnt} mee.`); unknownAfter(i); }
                else {
                    adv = Math.floor(+a);
                    let rest = adv, bad = false;
                    (p.routes || []).forEach(r => {
                        const c = Math.floor(+r.count) || 0, d = r.dest;
                        if (c < 1) { errors.push(`${nm}: vul in hoeveel teams een ronde overslaan.`); bad = true; }
                        else if (!(d >= i + 2 && d < L)) { errors.push(`${nm}: kies een geldige fase voor de teams die een ronde overslaan.`); bad = true; }
                        else { rest -= c; incoming[d] += c; }
                    });
                    if (rest < 0) { errors.push(`${nm}: er slaan meer teams een ronde over dan er doorgaan (${adv}).`); bad = true; }
                    if (bad) unknownAfter(i); else incoming[i + 1] += rest;
                }
            }
            info.push({ count: cnt, matches, advance: adv, last, remain });
        });
        return { errors, info };
    }
    function create(name, teams, phases, rules) {
        const t = {
            id: uid(), name, createdAt: Date.now(), seq: 0, v2: true,
            teams: teams.map(x => ({ ...x })), rules: { ...rules },
            phases: phases.map(p => ({ id: uid(), type: p.type, name: p.name, cfg: JSON.parse(JSON.stringify(p.cfg)), advance: p.advance == null ? null : Math.floor(+p.advance), routes: (p.routes || []).map(r => ({ count: Math.floor(+r.count), dest: +r.dest })), status: "pending", entrants: null, matches: [], ties: null, groups: null, ranking: null }))
        };
        startPhase(t, 0);
        return t;
    }
    function champion(t) {
        const last = t.phases[t.phases.length - 1];
        return last && last.status === "done" && last.ranking ? last.ranking[0] : null;
    }

    return { qualify, shuffle, nextPow2, uid, TYPE_LABEL, roundRobin, standings, groupTables, phaseTable, computeRanking, isComplete, progress, startPhase, resetFrom, laterStarted, played, setScore, setPens, simNext, simAll, pendingMatches, refreshPhase, overallStats, allPlayed, template, newPhaseDraft, plan, create, champion, swissGraph, potChoice };
})();
if (typeof module !== "undefined") module.exports = TEngine;
