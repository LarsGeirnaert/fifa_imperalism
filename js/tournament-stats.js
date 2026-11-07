/* ============================================================================
   STATISTIEKEN OVER ALLE TOERNOOIEN
   Pure module: build() rekent alles uit, html() tekent de tabs.
   Teams worden over toernooien heen herkend via hun club-id; eigen teams via hun naam.
   ============================================================================ */
const TStats = (() => {
    const TABS = [["overview", "fa-gauge-high", "Overzicht"], ["teams", "fa-ranking-star", "Ploegen"], ["team", "fa-user-shield", "Ploeg-detail"], ["records", "fa-medal", "Records"], ["h2h", "fa-people-arrows", "Onderling"], ["tours", "fa-trophy", "Toernooien"]];

    /* ---------- berekenen ---------- */
    function build(items, scope, pool) {
        const poolIds = new Set((pool || []).map(c => c.id));
        const keyOf = x => (poolIds.has(x.id) ? x.id : "n:" + String(x.name).trim().toLowerCase());
        const its = items.filter(t => scope === "all" || t.id === scope).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const T = new Map(), M = [], tours = [];
        const getT = (key, x) => {
            let r = T.get(key);
            if (!r) {
                r = { key, name: x.name, color: x.color || "#64748b", elo: null, tn: new Set(), titles: [], second: 0, third: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, fts: 0, hp: 0, hw: 0, hd: 0, hl: 0, ap: 0, aw: 0, ad: 0, al: 0, form: [], cw: 0, bw: 0, cu: 0, bu: 0, cn: 0, bn: 0, bigW: null, bigL: null, opp: new Map(), per: new Map() };
                T.set(key, r);
            }
            if (typeof x.elo === "number") r.elo = x.elo;
            return r;
        };
        const apply = (r, home, f, a, oppKey, mr, tid, tname) => {
            const res = f > a ? "W" : f < a ? "L" : "D";
            r.p++; r.gf += f; r.ga += a; r.form.push(res);
            if (a === 0) r.cs++;
            if (f === 0) r.fts++;
            const side = home ? "h" : "a";
            r[side + "p"]++; r[side + (res === "W" ? "w" : res === "D" ? "d" : "l")]++;
            if (res === "W") r.w++; else if (res === "D") r.d++; else r.l++;
            if (res === "W") { r.cw++; r.bw = Math.max(r.bw, r.cw); } else r.cw = 0;
            if (res !== "L") { r.cu++; r.bu = Math.max(r.bu, r.cu); } else r.cu = 0;
            if (res !== "W") { r.cn++; r.bn = Math.max(r.bn, r.cn); } else r.cn = 0;
            const diff = f - a;
            if (diff > 0 && (!r.bigW || diff > r.bigW.diff || (diff === r.bigW.diff && f > r.bigW.f))) r.bigW = { diff, f, a, m: mr };
            if (diff < 0 && (!r.bigL || -diff > r.bigL.diff || (-diff === r.bigL.diff && a > r.bigL.f))) r.bigL = { diff: -diff, f: a, a: f, m: mr };
            let o = r.opp.get(oppKey); if (!o) { o = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }; r.opp.set(oppKey, o); }
            o.p++; o.gf += f; o.ga += a; o[res === "W" ? "w" : res === "D" ? "d" : "l"]++;
            let pt = r.per.get(tid); if (!pt) { pt = { name: tname, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }; r.per.set(tid, pt); }
            pt.p++; pt.gf += f; pt.ga += a; pt[res === "W" ? "w" : res === "D" ? "d" : "l"]++;
        };
        for (const t of its) {
            const km = new Map(t.teams.map(x => [x.id, { ...x, key: keyOf(x) }]));
            km.forEach(x => getT(x.key, x).tn.add(t.id));
            const info = { id: t.id, name: t.name, n: t.teams.length, matches: 0, goals: 0, champ: null, second: null, third: null, phases: t.phases.length, done: false };
            const last = t.phases[t.phases.length - 1];
            if (last && last.status === "done" && Array.isArray(last.ranking)) {
                info.done = true;
                const at = i => (last.ranking[i] && km.get(last.ranking[i]) ? km.get(last.ranking[i]).key : null);
                info.champ = at(0); info.second = at(1); info.third = at(2);
                if (info.champ) getT(info.champ, km.get(last.ranking[0])).titles.push(t.name);
                if (info.second) T.get(info.second).second++;
                if (info.third) T.get(info.third).third++;
            }
            tours.push(info);
            for (const ph of t.phases) {
                const ms = (ph.matches || []).map((m, i) => [m, i]).filter(([m]) => m.h != null && m.a != null && km.has(m.home) && km.has(m.away))
                    .sort((x, y) => ((x[0].day || 0) - (y[0].day || 0)) || (x[1] - y[1])).map(x => x[0]);
                for (const m of ms) {
                    const H = km.get(m.home), A = km.get(m.away);
                    const mr = { hk: H.key, ak: A.key, h: m.h, a: m.a, t: t.name, tid: t.id, ph: ph.name, eh: typeof H.elo === "number" ? H.elo : null, ea: typeof A.elo === "number" ? A.elo : null, n: M.length };
                    M.push(mr); info.matches++; info.goals += m.h + m.a;
                    apply(T.get(H.key), true, m.h, m.a, A.key, mr, t.id, t.name);
                    apply(T.get(A.key), false, m.a, m.h, H.key, mr, t.id, t.name);
                }
            }
        }
        const teams = [...T.values()];
        for (const r of teams) {
            r.gd = r.gf - r.ga; r.pts = r.w * 3 + r.d; r.ppg = r.p ? r.pts / r.p : 0; r.winp = r.p ? r.w / r.p : 0;
            r.gpg = r.p ? r.gf / r.p : 0; r.gapg = r.p ? r.ga / r.p : 0; r.nt = r.titles.length; r.ntn = r.tn.size;
            r.titlesN = r.nt;
        }
        const goals = M.reduce((s, m) => s + m.h + m.a, 0);
        const hist = new Array(9).fill(0), score = new Map();
        for (const m of M) { hist[Math.min(8, m.h + m.a)]++; const k = Math.max(m.h, m.a) + "-" + Math.min(m.h, m.a); score.set(k, (score.get(k) || 0) + 1); }
        return {
            T, teams, M, tours, goals, n: M.length, hist,
            scores: [...score.entries()].sort((a, b) => b[1] - a[1]),
            hw: M.filter(m => m.h > m.a).length, dr: M.filter(m => m.h === m.a).length, aw: M.filter(m => m.h < m.a).length,
            cs: M.reduce((s, m) => s + (m.h === 0 ? 1 : 0) + (m.a === 0 ? 1 : 0), 0)
        };
    }

    /* ---------- tekenen ---------- */
    const f1 = x => (Number.isFinite(x) ? x.toFixed(2) : "–");
    const pc = x => Math.round(x * 100) + "%";
    function html(D, S, esc, scopes) {
        const tn = k => D.T.get(k);
        const dot = k => `<span class="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-white/50" style="background:${esc((tn(k) || {}).color || "#64748b")}"></span>`;
        const nameOf = k => (tn(k) ? tn(k).name : "?");
        const tlabel = k => `<span class="inline-flex items-center gap-1.5 min-w-0">${dot(k)}<span class="truncate">${esc(nameOf(k))}</span></span>`;
        const tlink = k => `<button data-a="gs-team" data-id="${esc(k)}" class="inline-flex items-center gap-1.5 min-w-0 hover:text-amber-300 text-left">${dot(k)}<span class="truncate">${esc(nameOf(k))}</span></button>`;
        const card = (l, v, sub) => `<div class="card text-center !p-2"><div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">${l}</div><div class="font-broadcast text-2xl font-extrabold text-amber-300">${v}</div>${sub ? `<div class="text-[10px] text-slate-500">${sub}</div>` : ""}</div>`;
        const wdl = (w, d, l) => { const n = w + d + l || 1; return `<span class="inline-flex h-2 w-24 rounded overflow-hidden bg-slate-800 align-middle"><span style="width:${100 * w / n}%" class="bg-emerald-500"></span><span style="width:${100 * d / n}%" class="bg-slate-400"></span><span style="width:${100 * l / n}%" class="bg-red-500"></span></span>`; };
        const dotF = x => `<span class="inline-flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-black ${x === "W" ? "bg-emerald-500 text-slate-950" : x === "L" ? "bg-red-500 text-white" : "bg-slate-500 text-white"}">${x === "D" ? "G" : x === "L" ? "V" : "W"}</span>`;
        const sel = (k, val, opts) => `<select data-c="gs" data-k="${k}" class="inp">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(val) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
        const minSel = `<div><span class="lbl">Min. wedstrijden</span>${sel("min", S.min, [1, 2, 3, 5, 10, 20].map(n => [n, String(n)]))}</div>`;
        const elig = D.teams.filter(r => r.p >= +S.min);
        const list = (icon, label, arr, val, fmt, n = 5) => {
            const rows = arr.filter(r => val(r) != null).slice(0, n);
            return rows.length ? `<div class="card"><span class="lbl"><i class="fa-solid ${icon} mr-1 text-amber-300"></i>${label}</span>${rows.map((r, i) => `<div class="flex justify-between gap-2 text-xs py-0.5"><span class="text-slate-200 min-w-0 flex items-center gap-1">${i + 1}. ${tlink(r.key)}</span><span class="font-bold text-white whitespace-nowrap">${fmt(r)}</span></div>`).join("")}</div>` : "";
        };
        const by = (arr, f, dir = -1) => [...arr].sort((a, b) => dir * (f(a) - f(b)) || b.p - a.p);
        const mline = (m, extra) => `<div class="flex justify-between gap-2 py-0.5 text-xs"><span class="truncate text-slate-200">${esc(nameOf(m.hk))} ${m.h}-${m.a} ${esc(nameOf(m.ak))}</span><span class="text-slate-500 whitespace-nowrap truncate max-w-[45%]">${extra || esc(m.t)}</span></div>`;

        const scopeBar = `<div class="grid grid-cols-2 gap-2 items-end"><div><span class="lbl">Bereik</span>${sel("scope", S.scope, [["all", "Alle toernooien"], ...scopes.map(t => [t.id, t.name])])}</div>${S.tab === "overview" || S.tab === "tours" || S.tab === "team" || S.tab === "h2h" ? "<div></div>" : minSel}</div>`;
        const tabs = `<div class="flex gap-1.5 overflow-x-auto pb-1">${TABS.map(([k, ic, l]) => `<button data-a="gs-tab" data-v="${k}" class="btn whitespace-nowrap ${S.tab === k ? "btn-gold" : ""}"><i class="fa-solid ${ic} mr-1"></i>${l}</button>`).join("")}</div>`;
        let h = tabs + scopeBar;
        if (!D.n) return h + `<div class="card text-center text-slate-500 italic py-10">Nog geen gespeelde wedstrijden${S.scope !== "all" ? " in dit toernooi" : ""}. Speel of simuleer eerst wat wedstrijden.</div>`;

        /* ---- overzicht ---- */
        if (S.tab === "overview") {
            const mx = Math.max(...D.hist, 1);
            h += `<div class="grid grid-cols-3 gap-2">${card("Toernooien", D.tours.length, D.tours.filter(t => t.done).length + " afgerond")}${card("Teams", D.teams.length)}${card("Wedstrijden", D.n)}${card("Doelpunten", D.goals)}${card("Gem. per wedstrijd", f1(D.goals / D.n))}${card("Clean sheets", D.cs)}</div>
<div class="grid grid-cols-3 gap-2">${card("Thuis wint", pc(D.hw / D.n), D.hw + "×")}${card("Gelijkspel", pc(D.dr / D.n), D.dr + "×")}${card("Uit wint", pc(D.aw / D.n), D.aw + "×")}</div>
<div class="grid md:grid-cols-2 gap-3"><div class="card"><span class="lbl"><i class="fa-solid fa-chart-column mr-1 text-amber-300"></i>Doelpunten per wedstrijd</span><div class="flex items-end gap-1.5 h-28 pt-2">${D.hist.map((c, i) => `<div class="flex-1 flex flex-col items-center justify-end h-full"><span class="text-[10px] text-slate-300 font-bold">${c}</span><div class="w-full rounded-t bg-gradient-to-t from-amber-500 to-amber-300" style="height:${Math.max(2, 100 * c / mx * 0.8)}%"></div><span class="text-[10px] text-slate-500">${i === 8 ? "8+" : i}</span></div>`).join("")}</div></div>
<div class="card"><span class="lbl"><i class="fa-solid fa-hashtag mr-1 text-amber-300"></i>Populairste uitslagen</span>${D.scores.slice(0, 6).map(([k, c], i) => `<div class="flex items-center gap-2 text-xs py-0.5"><span class="w-5 text-slate-500">${i + 1}.</span><span class="w-10 font-bold text-white">${k}</span><span class="flex-1 h-2 rounded bg-slate-800 overflow-hidden"><span class="block h-full bg-sky-500" style="width:${100 * c / D.scores[0][1]}%"></span></span><span class="w-14 text-right text-slate-300">${c}× (${pc(c / D.n)})</span></div>`).join("")}</div></div>
<div class="grid md:grid-cols-3 gap-3">${list("fa-trophy", "Meeste titels", by(D.teams, r => r.nt), r => r.nt > 0 ? 1 : null, r => r.nt + " 🏆")}${list("fa-percent", "Hoogste winstpercentage", by(elig, r => r.winp), r => r.p, r => pc(r.winp) + " (" + r.p + " gesp.)")}${list("fa-futbol", "Meeste doelpunten", by(D.teams, r => r.gf), r => r.gf, r => r.gf)}</div>`;
        }

        /* ---- ploegen (sorteerbare tabel) ---- */
        else if (S.tab === "teams") {
            const cols = [["ntn", "T", "Toernooien"], ["p", "G", "Gespeeld"], ["w", "W", "Winst"], ["d", "GL", "Gelijk"], ["l", "V", "Verlies"], ["winp", "W%", "Winstpercentage"], ["gd", "DS", "Doelsaldo"], ["gpg", "+/w", "Gem. gemaakt"], ["gapg", "−/w", "Gem. tegen"], ["ppg", "Pt/w", "Punten per wedstrijd (3-1-0)"], ["nt", "🏆", "Titels"]];
            const rows = [...elig].sort((a, b) => S.dir * ((b[S.sort] - a[S.sort]) || 0) || b.p - a.p || a.name.localeCompare(b.name));
            h += `<div class="text-[11px] text-slate-400">Klik op een kolomkop om te sorteren, op een teamnaam voor details. ${elig.length} van ${D.teams.length} teams.</div>
<div class="card !p-2"><div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-slate-400 uppercase text-[10px]"><th>#</th><th class="l">Team</th>${cols.map(([k, l, tt]) => `<th><button data-a="gs-sort" data-v="${k}" title="${tt}" class="${S.sort === k ? "text-amber-300" : ""}">${l}${S.sort === k ? (S.dir === 1 ? " ▼" : " ▲") : ""}</button></th>`).join("")}<th>W-G-V</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="border-t border-slate-800/70"><td class="text-slate-400">${i + 1}</td><td class="l text-slate-100 font-semibold">${tlink(r.key)}</td><td>${r.ntn}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="font-bold text-white">${pc(r.winp)}</td><td class="${r.gd >= 0 ? "text-emerald-300" : "text-red-300"}">${r.gd > 0 ? "+" : ""}${r.gd}</td><td>${f1(r.gpg)}</td><td>${f1(r.gapg)}</td><td>${f1(r.ppg)}</td><td>${r.nt || ""}</td><td>${wdl(r.w, r.d, r.l)}</td></tr>`).join("")}</tbody></table></div></div>`;
        }

        /* ---- ploeg-detail ---- */
        else if (S.tab === "team") {
            const all = [...D.teams].sort((a, b) => a.name.localeCompare(b.name));
            h += `<div class="card"><span class="lbl">Kies een ploeg</span>${sel("team", S.team, [["", "— kies —"], ...all.map(r => [r.key, r.name + " (" + r.p + " gesp.)"])])}</div>`;
            const r = S.team && tn(S.team);
            if (!r || !r.p) h += `<div class="card text-center text-slate-500 italic py-8">${r ? "Deze ploeg heeft nog geen wedstrijden gespeeld." : "Kies een ploeg om alle details te zien."}</div>`;
            else {
                const opps = [...r.opp.entries()].map(([k, o]) => ({ key: k, ...o, winp: o.w / o.p }));
                const oppRow = (o, txt) => `<div class="flex justify-between gap-2 text-xs py-0.5"><span class="min-w-0">${tlink(o.key)}</span><span class="text-slate-200 whitespace-nowrap">${txt}</span></div>`;
                const rec = o => `${o.w}-${o.d}-${o.l} (${o.gf}-${o.ga})`;
                const my = D.M.filter(m => m.hk === r.key || m.ak === r.key).slice(-10).reverse();
                h += `<div class="card flex flex-wrap items-center gap-3"><div class="text-lg font-black text-white min-w-0 flex items-center gap-2">${dot(r.key)}<span class="truncate">${esc(r.name)}</span></div>${r.elo != null ? `<span class="text-xs text-slate-400">Elo ${r.elo}</span>` : ""}${r.nt ? `<span class="text-xs font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">🏆 ${r.nt}× winnaar</span>` : ""}${r.second ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-200">🥈 ${r.second}×</span>` : ""}${r.third ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-200">🥉 ${r.third}×</span>` : ""}<span class="ml-auto flex gap-0.5">${r.form.slice(-10).map(dotF).join("")}</span></div>
<div class="grid grid-cols-3 md:grid-cols-6 gap-2">${card("Gespeeld", r.p, r.ntn + " toernooi" + (r.ntn === 1 ? "" : "en"))}${card("Winst%", pc(r.winp), r.w + "W " + r.d + "G " + r.l + "V")}${card("Pt/wedstr.", f1(r.ppg))}${card("Doelpunten", r.gf + "-" + r.ga, (r.gd > 0 ? "+" : "") + r.gd)}${card("Gem. +/−", f1(r.gpg) + " / " + f1(r.gapg))}${card("Clean sheets", r.cs, r.fts + "× niet gescoord")}</div>
<div class="grid md:grid-cols-2 gap-3"><div class="card"><span class="lbl">Thuis vs uit</span><table class="w-full text-xs"><thead><tr class="text-slate-400 uppercase text-[10px]"><th class="l"></th><th>G</th><th>W</th><th>GL</th><th>V</th><th>W%</th></tr></thead><tbody><tr class="border-t border-slate-800/70"><td class="l">Thuis</td><td>${r.hp}</td><td>${r.hw}</td><td>${r.hd}</td><td>${r.hl}</td><td class="font-bold text-white">${r.hp ? pc(r.hw / r.hp) : "–"}</td></tr><tr class="border-t border-slate-800/70"><td class="l">Uit</td><td>${r.ap}</td><td>${r.aw}</td><td>${r.ad}</td><td>${r.al}</td><td class="font-bold text-white">${r.ap ? pc(r.aw / r.ap) : "–"}</td></tr></tbody></table>
<div class="text-[11px] text-slate-400 mt-2 space-y-0.5"><div>🔥 Langste winstreeks: <b class="text-white">${r.bw}</b> • 🛡️ Ongeslagen: <b class="text-white">${r.bu}</b> • ❄️ Zonder winst: <b class="text-white">${r.bn}</b></div>${r.bigW ? `<div>Grootste zege: <b class="text-white">${r.bigW.f}-${r.bigW.a}</b> tegen ${esc(nameOf(r.bigW.m.hk === r.key ? r.bigW.m.ak : r.bigW.m.hk))}</div>` : ""}${r.bigL ? `<div>Grootste nederlaag: <b class="text-white">${r.bigL.a}-${r.bigL.f}</b> tegen ${esc(nameOf(r.bigL.m.hk === r.key ? r.bigL.m.ak : r.bigL.m.hk))}</div>` : ""}</div></div>
<div class="card"><span class="lbl">Per toernooi</span><div class="max-h-48 overflow-y-auto"><table class="w-full text-xs"><thead><tr class="text-slate-400 uppercase text-[10px]"><th class="l">Toernooi</th><th>G</th><th>W-G-V</th><th>Doelp.</th></tr></thead><tbody>${[...r.per.values()].map(p => `<tr class="border-t border-slate-800/70"><td class="l truncate max-w-[9rem]">${esc(p.name)}${r.titles.includes(p.name) ? " 🏆" : ""}</td><td>${p.p}</td><td>${p.w}-${p.d}-${p.l}</td><td>${p.gf}-${p.ga}</td></tr>`).join("")}</tbody></table></div></div></div>
<div class="grid md:grid-cols-3 gap-3"><div class="card"><span class="lbl">Meest gespeelde tegenstanders</span>${by(opps, o => o.p).slice(0, 5).map(o => oppRow(o, o.p + "× • " + rec(o))).join("")}</div>
<div class="card"><span class="lbl">Favoriete tegenstanders</span>${opps.filter(o => o.p >= 2 && o.winp > 0).sort((a, b) => b.winp - a.winp || b.p - a.p).slice(0, 5).map(o => oppRow(o, pc(o.winp) + " • " + rec(o))).join("") || `<div class="text-xs text-slate-500 italic">Pas na 2+ duels tegen dezelfde ploeg.</div>`}</div>
<div class="card"><span class="lbl">Beul-ploegen (slechtste score)</span>${opps.filter(o => o.p >= 2 && o.w < o.p).sort((a, b) => a.winp - b.winp || b.p - a.p).slice(0, 5).map(o => oppRow(o, pc(o.winp) + " • " + rec(o))).join("") || `<div class="text-xs text-slate-500 italic">Pas na 2+ duels tegen dezelfde ploeg.</div>`}</div></div>
<div class="card"><span class="lbl">Laatste wedstrijden</span>${my.map(m => mline(m, esc(m.t) + " • " + esc(m.ph))).join("")}</div>`;
            }
        }

        /* ---- records ---- */
        else if (S.tab === "records") {
            const streak = k => by(elig, r => r[k]);
            const ms = [...D.M];
            const upsets = ms.map(m => { if (m.eh == null || m.ea == null || m.h === m.a) return null; const hw = m.h > m.a, gap = hw ? m.ea - m.eh : m.eh - m.ea; return gap > 0 ? { m, gap } : null; }).filter(Boolean).sort((a, b) => b.gap - a.gap).slice(0, 5);
            h += `<div class="text-[11px] text-slate-400">Ranglijsten tellen alleen teams met minstens ${S.min} gespeelde wedstrijd${+S.min === 1 ? "" : "en"}. Pas dat bovenaan aan.</div>
<div class="grid md:grid-cols-3 gap-3">
${list("fa-trophy", "Meeste titels", by(D.teams, r => r.nt), r => (r.nt ? 1 : null), r => r.nt + " 🏆")}
${list("fa-medal", "Meeste podiumplaatsen", by(D.teams, r => r.nt + r.second + r.third), r => (r.nt + r.second + r.third ? 1 : null), r => `🥇${r.nt} 🥈${r.second} 🥉${r.third}`)}
${list("fa-calendar-check", "Meeste toernooien gespeeld", by(D.teams, r => r.ntn), r => r.ntn, r => r.ntn)}
${list("fa-percent", "Hoogste winstpercentage", by(elig, r => r.winp), r => r.p, r => pc(r.winp) + " (" + r.p + ")")}
${list("fa-star", "Meeste punten per wedstrijd", by(elig, r => r.ppg), r => r.p, r => f1(r.ppg))}
${list("fa-face-frown", "Laagste winstpercentage", by(elig, r => r.winp, 1), r => r.p, r => pc(r.winp) + " (" + r.p + ")")}
${list("fa-bullseye", "Beste aanval (gem. per wedstrijd)", by(elig, r => r.gpg), r => r.p, r => f1(r.gpg))}
${list("fa-lock", "Beste verdediging (gem. tegen)", by(elig, r => r.gapg, 1), r => r.p, r => f1(r.gapg))}
${list("fa-scale-balanced", "Beste doelsaldo", by(elig, r => r.gd), r => (r.gd > 0 ? 1 : null), r => "+" + r.gd)}
${list("fa-futbol", "Meeste doelpunten", by(D.teams, r => r.gf), r => r.gf, r => r.gf)}
${list("fa-hand", "Meeste clean sheets", by(D.teams, r => r.cs), r => r.cs, r => r.cs)}
${list("fa-handshake", "Meeste gelijke spelen", by(D.teams, r => r.d), r => r.d, r => r.d + "×")}
${list("fa-fire", "Langste winstreeks", streak("bw"), r => r.bw, r => r.bw + " op rij")}
${list("fa-shield-halved", "Langste ongeslagen reeks", streak("bu"), r => r.bu, r => r.bu + " wedstrijden")}
${list("fa-snowflake", "Langste reeks zonder winst", streak("bn"), r => (r.bn >= 2 ? r.bn : null), r => r.bn + " wedstrijden")}
${list("fa-house", "Beste thuisploeg (win%)", by(D.teams.filter(r => r.hp >= Math.max(2, +S.min)), r => r.hw / r.hp), r => r.hp, r => pc(r.hw / r.hp) + " (" + r.hp + ")")}
${list("fa-plane", "Beste uitploeg (win%)", by(D.teams.filter(r => r.ap >= Math.max(2, +S.min)), r => r.aw / r.ap), r => r.ap, r => pc(r.aw / r.ap) + " (" + r.ap + ")")}
${list("fa-ban", "Meeste keren niet gescoord", by(D.teams, r => r.fts), r => r.fts, r => r.fts + "×")}
</div>
<div class="grid md:grid-cols-2 gap-3">
<div class="card"><span class="lbl"><i class="fa-solid fa-burst mr-1 text-amber-300"></i>Grootste overwinningen</span>${[...ms].sort((a, b) => Math.abs(b.h - b.a) - Math.abs(a.h - a.a) || (b.h + b.a) - (a.h + a.a)).slice(0, 6).map(m => mline(m)).join("")}</div>
<div class="card"><span class="lbl"><i class="fa-solid fa-fire-flame-curved mr-1 text-amber-300"></i>Meeste doelpunten in 1 wedstrijd</span>${[...ms].sort((a, b) => (b.h + b.a) - (a.h + a.a)).slice(0, 6).map(m => mline(m)).join("")}</div>
${upsets.length ? `<div class="card"><span class="lbl"><i class="fa-solid fa-bolt mr-1 text-amber-300"></i>Grootste stunts (laagste Elo wint)</span>${upsets.map(u => mline(u.m, "+" + u.gap + " Elo")).join("")}</div>` : ""}
<div class="card"><span class="lbl"><i class="fa-solid fa-equals mr-1 text-amber-300"></i>Doelpuntrijkste gelijke spelen</span>${ms.filter(m => m.h === m.a && m.h > 0).sort((a, b) => b.h - a.h).slice(0, 5).map(m => mline(m)).join("") || `<div class="text-xs text-slate-500 italic">Nog geen gelijke spelen met goals.</div>`}</div>
</div>`;
        }

        /* ---- onderling (head-to-head) ---- */
        else if (S.tab === "h2h") {
            const all = [...D.teams].filter(r => r.p).sort((a, b) => a.name.localeCompare(b.name)).map(r => [r.key, r.name]);
            h += `<div class="card grid grid-cols-2 gap-2"><div><span class="lbl">Ploeg A</span>${sel("a", S.a, [["", "— kies —"], ...all])}</div><div><span class="lbl">Ploeg B</span>${sel("b", S.b, [["", "— kies —"], ...all])}</div></div>`;
            if (!S.a || !S.b || S.a === S.b) h += `<div class="card text-center text-slate-500 italic py-8">Kies twee verschillende ploegen om hun onderlinge duels te zien.</div>`;
            else {
                const ms = D.M.filter(m => (m.hk === S.a && m.ak === S.b) || (m.hk === S.b && m.ak === S.a));
                if (!ms.length) h += `<div class="card text-center text-slate-500 italic py-8">${esc(nameOf(S.a))} en ${esc(nameOf(S.b))} hebben nog nooit tegen elkaar gespeeld.</div>`;
                else {
                    let wa = 0, wb = 0, dr = 0, ga = 0, gb = 0;
                    for (const m of ms) { const fa = m.hk === S.a ? m.h : m.a, fb = m.hk === S.a ? m.a : m.h; ga += fa; gb += fb; if (fa > fb) wa++; else if (fa < fb) wb++; else dr++; }
                    const n = ms.length;
                    h += `<div class="card"><div class="flex items-center justify-between gap-2 text-sm font-bold text-white"><span class="min-w-0">${tlabel(S.a)}</span><span class="text-slate-500 text-xs">vs</span><span class="min-w-0 flex justify-end">${tlabel(S.b)}</span></div>
<div class="flex h-3 rounded overflow-hidden mt-2 bg-slate-800"><span style="width:${100 * wa / n}%" class="bg-emerald-500"></span><span style="width:${100 * dr / n}%" class="bg-slate-400"></span><span style="width:${100 * wb / n}%" class="bg-sky-500"></span></div>
<div class="flex justify-between text-xs mt-1 text-slate-300"><span><b class="text-emerald-300">${wa}</b> winst</span><span><b>${dr}</b> gelijk</span><span><b class="text-sky-300">${wb}</b> winst</span></div></div>
<div class="grid grid-cols-3 gap-2">${card("Duels", n)}${card("Doelpunten", ga + " - " + gb)}${card("Gem. per duel", f1((ga + gb) / n))}</div>
<div class="card"><span class="lbl">Alle onderlinge wedstrijden (nieuwste eerst)</span>${[...ms].reverse().map(m => mline(m, esc(m.t) + " • " + esc(m.ph))).join("")}</div>`;
                }
            }
        }

        /* ---- toernooien ---- */
        else if (S.tab === "tours") {
            h += `<div class="card !p-2"><div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-slate-400 uppercase text-[10px]"><th class="l">Toernooi</th><th>Teams</th><th>Wedstr.</th><th>Goals</th><th>Gem.</th><th class="l">Winnaar</th><th class="l">Tweede</th></tr></thead><tbody>${D.tours.map(t => `<tr class="border-t border-slate-800/70"><td class="l text-slate-100 font-semibold">${esc(t.name)}${t.done ? "" : ` <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-black">BEZIG</span>`}</td><td>${t.n}</td><td>${t.matches}</td><td>${t.goals}</td><td>${t.matches ? f1(t.goals / t.matches) : "–"}</td><td class="l">${t.champ ? "🏆 " + tlink(t.champ) : "–"}</td><td class="l">${t.second ? tlink(t.second) : "–"}</td></tr>`).join("")}</tbody></table></div></div>`;
            const withM = D.tours.filter(t => t.matches >= 1);
            if (withM.length > 1) {
                const top = [...withM].sort((a, b) => b.goals / b.matches - a.goals / a.matches)[0], low = [...withM].sort((a, b) => a.goals / a.matches - b.goals / b.matches)[0];
                h += `<div class="grid grid-cols-2 gap-2">${card("Doelpuntrijkste toernooi", esc(top.name), f1(top.goals / top.matches) + " per wedstrijd")}${card("Zuinigste toernooi", esc(low.name), f1(low.goals / low.matches) + " per wedstrijd")}</div>`;
            }
        }
        return h;
    }
    return { build, html, TABS };
})();