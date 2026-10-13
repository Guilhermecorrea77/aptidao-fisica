/* =====================================================================
 * script.js — interface: navegação, formulários, resultados e assistente.
 * Fórmulas e textos ficam em calculos.js; respostas do assistente em assistente.js.
 * ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const { testes, validar, explicarVO2, faixaMensagem, MENSAGENS_NIVEL, textoParaSalvar, num } = window.AF;
    const main = document.getElementById('main-content');
    const ctxAssistente = { ultimo: null };

    // ---------------- preferências (modo simples/técnico) ----------------
    const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
    const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    let modo = ler('af-modo') === 'tecnico' ? 'tecnico' : 'simples';

    function aplicarModo() {
        document.body.classList.toggle('modo-tecnico', modo === 'tecnico');
        document.body.classList.toggle('modo-simples', modo === 'simples');
        document.querySelectorAll('.modo button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
    }
    // ---------------- tema (sistema / claro / escuro) ----------------
    let tema = ler('af-tema');
    if (tema !== 'light' && tema !== 'dark') tema = 'system';
    function aplicarTema() {
        if (tema === 'system') document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', tema);
        document.querySelectorAll('.tema button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tema === tema)));
    }
    document.querySelectorAll('.tema button').forEach((b) => b.addEventListener('click', () => {
        tema = b.dataset.tema;
        guardar('af-tema', tema === 'system' ? '' : tema);
        aplicarTema();
        // Os gráficos usam variáveis CSS, então trocam de cor sozinhos.
    }));
    aplicarTema();

    document.querySelectorAll('.modo button').forEach((b) => b.addEventListener('click', () => {
        modo = b.dataset.modo;
        guardar('af-modo', modo);
        aplicarModo();
        rotear(false);
    }));
    aplicarModo();

    const nome = (t) => (modo === 'simples' ? t.nomeSimples : t.nomeTecnico);

    // ---------------- navegação (#/teste) ----------------
    function rotear(rolar = true) {
        const id = location.hash.replace(/^#\/?/, '');
        const teste = testes.find((t) => t.id === id);
        const rota = id === 'fc' || id === 'relatorio' ? id : '';
        document.querySelectorAll('.nav a').forEach((a) => {
            if (a.dataset.rota === rota) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        if (id === 'fc') { document.title = 'FC de repouso — Aptidão Física'; window.FC.renderRegistro(main, { modo }); }
        else if (id === 'relatorio') { document.title = 'Relatório — Aptidão Física'; window.FC.renderRelatorio(main, { modo }); }
        else if (teste) renderTeste(teste);
        else renderMenu();
        if (rolar) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    }
    window.addEventListener('hashchange', () => rotear(true));

    // ---------------- menu ----------------
    const GRUPOS = [
        { id: 'caminhada', titulo: 'Testes de caminhada', simples: 'Só caminhando', desc: 'Para quem está começando ou não pode correr.' },
        { id: 'corrida', titulo: 'Testes de corrida', simples: 'Correndo', desc: 'Para quem já consegue correr alguns minutos.' },
        { id: 'ferramenta', titulo: 'Ferramentas e conceitos', simples: 'Calculadoras úteis', desc: 'Velocidade, METs e calorias.' },
    ];
    const NIVEIS_GUIA = [
        { id: 'iniciante', texto: 'Só caminho / estou parado(a)' },
        { id: 'intermediario', texto: 'Consigo correr um pouco' },
        { id: 'avancado', texto: 'Corro com frequência' },
    ];

    function cardTeste(t) {
        return `<a href="#/${t.id}" class="menu-item ${t.grupo === 'ferramenta' ? 'definicao' : ''}" data-nivel="${t.nivelIndicado || ''}">
            <span class="menu-icone" aria-hidden="true">${t.icone}</span>
            <span class="menu-texto">
                <span class="menu-nome">${nome(t)}</span>
                ${modo === 'simples' ? `<span class="menu-tec">${t.nomeTecnico}</span>` : ''}
                <span class="menu-resumo">${t.resumo}</span>
                ${t.duracao !== '—' ? `<span class="chip">⏱ ${t.duracao}</span>` : ''}
            </span>
        </a>`;
    }

    function renderMenu() {
        document.title = 'Aptidão Física — Medidas e Avaliação';
        let html = '';
        html += modo === 'simples'
            ? `<section class="intro card"><h1>Como está o seu fôlego?</h1><p>Escolha um teste simples de caminhada ou corrida, faça no parque ou na pista e digite o resultado aqui. A gente calcula e <strong>explica o que ele significa</strong>, sem complicação.</p></section>`
            : `<section class="intro card"><h1>Medidas e Avaliação em Educação Física</h1><p>Coleção de testes de campo para estimativa do VO₂máx e classificação da aptidão cardiorrespiratória, com o passo a passo de cada cálculo e referências das equações.</p></section>`;

        html += `<section class="card guia" aria-labelledby="guia-titulo">
            <h2 id="guia-titulo">Não sabe qual escolher?</h2>
            <p>Como você está hoje?</p>
            <div class="guia-opcoes">${NIVEIS_GUIA.map((n) => `<button type="button" class="guia-btn" data-nivel="${n.id}" aria-pressed="false">${n.texto}</button>`).join('')}</div>
            <p class="guia-msg" aria-live="polite"></p>
        </section>`;

        html += `<details class="card seguranca"><summary>⚠️ Antes de fazer qualquer teste (leia)</summary>
            <ul>
                <li>Procure um médico antes se tem problema de coração ou pressão, diabetes, está grávida, sente dor no peito/tontura ao se esforçar, ou tem mais de 45 anos e está parado(a) há tempo.</li>
                <li><strong>Pare na hora</strong> se sentir dor ou aperto no peito, falta de ar fora do normal, tontura ou náusea.</li>
                <li>Aqueça 5–10 minutos antes, beba água e evite horários muito quentes.</li>
            </ul></details>`;

        const regFC = window.FC.carregar();
        const hojeFC = window.FC.hoje();
        const jaHoje = regFC[hojeFC];
        html += `<section class="grupo" aria-labelledby="g-acomp">
            <h2 id="g-acomp">${modo === 'simples' ? 'Acompanhe seu coração' : 'Acompanhamento'}</h2>
            <p class="grupo-desc">Anote todo dia a frequência cardíaca de repouso do seu relógio e veja a evolução.</p>
            <div class="menu-principal">
                <a href="#/fc" class="menu-item acomp">
                    <span class="menu-icone" aria-hidden="true">❤️</span>
                    <span class="menu-texto">
                        <span class="menu-nome">${jaHoje ? `Hoje: ${jaHoje} bpm ✓` : 'Registrar a FC de hoje'}</span>
                        <span class="menu-resumo">${jaHoje ? 'Já anotado. Toque para corrigir ou ver os últimos dias.' : 'Leva 5 segundos: é só tocar em − e + até chegar no valor.'}</span>
                    </span>
                </a>
                <a href="#/relatorio" class="menu-item acomp">
                    <span class="menu-icone" aria-hidden="true">📊</span>
                    <span class="menu-texto">
                        <span class="menu-nome">Relatório</span>
                        <span class="menu-resumo">Último mês, 3, 6, 9 meses ou 1 ano — e compare com anos anteriores.</span>
                    </span>
                </a>
            </div>
        </section>`;

        for (const g of GRUPOS) {
            const lista = testes.filter((t) => t.grupo === g.id);
            html += `<section class="grupo" aria-labelledby="g-${g.id}">
                <h2 id="g-${g.id}">${modo === 'simples' ? g.simples : g.titulo}</h2>
                <p class="grupo-desc">${g.desc}</p>
                <div class="menu-principal">${lista.map(cardTeste).join('')}</div>
            </section>`;
        }
        main.innerHTML = html;

        main.querySelectorAll('.guia-btn').forEach((b) => b.addEventListener('click', () => {
            const nivel = b.dataset.nivel;
            main.querySelectorAll('.guia-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            const cards = main.querySelectorAll('.menu-item[data-nivel]');
            let qtd = 0;
            cards.forEach((c) => {
                const ok = c.dataset.nivel === nivel;
                c.classList.toggle('recomendado', ok);
                c.classList.toggle('apagado', !ok && c.dataset.nivel !== '');
                if (ok) qtd++;
            });
            const msgs = {
                iniciante: 'Destacamos os testes de caminhada. Comece pelo de 1,2 km: é o único de caminhada que estima o seu VO₂máx.',
                intermediario: 'Destacamos testes curtos de corrida. No de 12 minutos você pode alternar corrida e caminhada.',
                avancado: 'Destacamos os testes de corrida mais longos, para quem já tem ritmo.',
            };
            main.querySelector('.guia-msg').textContent = `✅ ${msgs[nivel]} (${qtd} sugestões)`;
            const primeiro = main.querySelector('.menu-item.recomendado');
            if (primeiro) primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }));
    }

    // ---------------- página do teste ----------------
    function campoHTML(c) {
        const opc = c.opcional ? ' <span class="opcional">(opcional)</span>' : '';
        const unidade = c.unidade ? ` <span class="unidade">(${c.unidade})</span>` : '';
        const ajudaId = `ajuda-${c.id}`;
        let entrada;
        if (c.type === 'select') {
            entrada = `<select id="${c.id}" name="${c.id}" aria-describedby="${ajudaId} erro-${c.id}">${c.options.map((o) => `<option value="${o.value}">${o.text}</option>`).join('')}</select>`;
        } else if (c.type === 'time') {
            entrada = `<div class="time-inputs" role="group" aria-labelledby="lbl-tempo" aria-describedby="${ajudaId} erro-tempo">
                <label class="tempo-parte"><input type="text" inputmode="numeric" id="minutos" name="minutos" placeholder="0" autocomplete="off"><span>min</span></label>
                <label class="tempo-parte"><input type="text" inputmode="numeric" id="segundos" name="segundos" placeholder="0" autocomplete="off"><span>seg</span></label>
            </div>`;
        } else {
            entrada = `<input type="text" inputmode="decimal" id="${c.id}" name="${c.id}" autocomplete="off" aria-describedby="${ajudaId} erro-${c.id}">`;
        }
        const forAttr = c.type === 'time' ? `id="lbl-tempo"` : `for="${c.id}"`;
        return `<div class="form-group" data-campo="${c.id}">
            <label ${forAttr}>${c.label}${unidade}${opc}</label>
            ${entrada}
            ${c.ajuda ? `<small class="ajuda" id="${ajudaId}">${c.ajuda}</small>` : ''}
            <small class="erro" id="erro-${c.id}" role="alert"></small>
        </div>`;
    }

    function renderTeste(t) {
        document.title = `${nome(t)} — Aptidão Física`;
        const simples = modo === 'simples';
        let html = `<a href="#/" class="btn-voltar">‹ Voltar ao menu</a>
            <h1 class="titulo-teste"><span aria-hidden="true">${t.icone}</span> ${nome(t)}</h1>
            ${simples ? `<p class="subtitulo">${t.nomeTecnico}</p>` : ''}`;

        html += `<section class="card"><h2>${simples ? 'O que é?' : 'Metodologia'}</h2>
            <p>${simples ? t.oQueE : t.metodologia}</p>
            <details class="detalhe"><summary>${simples ? 'Ver detalhes técnicos' : 'Ver explicação em linguagem simples'}</summary><p>${simples ? t.metodologia : t.oQueE}</p></details>
        </section>`;

        if (t.passos.length > 1) {
            html += `<section class="card"><h2>Como fazer</h2>
                <ol class="passos">${t.passos.map((p) => `<li>${p}</li>`).join('')}</ol>
                <p class="precisa"><strong>Você vai precisar:</strong> ${t.precisa.map((p) => `<span class="chip">${p}</span>`).join(' ')}</p>
            </section>`;
        }

        html += `<section class="card"><h2>${simples ? 'Digite seus dados' : 'Dados'}</h2>
            <form id="form-teste" novalidate>
                <div class="calculator-grid">${t.inputs.map(campoHTML).join('')}</div>
                <button type="submit" class="btn-calc">Calcular</button>
            </form>
            <div id="resultado-wrapper" aria-live="polite"></div>
        </section>`;

        main.innerHTML = html;
        main.querySelector('#form-teste').addEventListener('submit', (e) => { e.preventDefault(); calcular(t); });
    }

    // ---------------- cálculo e resultado ----------------
    function valoresDoFormulario(t) {
        const v = {};
        for (const c of t.inputs) {
            if (c.type === 'time') {
                v.minutos = document.getElementById('minutos').value;
                v.segundos = document.getElementById('segundos').value;
            } else v[c.id] = document.getElementById(c.id).value;
        }
        return v;
    }

    function calcular(t) {
        main.querySelectorAll('.form-group').forEach((g) => { g.classList.remove('com-erro'); g.querySelector('.erro').textContent = ''; });
        const wrap = document.getElementById('resultado-wrapper');
        const { dados, erros } = validar(t, valoresDoFormulario(t));
        if (erros) {
            for (const [id, msg] of Object.entries(erros)) {
                const g = main.querySelector(`.form-group[data-campo="${id}"]`);
                if (g) { g.classList.add('com-erro'); g.querySelector('.erro').textContent = msg; }
            }
            wrap.innerHTML = `<div class="resultado-erro">Confira os campos destacados em vermelho.</div>`;
            const primeiro = main.querySelector('.com-erro input, .com-erro select');
            if (primeiro) primeiro.focus();
            return;
        }
        const r = t.calcular(dados);
        ctxAssistente.ultimo = { teste: t, dados, resultado: r };
        wrap.innerHTML = resultadoHTML(t, dados, r);
        ligarBotoesResultado(t, dados, r);
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        avisarAssistente(t);
    }

    function medidor(cls) {
        const n = cls.escala.length;
        return `<div class="medidor" role="img" aria-label="Classificação ${cls.rotulo}, nível ${cls.nivel + 1} de ${n}">
            ${cls.escala.map((rot, i) => `<div class="medidor-seg ${i === cls.nivel ? 'atual' : ''}" style="--i:${i};--n:${n - 1}"><span>${rot}</span></div>`).join('')}
        </div>`;
    }

    function explicacaoHTML(t, d, r) {
        const partes = [];
        if (r.vo2 && !r.vo2Exercicio) {
            const e = explicarVO2(r.vo2);
            partes.push(`<p><strong>VO₂máx</strong> é o “tamanho do motor” do seu corpo: quanto oxigênio ele consegue usar no esforço máximo. Quanto maior, mais fôlego.</p>`);
            partes.push(`<p>O seu equivale a <strong>${num(e.mets, 1)} METs</strong>: no limite, seu corpo produz cerca de ${num(e.mets, 0)} vezes a energia que gasta sentado.</p>`);
            if (e.tranquilas.length) partes.push(`<p>Em ritmo confortável (uns 60% do máximo), atividades como <strong>${e.tranquilas.slice(-3).join(', ')}</strong> tendem a ser tranquilas para você.</p>`);
        }
        if (r.nota) partes.push(`<p>${r.nota}</p>`);
        if (r.classificacao && (r.vo2 || r.vo2Exercicio)) {
            const f = faixaMensagem(r.classificacao);
            if (f) partes.push(`<p class="msg-nivel msg-${f}">${MENSAGENS_NIVEL[f]}</p>`);
        }
        if (r.tipo === 'ritmo') {
            const textos = {
                Andar: 'Nesse ritmo você está caminhando. Ótimo para a saúde e para começar.',
                'Andar/Trotar': 'Você está na transição entre caminhar e trotar (correr bem leve).',
                Trotar: 'Isso é um trote: uma corrida leve e confortável.',
                Correr: 'Isso já é corrida de verdade!',
            };
            partes.push(`<p>${textos[r.classificacao.rotulo]}</p>`);
        }
        if (r.tipo === 'kcal') {
            const comidas = [['pão francês', 135], ['banana', 90], ['lata de refrigerante', 140]];
            partes.push(`<p>Para comparar, ${num(r.kcal, 0)} kcal equivalem a mais ou menos: ${comidas.map(([c, k]) => `<strong>${num(r.kcal / k, 1)}</strong> ${c}`).join(' · ')}.</p>`);
            partes.push('<p>É uma estimativa média — o gasto real varia de pessoa para pessoa.</p>');
        }
        return partes.join('');
    }

    function resultadoHTML(t, d, r) {
        const simples = modo === 'simples';
        let html = `<div class="resultado">
            <p class="resultado-rotulo">${r.principal.rotulo}</p>
            <p class="resultado-valor">${r.principal.valor} <span>${r.principal.unidade}</span></p>`;
        if (r.classificacao) {
            html += `<p class="resultado-classe">Classificação: <strong>${r.classificacao.rotulo}</strong> <span>(${r.classificacao.referencia})</span></p>${medidor(r.classificacao)}`;
        }
        html += `</div>`;

        const avisos = [];
        if (r.aviso) avisos.push(r.aviso);
        if (r.semTabela) avisos.push(r.semTabela);
        if (r.vo2 && !r.vo2Exercicio && (r.vo2 < 10 || r.vo2 > 90)) avisos.push('Esse valor está fora do que se vê em pessoas reais. Confira se digitou os dados certinho.');
        if (r.vo2 && !r.vo2Exercicio && !r.classificacao) avisos.push('Preencha idade e sexo (18 anos ou mais) para comparar seu resultado com pessoas parecidas com você.');
        if (r.classificacaoVO2) avisos.push(`Pela tabela geral de VO₂máx, seu resultado seria <strong>${r.classificacaoVO2.rotulo}</strong> (${r.classificacaoVO2.referencia}).`);
        html += avisos.map((a) => `<p class="aviso">${a}</p>`).join('');

        const exp = explicacaoHTML(t, d, r);
        if (exp) html += `<details class="explicacao" ${simples ? 'open' : ''}><summary>💡 O que isso significa?</summary>${exp}</details>`;

        html += `<details class="detalhe-calculo" ${simples ? '' : 'open'}><summary>🧮 Como o cálculo foi feito</summary>
            <div class="tabela-rolagem"><table class="calculation-table">
                <thead><tr><th scope="col">Etapa</th><th scope="col">Valor</th><th scope="col">Cálculo</th></tr></thead>
                <tbody>${r.linhas.map(([p, v, c]) => `<tr><td>${p}</td><td>${v}</td><td><code>${c}</code></td></tr>`).join('')}</tbody>
            </table></div>
            ${r.classificacao ? `<p class="fonte">Referência da classificação: ${r.classificacao.fonte}.</p>` : ''}
        </details>`;

        html += `<div class="acoes">
            <button type="button" class="btn-save" id="btn-salvar">💾 Salvar resultado (.txt)</button>
            <button type="button" class="btn-sec" id="btn-copiar">📋 Copiar</button>
            <button type="button" class="btn-sec" id="btn-perguntar">💬 Explicar meu resultado</button>
        </div>`;
        return html;
    }

    function ligarBotoesResultado(t, d, r) {
        const texto = textoParaSalvar(t, d, r);
        document.getElementById('btn-salvar').addEventListener('click', () => {
            const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `resultado_${t.id}_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        });
        document.getElementById('btn-copiar').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            try { await navigator.clipboard.writeText(texto); btn.textContent = '✅ Copiado!'; }
            catch (err) { btn.textContent = 'Não foi possível copiar'; }
            setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
        });
        document.getElementById('btn-perguntar').addEventListener('click', () => {
            abrirAssistente();
            perguntar('O que significa meu resultado?');
        });
    }

    // ---------------- assistente de texto ----------------
    const painel = document.getElementById('assistente');
    const botaoAbrir = document.getElementById('assistente-abrir');
    const mensagens = document.getElementById('assistente-mensagens');
    const sugestoes = document.getElementById('assistente-sugestoes');
    const form = document.getElementById('assistente-form');
    const campo = document.getElementById('assistente-pergunta');
    let iniciado = false;

    function adicionarMensagem(html, quem) {
        const div = document.createElement('div');
        div.className = `msg msg-${quem}`;
        if (quem === 'usuario') div.textContent = html; else div.innerHTML = html;
        mensagens.appendChild(div);
        mensagens.scrollTop = mensagens.scrollHeight;
    }

    function mostrarSugestoes(lista) {
        sugestoes.innerHTML = '';
        (lista || []).forEach((s) => {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'sugestao'; b.textContent = s;
            b.addEventListener('click', () => perguntar(s));
            sugestoes.appendChild(b);
        });
    }

    function perguntar(texto) {
        const q = texto.trim();
        if (!q) return;
        adicionarMensagem(q, 'usuario');
        const r = window.Assistente.responder(q, ctxAssistente);
        setTimeout(() => { adicionarMensagem(r.html, 'bot'); mostrarSugestoes(r.sugestoes); }, 250);
    }

    function abrirAssistente() {
        painel.hidden = false;
        botaoAbrir.setAttribute('aria-expanded', 'true');
        document.body.classList.add('assistente-aberto');
        if (!iniciado) {
            iniciado = true;
            adicionarMensagem('Olá! 👋 Sou o assistente do app. Posso explicar os testes, o seu resultado e tirar dúvidas sobre condicionamento. Escolha uma pergunta abaixo ou escreva a sua.', 'bot');
            mostrarSugestoes(ctxAssistente.ultimo ? ['O que significa meu resultado?', ...window.Assistente.SUGESTOES_INICIAIS.slice(0, 3)] : window.Assistente.SUGESTOES_INICIAIS);
        }
        setTimeout(() => campo.focus(), 50);
    }
    function fecharAssistente() {
        painel.hidden = true;
        botaoAbrir.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('assistente-aberto');
        botaoAbrir.focus();
    }
    function avisarAssistente(t) {
        botaoAbrir.classList.add('pulsar');
        setTimeout(() => botaoAbrir.classList.remove('pulsar'), 2400);
        if (iniciado) mostrarSugestoes(['O que significa meu resultado?', 'Como melhorar meu fôlego?', 'O resultado é preciso?']);
    }

    botaoAbrir.addEventListener('click', () => (painel.hidden ? abrirAssistente() : fecharAssistente()));
    document.getElementById('assistente-fechar').addEventListener('click', fecharAssistente);
    form.addEventListener('submit', (e) => { e.preventDefault(); perguntar(campo.value); campo.value = ''; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) fecharAssistente(); });
    // Links dentro das respostas navegam pelo app; no celular, fecham o painel.
    mensagens.addEventListener('click', (e) => {
        if (e.target.closest('a[href^="#/"]') && window.innerWidth < 700) fecharAssistente();
    });

    rotear(false);
});
