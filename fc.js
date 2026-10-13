/* =====================================================================
 * fc.js — registro diário da frequência cardíaca de repouso (FC basal)
 * e relatório por período, com comparação entre anos.
 * Os dados ficam só no navegador (localStorage), com backup em arquivo.
 * A parte de cálculo (sem DOM) pode ser testada no Node.
 * ===================================================================== */
(function (global) {
    'use strict';

    const CHAVE = 'af-fc-basal';
    const BPM_MIN = 30, BPM_MAX = 130;
    const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const PERIODOS = [
        { meses: 1, rotulo: '1 mês' }, { meses: 3, rotulo: '3 meses' }, { meses: 6, rotulo: '6 meses' },
        { meses: 9, rotulo: '9 meses' }, { meses: 12, rotulo: '1 ano' },
    ];
    const MAX_ANOS = 7; // anos anteriores comparáveis (uma cor fixa por ano)

    // ---------------- datas (sempre no fuso local, formato AAAA-MM-DD) ----------------
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const deIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const hoje = () => iso(new Date());
    const addDias = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
    function addMeses(s, n) {
        const d = deIso(s);
        const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
        const ultimo = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
        x.setDate(Math.min(d.getDate(), ultimo));
        return iso(x);
    }
    const addAnos = (s, n) => addMeses(s, 12 * n);
    function diff(a, b) {
        const [y1, m1, d1] = a.split('-').map(Number);
        const [y2, m2, d2] = b.split('-').map(Number);
        return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
    }
    const fmtData = (s, comAno = true) => { const d = deIso(s); return `${d.getDate()} ${MESES[d.getMonth()]}${comAno ? ' ' + d.getFullYear() : ''}`; };
    const fmtDataLonga = (s) => { const d = deIso(s); return `${DIAS_SEM[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
    const num = (n, c = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
    const sinal = (n, c = 0) => (n > 0 ? '+' : n < 0 ? '−' : '') + num(Math.abs(n), c);

    // ---------------- armazenamento ----------------
    function carregar() {
        try {
            const o = JSON.parse(localStorage.getItem(CHAVE) || 'null');
            if (o && o.registros && typeof o.registros === 'object') return o.registros;
        } catch (e) { /* sem armazenamento */ }
        return {};
    }
    function gravar(reg) {
        try { localStorage.setItem(CHAVE, JSON.stringify({ v: 1, registros: reg })); return true; } catch (e) { return false; }
    }
    const valido = (data, bpm) => /^\d{4}-\d{2}-\d{2}$/.test(data) && !isNaN(deIso(data)) && Number.isFinite(bpm) && bpm >= BPM_MIN && bpm <= BPM_MAX;

    // ---------------- classificação ----------------
    function classificarFC(bpm) {
        if (bpm < 40) return { id: 'muito-baixa', rotulo: 'Muito baixa', icone: '⚠️', status: 'aviso', texto: 'Bem abaixo do comum. Em atletas pode ser normal; fora disso, vale conversar com um médico.' };
        if (bpm < 60) return { id: 'baixa', rotulo: 'Baixa — boa forma', icone: '💪', status: 'bom', texto: 'Abaixo de 60 bpm é comum em pessoas bem condicionadas.' };
        if (bpm <= 80) return { id: 'normal', rotulo: 'Normal', icone: '✅', status: 'bom', texto: 'Dentro da faixa normal para adultos (60 a 100 bpm).' };
        if (bpm <= 100) return { id: 'normal-alta', rotulo: 'Normal, mas alta', icone: '🟡', status: 'aviso', texto: 'Ainda é normal, mas atividade física regular costuma baixar esse valor.' };
        return { id: 'alta', rotulo: 'Acima do normal', icone: '🔴', status: 'critico', texto: 'Acima de 100 bpm em repouso não é o esperado. Se repetir, procure um médico.' };
    }

    // ---------------- estatística ----------------
    const media = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const janela = (fim, meses) => ({ ini: addDias(addMeses(fim, -meses), 1), fim });
    const pontos = (reg, ini, fim) => Object.keys(reg).filter((d) => d >= ini && d <= fim).sort()
        .map((d) => ({ data: d, bpm: reg[d], x: diff(ini, d) }));

    function estatisticas(pts, ini, fim) {
        const dias = diff(ini, fim) + 1;
        if (!pts.length) return { n: 0, dias, adesao: 0 };
        const v = pts.map((p) => p.bpm);
        const m = media(v);
        const dp = v.length > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1)) : 0;
        let min = pts[0], max = pts[0];
        for (const p of pts) { if (p.bpm < min.bpm) min = p; if (p.bpm > max.bpm) max = p; }
        // Tendência: média dos últimos registros menos a dos primeiros.
        let tendencia = null;
        if (pts.length >= 10) {
            const k = Math.min(7, Math.floor(pts.length / 3));
            tendencia = media(v.slice(-k)) - media(v.slice(0, k));
        }
        return { n: pts.length, dias, adesao: pts.length / dias, media: m, dp, min, max, tendencia };
    }

    /** Média móvel dos últimos `dias` dias corridos (não dos últimos N registros). */
    function mediaMovel(pts, dias = 7, minPts = 3) {
        return pts.map((p, i) => {
            const vals = [];
            for (let j = i; j >= 0 && p.x - pts[j].x < dias; j--) vals.push(pts[j].bpm);
            return { data: p.data, x: p.x, bpm: vals.length >= minPts ? media(vals) : null };
        });
    }
    /** Escolhe a suavização conforme a frequência dos registros. */
    function suavizar(pts, est) {
        if (est.adesao >= 0.5) return { linha: mediaMovel(pts, 7, 3), rotulo: 'média de 7 dias' };
        return { linha: mediaMovel(pts, 14, 1), rotulo: 'média de 14 dias' };
    }

    const rotuloJanela = (a, b) => (a.slice(0, 4) === b.slice(0, 4) ? a.slice(0, 4) : `${a.slice(0, 4)}/${b.slice(2, 4)}`);

    function anosAnteriores(reg, ini, fim) {
        const out = [];
        for (let k = 1; k <= MAX_ANOS; k++) {
            const a = addAnos(ini, -k), b = addAnos(fim, -k);
            const p = pontos(reg, a, b);
            if (p.length >= 3) out.push({ k, ini: a, fim: b, rotulo: rotuloJanela(a, b), pts: p, est: estatisticas(p, a, b) });
        }
        return out;
    }

    function sequencia(reg, ate = hoje()) {
        let d = reg[ate] !== undefined ? ate : addDias(ate, -1);
        let n = 0;
        while (reg[d] !== undefined) { n++; d = addDias(d, -1); }
        return n;
    }

    // ---------------- dados de exemplo (não são salvos) ----------------
    function dadosExemplo() {
        let s = 20261013;
        const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        const reg = {};
        const fim = hoje(), ini = addAnos(fim, -3), total = diff(ini, fim);
        for (let i = 0; i <= total; i++) {
            if (r() < 0.15) continue;
            const d = addDias(ini, i);
            const base = 70 - 9 * (i / total);
            const sazonal = 1.5 * Math.cos((2 * Math.PI * deIso(d).getMonth()) / 12);
            const ruido = (r() + r() + r() - 1.5) * 3;
            reg[d] = Math.round(base + sazonal + ruido);
        }
        return reg;
    }

    // ---------------- importar / exportar ----------------
    const paraCSV = (reg, ini = '0000', fim = '9999') => 'data;fc_repouso_bpm\n' +
        Object.keys(reg).filter((d) => d >= ini && d <= fim).sort().map((d) => `${d};${reg[d]}`).join('\n') + '\n';

    function lerArquivo(texto) {
        texto = String(texto).replace(/^﻿/, '').trim();
        const out = {};
        let ignorados = 0;
        const add = (d, v) => { const b = Number(String(v).replace(',', '.')); if (valido(d, b)) out[d] = Math.round(b); else ignorados++; };
        if (texto.startsWith('{')) {
            try {
                const o = JSON.parse(texto);
                for (const [d, v] of Object.entries(o.registros || o)) add(d, v);
            } catch (e) { return { erro: 'Não consegui ler esse arquivo JSON.' }; }
            return { registros: out, ignorados };
        }
        for (const linha of texto.split(/\r?\n/)) {
            if (!/^\s*"?\d/.test(linha)) continue; // cabeçalho ou linha vazia
            const cols = linha.split(/[;\t]|,(?=\s*"?\d)/).map((c) => c.trim().replace(/^"|"$/g, ''));
            let d = cols[0] || '';
            const br = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (br) d = `${br[3]}-${pad(br[2])}-${pad(br[1])}`;
            add(d.slice(0, 10), cols[1]);
        }
        return { registros: out, ignorados };
    }

    function baixar(nome, conteudo, tipo) {
        const blob = new Blob([conteudo], { type: tipo });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nome;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // =====================================================================
    // GRÁFICO (SVG, sem bibliotecas)
    // =====================================================================
    function ticksY(min, max) {
        const passo = max - min > 40 ? 10 : 5;
        const a = Math.floor(min / passo) * passo, b = Math.ceil(max / passo) * passo;
        const t = [];
        for (let y = a; y <= b; y += passo) t.push(y);
        return { yMin: a, yMax: b, ticks: t };
    }

    function ticksX(ini, fim) {
        const dias = diff(ini, fim);
        const t = [];
        if (dias <= 35) {
            for (let x = 0; x <= dias; x += 7) { const d = deIso(addDias(ini, x)); t.push({ x, rot: `${d.getDate()}/${pad(d.getMonth() + 1)}` }); }
        } else {
            for (let x = 0; x <= dias; x++) {
                const d = deIso(addDias(ini, x));
                if (d.getDate() === 1) t.push({ x, rot: MESES[d.getMonth()] });
            }
        }
        return t;
    }

    /**
     * cfg: { alt, xMax, yMin, yMax, yTicks, xTicks, margemDir,
     *        series: [{ classe, pontos?:[{x,y}], linha?:[{x,y|null}], rotuloFim? }],
     *        refs?: [{ y, rot }], dica(x) => { x, html, marcas:[{y, classe}] } | null }
     */
    function grafico(cont, cfg) {
        let larguraAnterior = 0;
        function desenhar() {
            const W = Math.max(280, Math.round(cont.clientWidth)), H = 260;
            larguraAnterior = W;
            const m = { t: 14, r: cfg.margemDir || 14, b: 28, l: 34 };
            const iw = W - m.l - m.r, ih = H - m.t - m.b;
            const sx = (x) => m.l + (cfg.xMax ? x / cfg.xMax : 0.5) * iw;
            const sy = (y) => m.t + (1 - (y - cfg.yMin) / (cfg.yMax - cfg.yMin)) * ih;
            const f = (n) => n.toFixed(1);
            let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${cfg.alt}">`;
            for (const y of cfg.yTicks) {
                s += `<line class="g-grade" x1="${m.l}" x2="${W - m.r}" y1="${f(sy(y))}" y2="${f(sy(y))}"/>`;
                s += `<text class="g-eixo" x="${m.l - 6}" y="${f(sy(y))}" dy="0.32em" text-anchor="end">${y}</text>`;
            }
            s += `<line class="g-base" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/>`;
            // rótulos do eixo X sem encavalar
            let ultimoX = -Infinity;
            for (const t of cfg.xTicks) {
                const px = sx(t.x);
                if (px - ultimoX < 30 || px > W - m.r + 2) continue;
                s += `<text class="g-eixo" x="${f(px)}" y="${H - 8}" text-anchor="middle">${t.rot}</text>`;
                ultimoX = px;
            }
            for (const r of cfg.refs || []) {
                s += `<line class="g-ref" x1="${m.l}" x2="${W - m.r}" y1="${f(sy(r.y))}" y2="${f(sy(r.y))}"/>`;
                s += `<text class="g-ref-txt" x="${m.l + 4}" y="${f(sy(r.y) - 5)}">${r.rot}</text>`;
            }
            for (const se of cfg.series) {
                if (se.pontos) for (const p of se.pontos) s += `<circle class="g-ponto ${se.classe}" cx="${f(sx(p.x))}" cy="${f(sy(p.y))}" r="3.5"/>`;
            }
            for (const se of cfg.series) {
                if (!se.linha) continue;
                let d = '', aberto = false;
                for (const p of se.linha) {
                    if (p.y === null) { aberto = false; continue; }
                    d += `${aberto ? 'L' : 'M'}${f(sx(p.x))} ${f(sy(p.y))}`;
                    aberto = true;
                }
                if (d) s += `<path class="g-linha ${se.classe}" d="${d}"/>`;
            }
            // rótulos diretos no fim de cada linha, afastados para não sobrepor
            const fins = cfg.series.filter((se) => se.rotuloFim && se.linha).map((se) => {
                const ult = [...se.linha].reverse().find((p) => p.y !== null);
                return ult ? { se, x: sx(ult.x), y: sy(ult.y) } : null;
            }).filter(Boolean).sort((a, b) => a.y - b.y);
            for (let i = 1; i < fins.length; i++) if (fins[i].y - fins[i - 1].y < 14) fins[i].y = fins[i - 1].y + 14;
            for (const r of fins) {
                s += `<circle class="g-marca-fim ${r.se.classe}" cx="${f(r.x)}" cy="${f(r.y)}" r="4"/>`;
                s += `<text class="g-rotulo" x="${f(r.x + 8)}" y="${f(r.y)}" dy="0.32em">${r.se.rotuloFim}</text>`;
            }
            s += `<line class="g-mira" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/><g class="g-marcas"></g>`;
            s += `<rect class="g-captura" x="${m.l}" y="0" width="${iw}" height="${H}" fill="transparent"/></svg>`;
            cont.innerHTML = s + '<div class="g-dica" hidden></div>';

            const svg = cont.querySelector('svg'), dica = cont.querySelector('.g-dica');
            const mira = svg.querySelector('.g-mira'), marcas = svg.querySelector('.g-marcas');
            const esconder = () => { dica.hidden = true; mira.setAttribute('visibility', 'hidden'); marcas.innerHTML = ''; };
            const mover = (e) => {
                const bb = svg.getBoundingClientRect();
                const px = (e.clientX - bb.left) * (W / bb.width);
                const x = Math.max(0, Math.min(cfg.xMax, Math.round(((px - m.l) / iw) * cfg.xMax)));
                const info = cfg.dica(x);
                if (!info) { esconder(); return; }
                const cx = sx(info.x);
                mira.setAttribute('x1', cx); mira.setAttribute('x2', cx); mira.setAttribute('visibility', 'visible');
                marcas.innerHTML = info.marcas.map((mk) => `<circle class="g-marca ${mk.classe}" cx="${f(cx)}" cy="${f(sy(mk.y))}" r="5"/>`).join('');
                dica.innerHTML = info.html;
                dica.hidden = false;
                const left = (cx / W) * bb.width;
                const direita = left > bb.width / 2;
                dica.style.left = direita ? '' : `${left + 12}px`;
                dica.style.right = direita ? `${bb.width - left + 12}px` : '';
            };
            const alvo = svg.querySelector('.g-captura');
            alvo.addEventListener('pointermove', mover);
            alvo.addEventListener('pointerdown', mover);
            alvo.addEventListener('pointerleave', esconder);
        }
        desenhar();
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => {
                if (!cont.isConnected) { ro.disconnect(); return; }
                if (Math.abs(cont.clientWidth - larguraAnterior) > 4) desenhar();
            });
            ro.observe(cont);
        }
    }

    // =====================================================================
    // TELA: REGISTRO DIÁRIO
    // =====================================================================
    const estadoRegistro = { data: null };

    function rotuloDia(d) {
        const h = hoje();
        if (d === h) return 'Hoje';
        if (d === addDias(h, -1)) return 'Ontem';
        return DIAS_SEM[deIso(d).getDay()].replace(/^./, (c) => c.toUpperCase());
    }

    function renderRegistro(main, ctx) {
        const simples = ctx.modo === 'simples';
        const reg = carregar();
        const h = hoje();
        if (!estadoRegistro.data || estadoRegistro.data > h) estadoRegistro.data = h;
        const datas = Object.keys(reg).sort();
        const ultimoValor = datas.length ? reg[datas[datas.length - 1]] : 65;
        let valor = reg[estadoRegistro.data] ?? ultimoValor;
        const data = estadoRegistro.data;
        const existe = reg[data] !== undefined;

        // resumo pessoal
        const p30 = pontos(reg, addDias(h, -29), h);
        const p7 = pontos(reg, addDias(h, -6), h);
        const media30 = p30.length >= 3 ? media(p30.map((p) => p.bpm)) : null;
        const seq = sequencia(reg);

        // faixa dos últimos 14 dias
        let faixa = '';
        for (let i = 13; i >= 0; i--) {
            const d = addDias(h, -i), dt = deIso(d), v = reg[d];
            faixa += `<button type="button" class="dia ${d === data ? 'sel' : ''} ${v !== undefined ? 'tem' : ''}" data-data="${d}" aria-label="${fmtDataLonga(d)}: ${v !== undefined ? v + ' bpm' : 'sem registro'}" aria-pressed="${d === data}">
                <span class="dia-sem">${DIAS_SEM[dt.getDay()].slice(0, 3)}</span><span class="dia-num">${dt.getDate()}</span><span class="dia-val">${v !== undefined ? v : '·'}</span></button>`;
        }

        main.innerHTML = `
            <a href="#/" class="btn-voltar">‹ Voltar ao menu</a>
            <h1 class="titulo-teste"><span aria-hidden="true">❤️</span> ${simples ? 'Batimentos em repouso' : 'Frequência cardíaca de repouso'}</h1>
            <p class="subtitulo">${simples ? 'Anote todo dia o valor que o seu relógio mostra' : 'Registro diário da FC basal (FCrep)'}</p>

            <section class="card registro" aria-labelledby="reg-titulo">
                <h2 id="reg-titulo" class="sr-only">Novo registro</h2>
                <div class="data-nav">
                    <button type="button" class="data-btn" data-dia="-1" aria-label="Dia anterior">‹</button>
                    <div class="data-atual" aria-live="polite">
                        <span class="data-rel">${rotuloDia(data)}</span>
                        <span class="data-txt">${fmtDataLonga(data)}</span>
                    </div>
                    <button type="button" class="data-btn" data-dia="1" aria-label="Próximo dia" ${data >= h ? 'disabled' : ''}>›</button>
                </div>

                <div class="bpm-controle">
                    <button type="button" class="bpm-btn" data-passo="-1" aria-label="Diminuir 1 batimento">−</button>
                    <div class="bpm-valor"><output id="bpm-num" for="bpm-range" aria-live="polite">${valor}</output><small>bpm</small></div>
                    <button type="button" class="bpm-btn" data-passo="1" aria-label="Aumentar 1 batimento">+</button>
                </div>
                <input type="range" id="bpm-range" min="${BPM_MIN}" max="${BPM_MAX}" step="1" value="${valor}" aria-label="Arraste para escolher os batimentos por minuto">
                <div class="bpm-escala" aria-hidden="true"><span>${BPM_MIN}</span><span>60</span><span>100</span><span>${BPM_MAX}</span></div>
                <p class="bpm-faixa" id="bpm-faixa"></p>

                <button type="button" class="btn-calc" id="btn-registrar"></button>
                ${existe ? '<button type="button" class="btn-link" id="btn-apagar">Apagar o registro deste dia</button>' : ''}
                <p class="registro-msg" id="registro-msg" aria-live="polite"></p>
                <p class="dica-uso">${simples ? 'Toque em − e + (segure para ir mais rápido) ou arraste a barra.' : 'Use −/+ (segure para acelerar), arraste a barra ou as setas do teclado.'}</p>
            </section>

            <section class="card" aria-labelledby="ult-titulo">
                <div class="card-topo">
                    <h2 id="ult-titulo">Últimos 14 dias</h2>
                    <a href="#/relatorio" class="btn-sec btn-peq">📊 Ver relatório</a>
                </div>
                <p class="mini">Toque num dia para ver ou corrigir o valor.</p>
                <div class="faixa-dias">${faixa}</div>
                <div class="resumo-mini">
                    <div><span class="rm-valor">${p7.length ? num(media(p7.map((p) => p.bpm))) : '—'}</span><span class="rm-rot">média dos últimos 7 dias</span></div>
                    <div><span class="rm-valor">${media30 !== null ? num(media30) : '—'}</span><span class="rm-rot">média dos últimos 30 dias</span></div>
                    <div><span class="rm-valor">${seq}</span><span class="rm-rot">${seq === 1 ? 'dia seguido' : 'dias seguidos'} registrando</span></div>
                    <div><span class="rm-valor">${datas.length}</span><span class="rm-rot">registros no total</span></div>
                </div>
            </section>

            <details class="card como-medir">
                <summary>⌚ Como medir certo</summary>
                <ul>
                    <li><strong>Melhor momento:</strong> logo ao acordar, ainda deitado(a), antes de levantar e de tomar café.</li>
                    <li><strong>No smartwatch:</strong> procure “FC em repouso” ou “frequência cardíaca de repouso” no app do relógio (Saúde do iPhone, Google Fit / Fitbit, Samsung Health, Garmin Connect, Mi Fitness…). Anote o valor do dia.</li>
                    <li><strong>Sem relógio:</strong> conte as batidas no pulso por 30 segundos e multiplique por 2.</li>
                    <li><strong>Por que acompanhar?</strong> Com o treino, a FC de repouso tende a <em>baixar</em> ao longo das semanas. Se ficar uns 5 bpm ou mais acima da sua média por alguns dias, pode ser sono ruim, estresse, treino pesado ou o começo de uma gripe — vale descansar.</li>
                </ul>
            </details>

            <section class="card" aria-labelledby="bkp-titulo">
                <h2 id="bkp-titulo">💾 Seus dados</h2>
                <p class="mini">Os registros ficam guardados <strong>só neste aparelho e navegador</strong>. Faça uma cópia de vez em quando — ela também serve para levar os dados para outro celular ou computador.</p>
                <div class="acoes">
                    <button type="button" class="btn-sec" id="btn-exp-json">⬇️ Baixar cópia (.json)</button>
                    <button type="button" class="btn-sec" id="btn-exp-csv">📄 Baixar planilha (.csv)</button>
                    <label class="btn-sec btn-arquivo">⬆️ Restaurar / importar<input type="file" id="arq-importar" accept=".json,.csv,.txt,application/json,text/csv" hidden></label>
                </div>
                <p class="registro-msg" id="bkp-msg" aria-live="polite"></p>
            </section>`;

        const elNum = main.querySelector('#bpm-num');
        const elRange = main.querySelector('#bpm-range');
        const elFaixa = main.querySelector('#bpm-faixa');
        const elBtn = main.querySelector('#btn-registrar');
        const elMsg = main.querySelector('#registro-msg');

        function atualizarValor(v) {
            valor = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(v)));
            elNum.textContent = valor;
            elRange.value = valor;
            elRange.style.setProperty('--pct', `${((valor - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100}%`);
            const c = classificarFC(valor);
            let extra = '';
            if (media30 !== null && Math.abs(valor - media30) >= 5) {
                extra = valor > media30
                    ? ` · ${num(valor - media30)} bpm acima da sua média de 30 dias`
                    : ` · ${num(media30 - valor)} bpm abaixo da sua média de 30 dias`;
            }
            elFaixa.className = `bpm-faixa st-${c.status}`;
            elFaixa.innerHTML = `<span aria-hidden="true">${c.icone}</span> <strong>${c.rotulo}</strong>${extra}`;
            elFaixa.title = c.texto;
            const quando = data === h ? 'hoje' : data === addDias(h, -1) ? 'ontem' : fmtData(data, false);
            elBtn.textContent = `${existe && reg[data] !== valor ? 'Atualizar para' : existe ? 'Salvo:' : 'Salvar'} ${valor} bpm ${existe && reg[data] === valor ? '' : 'para ' + quando}`.trim();
            elBtn.disabled = existe && reg[data] === valor;
        }
        atualizarValor(valor);

        // − / + com toque, clique e "segurar para acelerar"
        main.querySelectorAll('.bpm-btn').forEach((b) => {
            const passo = Number(b.dataset.passo);
            let espera = null, repete = null;
            const parar = () => { clearTimeout(espera); clearInterval(repete); espera = repete = null; };
            b.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                b.setPointerCapture?.(e.pointerId);
                atualizarValor(valor + passo);
                espera = setTimeout(() => { repete = setInterval(() => atualizarValor(valor + passo), 90); }, 400);
            });
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => b.addEventListener(ev, parar));
            b.addEventListener('click', (e) => { if (e.detail === 0) atualizarValor(valor + passo); }); // teclado
            b.addEventListener('contextmenu', (e) => e.preventDefault());
        });
        elRange.addEventListener('input', () => atualizarValor(Number(elRange.value)));

        // navegar entre dias
        main.querySelectorAll('.data-btn').forEach((b) => b.addEventListener('click', () => {
            const nova = addDias(data, Number(b.dataset.dia));
            if (nova > h) return;
            estadoRegistro.data = nova;
            renderRegistro(main, ctx);
            main.querySelector(`.data-btn[data-dia="${b.dataset.dia}"]`)?.focus();
        }));
        main.querySelectorAll('.faixa-dias .dia').forEach((b) => b.addEventListener('click', () => {
            estadoRegistro.data = b.dataset.data;
            renderRegistro(main, ctx);
            main.querySelector('.registro').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));

        elBtn.addEventListener('click', () => {
            const r = carregar();
            r[data] = valor;
            if (!gravar(r)) { elMsg.textContent = '⚠️ Este navegador não deixou salvar (modo anônimo?). Tente em uma janela normal.'; return; }
            renderRegistro(main, ctx);
            const msg = main.querySelector('#registro-msg');
            msg.textContent = `✅ Salvo: ${valor} bpm em ${fmtData(data)}.`;
            ctx.aoSalvar?.();
        });
        main.querySelector('#btn-apagar')?.addEventListener('click', () => {
            if (!confirm(`Apagar o registro de ${fmtData(data)} (${reg[data]} bpm)?`)) return;
            const r = carregar();
            delete r[data];
            gravar(r);
            renderRegistro(main, ctx);
            main.querySelector('#registro-msg').textContent = `🗑️ Registro de ${fmtData(data)} apagado.`;
        });

        // backup
        const bkpMsg = main.querySelector('#bkp-msg');
        main.querySelector('#btn-exp-json').addEventListener('click', () => {
            baixar(`fc-repouso_${h}.json`, JSON.stringify({ v: 1, app: 'aptidao-fisica', registros: carregar() }, null, 1), 'application/json');
        });
        main.querySelector('#btn-exp-csv').addEventListener('click', () => baixar(`fc-repouso_${h}.csv`, '﻿' + paraCSV(carregar()), 'text/csv;charset=utf-8'));
        main.querySelector('#arq-importar').addEventListener('change', async (e) => {
            const arq = e.target.files[0];
            if (!arq) return;
            const res = lerArquivo(await arq.text());
            if (res.erro) { bkpMsg.textContent = `⚠️ ${res.erro}`; return; }
            const n = Object.keys(res.registros).length;
            if (!n) { bkpMsg.textContent = '⚠️ Não encontrei registros válidos. O arquivo precisa ter data e bpm em cada linha (ex.: 2026-10-13;62).'; return; }
            const atual = carregar();
            const conflitos = Object.keys(res.registros).filter((d) => atual[d] !== undefined && atual[d] !== res.registros[d]).length;
            if (conflitos && !confirm(`${n} registros encontrados. ${conflitos} dias já têm um valor diferente aqui. Substituir pelos do arquivo?`)) return;
            gravar(Object.assign(atual, res.registros));
            renderRegistro(main, ctx);
            main.querySelector('#bkp-msg').textContent = `✅ ${n} registros importados${res.ignorados ? ` (${res.ignorados} linhas ignoradas)` : ''}.`;
        });
    }

    // =====================================================================
    // TELA: RELATÓRIO
    // =====================================================================
    const estadoRel = { meses: 3, demo: false, anosSel: null };

    function linhaTabela(rot, est, ref) {
        if (!est.n) return `<tr><th scope="row">${rot}</th><td colspan="5">sem registros</td></tr>`;
        let comp = '—';
        if (ref && ref.n) {
            const d = ref.media - est.media; // atual − ano anterior
            comp = Math.abs(d) < 0.5 ? 'igual' : d < 0 ? `<span class="delta-bom">↓ ${num(-d, 1)} bpm</span>` : `<span class="delta-ruim">↑ ${num(d, 1)} bpm</span>`;
        }
        return `<tr><th scope="row">${rot}</th><td>${num(est.media, 1)}</td><td>${est.min.bpm}</td><td>${est.max.bpm}</td><td>${est.n}</td><td>${comp}</td></tr>`;
    }

    function textoResumo(est, comps, meses, rotPeriodo, simples) {
        const partes = [];
        const c = classificarFC(est.media);
        partes.push(`<strong>${rotPeriodo.replace(/^n/, 'N')}</strong> você anotou <strong>${est.n} de ${est.dias} dias</strong> (${num(est.adesao * 100)}%). Sua frequência de repouso média foi <strong>${num(est.media)} bpm</strong> — ${c.rotulo.toLowerCase()}.`);
        if (est.tendencia !== null) {
            const t = est.tendencia;
            if (Math.abs(t) < 1) partes.push('Ela ficou <strong>estável</strong> do começo ao fim do período.');
            else if (t < 0) partes.push(`Ela <strong>caiu ${num(-t)} bpm</strong> do começo para o fim do período — normalmente é sinal de que o condicionamento está melhorando. 👏`);
            else partes.push(`Ela <strong>subiu ${num(t)} bpm</strong> do começo para o fim do período. Pode ser menos treino, sono ruim, estresse ou cansaço acumulado.`);
        }
        const ant = comps.find((x) => x.k === 1);
        if (ant) {
            const d = est.media - ant.est.media;
            if (Math.abs(d) < 0.5) partes.push(`Comparado ao mesmo período de ${ant.rotulo}, está praticamente <strong>igual</strong>.`);
            else partes.push(`Comparado ao mesmo período de ${ant.rotulo}, está <strong>${num(Math.abs(d), 1)} bpm ${d < 0 ? 'menor' : 'maior'}</strong>${d < 0 ? ' — melhorou' : ''}.`);
        }
        if (!simples) partes.push(`Desvio-padrão: ${num(est.dp, 1)} bpm (CV ${num((est.dp / est.media) * 100, 1)}%).`);
        return partes.map((p) => `<p>${p}</p>`).join('');
    }

    function renderRelatorio(main, ctx) {
        const simples = ctx.modo === 'simples';
        const real = carregar();
        const reg = estadoRel.demo ? dadosExemplo() : real;
        const fim = hoje();
        const { ini } = janela(fim, estadoRel.meses);
        const rotPeriodo = { 1: 'no último mês', 3: 'nos últimos 3 meses', 6: 'nos últimos 6 meses', 9: 'nos últimos 9 meses', 12: 'nos últimos 12 meses' }[estadoRel.meses];
        const pts = pontos(reg, ini, fim);
        const est = estatisticas(pts, ini, fim);
        const comps = anosAnteriores(reg, ini, fim);
        if (estadoRel.anosSel === null) estadoRel.anosSel = new Set(comps.length ? [comps[0].k] : []);

        const botoesPeriodo = PERIODOS.map((p) => `<button type="button" data-meses="${p.meses}" aria-pressed="${p.meses === estadoRel.meses}">${p.rotulo}</button>`).join('');
        let html = `
            <a href="#/" class="btn-voltar">‹ Voltar ao menu</a>
            <h1 class="titulo-teste"><span aria-hidden="true">📊</span> Relatório da FC de repouso</h1>
            <p class="subtitulo">${fmtData(ini)} a ${fmtData(fim)}</p>
            <div class="periodos" role="group" aria-label="Período do relatório">${botoesPeriodo}</div>`;

        if (estadoRel.demo) {
            html += `<p class="aviso aviso-demo">🧪 Você está vendo <strong>dados de exemplo</strong>, inventados para mostrar como o relatório funciona. <button type="button" class="btn-link" id="sair-demo">Voltar aos meus dados</button></p>`;
        }

        if (!est.n) {
            html += `<section class="card vazio">
                <p class="vazio-icone" aria-hidden="true">📭</p>
                <h2>${Object.keys(real).length ? 'Nenhum registro neste período' : 'Você ainda não tem registros'}</h2>
                <p>Anote sua frequência cardíaca de repouso todos os dias e volte aqui para ver a evolução.</p>
                <div class="acoes">
                    <a href="#/fc" class="btn-calc btn-a">❤️ Registrar agora</a>
                    ${estadoRel.demo ? '' : '<button type="button" class="btn-sec" id="ver-demo">🧪 Ver com dados de exemplo</button>'}
                </div></section>`;
            main.innerHTML = html;
            ligarRelatorio(main, ctx);
            return;
        }

        const c = classificarFC(est.media);
        const tendTxt = est.tendencia === null ? '—' : Math.abs(est.tendencia) < 1 ? 'estável' : `${est.tendencia < 0 ? '↓' : '↑'} ${num(Math.abs(est.tendencia))} bpm`;
        html += `
            <section class="card resumo-texto">${textoResumo(est, comps, estadoRel.meses, rotPeriodo, simples)}</section>
            <div class="tiles">
                <div class="tile"><span class="tile-rot">Média</span><span class="tile-val">${num(est.media)}<small> bpm</small></span><span class="tile-sub st-${c.status}"><span aria-hidden="true">${c.icone}</span> ${c.rotulo}</span></div>
                <div class="tile"><span class="tile-rot">Menor</span><span class="tile-val">${est.min.bpm}<small> bpm</small></span><span class="tile-sub">${fmtData(est.min.data)}</span></div>
                <div class="tile"><span class="tile-rot">Maior</span><span class="tile-val">${est.max.bpm}<small> bpm</small></span><span class="tile-sub">${fmtData(est.max.data)}</span></div>
                <div class="tile"><span class="tile-rot">Tendência</span><span class="tile-val tile-val-txt">${tendTxt}</span><span class="tile-sub">${est.tendencia === null ? 'precisa de 10+ registros' : 'do início ao fim'}</span></div>
                <div class="tile"><span class="tile-rot">Registros</span><span class="tile-val">${est.n}<small> / ${est.dias}</small></span><span class="tile-sub">${num(est.adesao * 100)}% dos dias</span></div>
            </div>

            <section class="card" aria-labelledby="g1-titulo">
                <h2 id="g1-titulo">Dia a dia</h2>
                <p class="mini legenda-simples"><span class="lg lg-ponto s1"></span> cada registro &nbsp; <span class="lg lg-linha s1"></span> <span id="rot-suave"></span> &nbsp; <span class="lg lg-ref"></span> média do período</p>
                <div class="grafico" id="g-diario"></div>
                <details class="tabela-dados"><summary>Ver os dados em tabela</summary><div class="tabela-rolagem"><table class="calculation-table">
                    <thead><tr><th scope="col">Data</th><th scope="col">bpm</th></tr></thead>
                    <tbody>${[...pts].reverse().map((p) => `<tr><td>${fmtDataLonga(p.data)}</td><td>${p.bpm}</td></tr>`).join('')}</tbody>
                </table></div></details>
            </section>`;

        // comparação entre anos
        html += `<section class="card" aria-labelledby="g2-titulo"><h2 id="g2-titulo">Comparar com anos anteriores</h2>`;
        if (!comps.length) {
            html += `<p class="mini">Ainda não há registros do mesmo período em anos anteriores. Quando você completar um ano de registros, a comparação aparece aqui automaticamente.</p>`;
        } else {
            html += `<p class="mini">Mesmo período (${fmtData(ini, false)} a ${fmtData(fim, false)}) em outros anos. Toque para incluir ou tirar do gráfico.</p>
                <div class="chips-anos" role="group" aria-label="Anos para comparar">
                    <span class="chip-ano fixo"><span class="lg lg-linha s1"></span> ${rotuloJanela(ini, fim)} (atual)</span>
                    ${comps.map((x) => `<button type="button" class="chip-ano" data-k="${x.k}" aria-pressed="${estadoRel.anosSel.has(x.k)}"><span class="lg lg-linha s${x.k + 1}"></span> ${x.rotulo} <small>(${x.est.n})</small></button>`).join('')}
                </div>
                <div class="grafico" id="g-anos"></div>
                <div class="tabela-rolagem"><table class="calculation-table tabela-anos">
                    <thead><tr><th scope="col">Período</th><th scope="col">Média</th><th scope="col">Menor</th><th scope="col">Maior</th><th scope="col">Dias</th><th scope="col">Atual vs.</th></tr></thead>
                    <tbody>${linhaTabela(`${rotuloJanela(ini, fim)} (atual)`, est, null)}${comps.map((x) => linhaTabela(x.rotulo, x.est, est)).join('')}</tbody>
                </table></div>
                <p class="mini">↓ significa que a sua FC de repouso <strong>atual</strong> está mais baixa que naquele ano — em geral, sinal de melhor condicionamento.</p>`;
        }
        html += `</section>`;

        html += `<div class="acoes nao-imprimir">
                <button type="button" class="btn-save" id="btn-imprimir">🖨️ Imprimir / salvar PDF</button>
                <button type="button" class="btn-sec" id="btn-csv-periodo">📄 Baixar dados do período (.csv)</button>
                ${estadoRel.demo ? '' : '<button type="button" class="btn-sec" id="ver-demo">🧪 Ver exemplo</button>'}
            </div>
            <p class="mini rodape-rel">Faixas de referência para adultos: normal entre 60 e 100 bpm; abaixo de 60 é comum em pessoas treinadas. Não substitui avaliação médica.</p>`;

        main.innerHTML = html;

        // gráfico diário
        const suave = suavizar(pts, est);
        main.querySelector('#rot-suave').textContent = suave.rotulo;
        const xMax = est.dias - 1;
        const valores = pts.map((p) => p.bpm);
        const yr = ticksY(Math.min(...valores) - 2, Math.max(...valores) + 2);
        const porX = new Map(pts.map((p, i) => [p.x, i]));
        grafico(main.querySelector('#g-diario'), {
            alt: `Gráfico da frequência cardíaca de repouso de ${fmtData(ini)} a ${fmtData(fim)}. Média ${num(est.media)} bpm, menor ${est.min.bpm}, maior ${est.max.bpm}.`,
            xMax, yMin: yr.yMin, yMax: yr.yMax, yTicks: yr.ticks, xTicks: ticksX(ini, fim),
            refs: [{ y: est.media, rot: `média ${num(est.media)}` }],
            series: [
                { classe: 's1', pontos: pts.map((p) => ({ x: p.x, y: p.bpm })) },
                { classe: 's1', linha: suave.linha.map((p) => ({ x: p.x, y: p.bpm })) },
            ],
            dica(x) {
                let i = porX.get(x);
                if (i === undefined) {
                    let melhor = -1, dist = Infinity;
                    pts.forEach((p, j) => { const dd = Math.abs(p.x - x); if (dd < dist) { dist = dd; melhor = j; } });
                    if (dist > Math.max(3, xMax / 40)) return null;
                    i = melhor;
                }
                const p = pts[i], sm = suave.linha[i].bpm;
                const marcas = [{ y: p.bpm, classe: 's1' }];
                return {
                    x: p.x, marcas,
                    html: `<strong>${fmtDataLonga(p.data)}</strong><br>${p.bpm} bpm${sm !== null ? `<br><span class="dica-sec">${suave.rotulo}: ${num(sm, 1)}</span>` : ''}`,
                };
            },
        });

        // gráfico de comparação
        if (comps.length) {
            const sel = comps.filter((x) => estadoRel.anosSel.has(x.k));
            const series = [{ k: 0, rotulo: rotuloJanela(ini, fim), pts, est }, ...sel].map((x) => {
                const s = suavizar(x.pts, x.est);
                return { k: x.k, rotulo: x.rotulo, linha: s.linha, rotSuave: s.rotulo, ini: x.ini || ini };
            });
            const todos = series.flatMap((s) => s.linha.map((p) => p.bpm)).filter((v) => v !== null);
            const yr2 = ticksY(Math.min(...todos) - 2, Math.max(...todos) + 2);
            grafico(main.querySelector('#g-anos'), {
                alt: `Comparação da média de FC de repouso entre ${series.map((s) => s.rotulo).join(', ')}.`,
                xMax, yMin: yr2.yMin, yMax: yr2.yMax, yTicks: yr2.ticks, xTicks: ticksX(ini, fim), margemDir: 62,
                series: series.map((s) => ({ classe: `s${s.k + 1}`, linha: s.linha.map((p) => ({ x: p.x, y: p.bpm })), rotuloFim: s.rotulo })),
                dica(x) {
                    const linhas = [], marcas = [];
                    for (const s of series) {
                        let melhor = null, dist = Infinity;
                        for (const p of s.linha) { if (p.bpm === null) continue; const dd = Math.abs(p.x - x); if (dd < dist) { dist = dd; melhor = p; } }
                        if (melhor && dist <= 7) {
                            linhas.push(`<span class="lg lg-linha s${s.k + 1}"></span> ${s.rotulo}: <strong>${num(melhor.bpm, 1)}</strong>`);
                            marcas.push({ y: melhor.bpm, classe: `s${s.k + 1}` });
                        }
                    }
                    if (!linhas.length) return null;
                    return { x, marcas: [], html: `<strong>${fmtData(addDias(ini, x), false)}</strong><br>${linhas.join('<br>')}<br><span class="dica-sec">média móvel, bpm</span>` };
                },
            });
        }
        ligarRelatorio(main, ctx, { ini, fim, reg });
    }

    function ligarRelatorio(main, ctx, dados) {
        main.querySelectorAll('.periodos button').forEach((b) => b.addEventListener('click', () => {
            estadoRel.meses = Number(b.dataset.meses);
            renderRelatorio(main, ctx);
            main.querySelector(`.periodos button[data-meses="${b.dataset.meses}"]`)?.focus();
        }));
        main.querySelectorAll('.chip-ano[data-k]').forEach((b) => b.addEventListener('click', () => {
            const k = Number(b.dataset.k);
            if (estadoRel.anosSel.has(k)) estadoRel.anosSel.delete(k); else estadoRel.anosSel.add(k);
            const y = window.scrollY;
            renderRelatorio(main, ctx);
            window.scrollTo(0, y);
            main.querySelector(`.chip-ano[data-k="${k}"]`)?.focus({ preventScroll: true });
        }));
        main.querySelectorAll('#ver-demo').forEach((b) => b.addEventListener('click', () => { estadoRel.demo = true; estadoRel.anosSel = null; renderRelatorio(main, ctx); }));
        main.querySelector('#sair-demo')?.addEventListener('click', () => { estadoRel.demo = false; estadoRel.anosSel = null; renderRelatorio(main, ctx); });
        main.querySelector('#btn-imprimir')?.addEventListener('click', () => window.print());
        main.querySelector('#btn-csv-periodo')?.addEventListener('click', () => {
            baixar(`fc-repouso_${dados.ini}_a_${dados.fim}.csv`, '﻿' + paraCSV(dados.reg, dados.ini, dados.fim), 'text/csv;charset=utf-8');
        });
    }

    const FC = {
        // cálculo (testável)
        hoje, addDias, addMeses, addAnos, diff, janela, pontos, estatisticas, mediaMovel, suavizar,
        anosAnteriores, sequencia, classificarFC, lerArquivo, paraCSV, dadosExemplo, rotuloJanela, ticksX, ticksY,
        // telas
        carregar, gravar, renderRegistro, renderRelatorio, estadoRel,
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = FC;
    else global.FC = FC;
})(typeof window !== 'undefined' ? window : globalThis);
