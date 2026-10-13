/* =====================================================================
 * assistente.js — assistente de texto que tira dúvidas em linguagem simples.
 * Funciona 100% no navegador, sem internet e sem custo: responde a partir
 * de uma base de conhecimento escrita à mão + o último resultado calculado.
 * ===================================================================== */
(function (global) {
    'use strict';

    const normalizar = (t) => String(t).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.,\s]/g, ' ');
    const link = (id, texto) => `<a href="#/${id}">${texto}</a>`;

    const SUGESTOES_INICIAIS = ['Qual teste devo fazer?', 'O que é VO₂máx?', 'Como medir os batimentos?', 'É seguro fazer o teste?'];

    /* Cada item: chaves (palavras/expressões, sem acento) e resposta (texto ou função(contexto)).
     * Vence o item com mais chaves encontradas na pergunta. */
    const BASE = [
        {
            chaves: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'ajuda', 'help'],
            resposta: () => 'Olá! 👋 Eu explico os testes e os resultados em linguagem simples. Pergunte, por exemplo, <em>“qual teste devo fazer?”</em>, <em>“o que significa meu resultado?”</em> ou <em>“como melhorar meu fôlego?”</em>.',
            sugestoes: SUGESTOES_INICIAIS,
        },
        {
            chaves: ['meu resultado', 'resultado', 'significa', 'interpretar', 'entender', 'explica', 'bom ou ruim', 'nota', 'como estou', 'estou bem'],
            resposta: (ctx) => explicarResultado(ctx),
            sugestoes: ['Como melhorar meu fôlego?', 'O resultado é preciso?', 'Quando refazer o teste?'],
        },
        {
            chaves: ['melhorar', 'aumentar', 'treinar', 'treino', 'evoluir', 'subir de nivel', 'ganhar folego', 'progredir'],
            resposta: () => 'Algumas dicas que funcionam para a maioria das pessoas:<ul><li><strong>Regularidade primeiro:</strong> 150 minutos por semana de atividade moderada (ex.: 30 min, 5 dias) já melhoram o fôlego.</li><li><strong>Comece onde você está:</strong> se hoje só caminha, caminhe. Aumente o tempo ou a velocidade cerca de 10% por semana.</li><li><strong>Inclua um dia mais forte:</strong> alternar 1–2 min rápidos com 2 min leves (intervalado) acelera a evolução.</li><li><strong>Descanse:</strong> o corpo melhora na recuperação; durma bem.</li></ul>Refaça o teste em 8 a 12 semanas para ver a evolução. Se tiver alguma condição de saúde, converse com um profissional antes.',
            sugestoes: ['Quando refazer o teste?', 'É seguro fazer o teste?'],
        },
        {
            chaves: ['vo2', 'vo2max', 'vo2 max', 'folego', 'consumo de oxigenio', 'consumo maximo', 'capacidade aerobia', 'capacidade aerobica', 'condicionamento'],
            resposta: () => '<strong>VO₂máx</strong> é a quantidade máxima de oxigênio que o seu corpo consegue usar por minuto num esforço intenso. Pense nele como o <strong>“tamanho do motor”</strong>: quanto maior, mais fôlego você tem para caminhar, subir escadas, correr ou brincar com as crianças sem cansar.<br><br>É medido em <em>ml/kg/min</em> (mililitros de oxigênio por quilo de peso, por minuto). Para ter uma ideia: uma pessoa sedentária costuma ficar entre 25 e 35; pessoas ativas, entre 40 e 50; atletas de resistência passam de 60.',
            sugestoes: ['Como melhorar meu fôlego?', 'Qual teste devo fazer?'],
        },
        {
            chaves: ['qual teste', 'que teste', 'escolher', 'indicado', 'indica', 'comecar', 'iniciante', 'sedentario', 'recomenda', 'melhor teste'],
            resposta: () => `Depende de como você está hoje:<ul><li><strong>Só caminho / estou parado(a) há tempo:</strong> ${link('caminhada_1200m', 'Caminhar 1,2 km')} (o único de caminhada que estima o VO₂máx) ou ${link('caminhada_4800m', 'Caminhar 4,8 km')}.</li><li><strong>Consigo correr um pouco:</strong> ${link('cooper_12min', 'O máximo em 12 minutos')} — pode alternar corrida e caminhada.</li><li><strong>Já corro com frequência:</strong> ${link('cooper_2400m', 'Correr 2,4 km')}, ${link('balke_15min', 'Correr 15 minutos')} ou ${link('ribisl_kachodorian', 'Correr 3,2 km')}.</li></ul>Na dúvida, comece pela caminhada. 🙂`,
            sugestoes: ['É seguro fazer o teste?', 'Onde faço o teste?'],
        },
        {
            chaves: ['batimento', 'batimentos', 'frequencia cardiaca', 'pulso', 'bpm', 'coracao', 'fc'],
            resposta: () => 'Para medir os batimentos (frequência cardíaca) logo ao terminar:<ol><li>Encoste dois dedos (indicador e médio) no <strong>pulso</strong>, abaixo do polegar, ou na lateral do <strong>pescoço</strong>.</li><li>Conte as batidas durante <strong>15 segundos</strong>.</li><li>Multiplique por <strong>4</strong>. Ex.: 32 batidas × 4 = 128 bpm.</li></ol>Faça isso <strong>imediatamente</strong> ao parar — os batimentos caem rápido. Relógios esportivos e cintas cardíacas facilitam.',
            sugestoes: ['O que é VO₂máx?', 'Qual teste devo fazer?'],
        },
        {
            chaves: ['seguro', 'seguranca', 'perigo', 'perigoso', 'risco', 'cuidado', 'doenca', 'pressao', 'medico', 'dor', 'cardiaco', 'hipertensao', 'diabetes', 'gravida', 'gestante', 'tontura'],
            resposta: () => '⚠️ Estes testes exigem esforço forte. <strong>Procure um médico antes</strong> se você: tem problema de coração ou pressão alta, sente dor no peito ou tontura ao se esforçar, tem diabetes, está grávida, tem mais de 45 anos e está parado(a) há tempo, ou tem dor nas articulações.<br><br><strong>Pare na hora</strong> se sentir dor ou aperto no peito, falta de ar fora do normal, tontura, náusea ou visão turva.<br><br>Dicas: aqueça antes, beba água, evite horários muito quentes e, se possível, faça acompanhado(a).',
            sugestoes: ['Qual teste devo fazer?', 'Como medir os batimentos?'],
        },
        {
            chaves: ['met', 'mets', 'equivalente metabolico'],
            resposta: () => `<strong>MET</strong> é uma régua de esforço. <strong>1 MET</strong> é a energia que você gasta sentado(a), parado(a). Uma caminhada leve vale uns 3,5 METs (3,5 vezes o repouso); correr a 10 km/h, uns 10 METs.<br><br>Tecnicamente, 1 MET = 3,5 ml de oxigênio por kg por minuto. Por isso dividimos o seu VO₂máx por 3,5 para saber quantos METs você aguenta no máximo. Veja em ${link('def_mets', 'Quantas calorias eu gasto?')}.`,
            sugestoes: ['Quantas calorias eu gasto?', 'O que é VO₂máx?'],
        },
        {
            chaves: ['caloria', 'calorias', 'kcal', 'emagrecer', 'emagrecimento', 'gastar', 'gasto', 'queimar', 'perder peso'],
            resposta: () => `A “caloria” dos rótulos é a <strong>quilocaloria (kcal)</strong>. Seu corpo gasta cerca de <strong>5 kcal para cada litro de oxigênio</strong> que usa. Quanto mais intensa e longa a atividade, e quanto maior o seu peso, mais calorias.<br><br>Use a calculadora ${link('def_mets', 'Quantas calorias eu gasto?')} para estimar. Lembre: para emagrecer, alimentação e regularidade contam tanto quanto o exercício.`,
            sugestoes: ['O que é MET?', 'Como melhorar meu fôlego?'],
        },
        {
            chaves: ['ritmo', 'pace', 'velocidade', 'trotar', 'trote', 'andar ou correr', 'km/h'],
            resposta: () => `<strong>Ritmo (pace)</strong> é o tempo para percorrer 1 km. Ex.: pace de 6:00 = 1 km a cada 6 minutos = 10 km/h.<ul><li>Mais de 8:42 por km → andar</li><li>De 7:28 a 8:42 → andar/trotar</li><li>De 5:35 a 7:27 → trotar</li><li>Até 5:34 → correr</li></ul>Calcule o seu em ${link('def_ritmo', 'Estou andando ou correndo?')}.`,
            sugestoes: ['Qual teste devo fazer?'],
        },
        {
            chaves: ['pista', 'volta', 'voltas', 'onde', 'medir distancia', 'gps', 'aplicativo', 'app', 'percurso', 'esteira'],
            resposta: () => 'O ideal é uma <strong>pista de atletismo</strong>: cada volta na raia de dentro tem <strong>400 m</strong>. Sem pista, use um percurso plano e meça com um app de GPS (Strava, Google Fit, relógio esportivo) ou o Google Maps.<br><br>Na <strong>esteira</strong> dá para fazer, mas os resultados mudam um pouco (deixe 1% de inclinação para ficar mais parecido com a rua).',
            sugestoes: ['Qual teste devo fazer?', 'O resultado é preciso?'],
        },
        {
            chaves: ['preciso', 'precisao', 'exato', 'confiavel', 'certeza', 'erro', 'margem', 'real', 'verdade', 'laboratorio'],
            resposta: () => 'São <strong>estimativas</strong>. Testes de campo como estes costumam errar em torno de <strong>10 a 15%</strong> para mais ou para menos em relação ao exame de laboratório (ergoespirometria). Servem muito bem para <strong>acompanhar a sua evolução</strong>: se você repetir o mesmo teste, nas mesmas condições, a comparação é confiável.',
            sugestoes: ['Quando refazer o teste?', 'O que é VO₂máx?'],
        },
        {
            chaves: ['refazer', 'repetir', 'de novo', 'quando refazer', 'frequencia do teste', 'reavaliar', 'reavaliacao'],
            resposta: () => 'Refaça a cada <strong>8 a 12 semanas</strong>. Para comparar de forma justa, repita o <strong>mesmo teste</strong>, no mesmo local, horário parecido, depois de uma boa noite de sono e sem treino forte no dia anterior. Salve o resultado (botão “Salvar resultado”) para comparar depois.',
            sugestoes: ['Como melhorar meu fôlego?'],
        },
        {
            chaves: ['aquecer', 'aquecimento', 'alongar', 'alongamento', 'antes do teste', 'preparar', 'comer', 'beber'],
            resposta: () => 'Antes do teste: <ul><li>Coma algo leve 1–2 horas antes e beba água.</li><li>Aqueça 5–10 minutos (caminhada e trote leve, movimentos de braços e pernas).</li><li>Use roupa e tênis confortáveis.</li><li>Evite treino pesado no dia anterior.</li></ul>Depois, caminhe devagar alguns minutos para “desaquecer” — não pare de uma vez.',
            sugestoes: ['É seguro fazer o teste?'],
        },
        {
            chaves: ['idade', 'sexo', 'por que pede', 'homem', 'mulher', 'peso'],
            resposta: () => 'A idade e o sexo servem para <strong>comparar você com pessoas parecidas</strong>: o fôlego cai naturalmente com a idade e, em média, é diferente entre homens e mulheres. Em alguns testes (1,2 km e 3,2 km) peso e idade também entram na própria fórmula. Nada é enviado para a internet — tudo fica no seu aparelho.',
            sugestoes: ['O que significa meu resultado?'],
        },
        {
            chaves: ['privacidade', 'dados', 'salva', 'internet', 'enviado', 'guardado'],
            resposta: () => 'Nenhum dado sai do seu aparelho: os cálculos são feitos no próprio navegador. O resultado só é guardado se você clicar em “Salvar resultado”, que baixa um arquivo .txt para você.',
        },
        {
            chaves: ['obrigado', 'obrigada', 'valeu', 'show', 'otimo', 'legal', 'top'],
            resposta: () => 'Por nada! 💪 Se surgir outra dúvida, é só perguntar.',
        },
    ];

    // Perguntas sobre testes específicos
    const CHAVES_TESTES = {
        caminhada_1200m: ['1200', '1.200', '1,2 km', 'rockport'],
        caminhada_3000m: ['3000', '3.000', '3 km'],
        caminhada_4800m: ['cooper', '4800', '4.800', '4,8 km', '3 milhas'],
        cooper_12min: ['teste de cooper', '12 minutos', '12 min', "12'", 'cooper'],
        balke_15min: ['balke', '15 minutos', '15 min'],
        corrida_1000m: ['1000', '1.000', 'correr 1 km', 'corrida de 1 km'],
        cooper_2400m: ['cooper', '2400', '2.400', '2,4 km', '1,5 milha'],
        ribisl_kachodorian: ['3200', '3.200', '3,2 km', 'ribisl', 'kachodorian'],
    };

    function contem(texto, chave) {
        const k = normalizar(chave).trim();
        if (!k) return false;
        // Palavras curtas precisam bater inteiras (evita "met" casar com "metros").
        const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|\\s)${esc}(\\s|$|[.,?!])`).test(texto);
    }

    function explicarResultado(ctx) {
        const u = ctx && ctx.ultimo;
        if (!u) return 'Ainda não vi nenhum resultado seu. Escolha um teste no menu, preencha os dados e clique em <strong>Calcular</strong> — depois me pergunte de novo que eu explico. 😉';
        const { teste, resultado: r } = u;
        const AF = global.AF;
        let html = `No teste <strong>${teste.nomeSimples}</strong>, `;
        if (r.vo2 && !r.vo2Exercicio) {
            const e = AF.explicarVO2(r.vo2);
            html += `seu VO₂máx estimado foi <strong>${r.principal.valor} ml/kg/min</strong>. `;
            html += `Isso quer dizer que, no seu limite, seu corpo produz cerca de <strong>${AF.num(e.mets, 1)} vezes</strong> a energia que gasta em repouso. `;
            if (e.tranquilas.length) html += `Em ritmo confortável, atividades como <strong>${e.tranquilas.slice(-2).join('</strong> e <strong>')}</strong> devem ser tranquilas. `;
        } else {
            html += `seu resultado foi <strong>${r.principal.valor} ${r.principal.unidade}</strong>. `;
        }
        if (r.classificacao) {
            html += `<br><br>Classificação: <strong>${r.classificacao.rotulo}</strong> (${r.classificacao.referencia}). `;
            const f = AF.faixaMensagem(r.classificacao);
            if (f && (r.vo2 || r.vo2Exercicio)) html += AF.MENSAGENS_NIVEL[f];
        } else if (r.vo2 && !r.vo2Exercicio) {
            html += '<br><br>Para eu comparar com pessoas da sua idade, preencha também <strong>idade e sexo</strong> (precisa ter 18 anos ou mais).';
        }
        if (r.tipo === 'kcal') html = `Pela calculadora, a atividade gastaria cerca de <strong>${r.principal.valor} kcal</strong>. É uma estimativa média — o gasto real varia de pessoa para pessoa.`;
        return html;
    }

    function responder(pergunta, ctx) {
        const t = ' ' + normalizar(pergunta) + ' ';
        // 1) Pergunta sobre um teste específico?
        const AF = global.AF;
        let testeCitado = null, pontosTeste = 0;
        for (const [id, chaves] of Object.entries(CHAVES_TESTES)) {
            // Números (ex.: "2400") pesam mais que nomes genéricos (ex.: "cooper").
            const p = chaves.filter((c) => contem(t, c)).reduce((acc, c) => acc + (/\d/.test(c) ? 2 : 1), 0);
            if (p > pontosTeste) { testeCitado = AF.testes.find((x) => x.id === id); pontosTeste = p; }
        }
        // 2) Melhor item da base
        let melhor = null, pontos = 0;
        for (const item of BASE) {
            const p = item.chaves.reduce((acc, c) => acc + (contem(t, c) ? 1 : 0), 0);
            if (p > pontos) { melhor = item; pontos = p; }
        }
        const sobreResultado = melhor && melhor.chaves.includes('meu resultado');
        if (testeCitado && !sobreResultado) {
            const x = testeCitado;
            return {
                html: `<strong>${x.icone} ${x.nomeSimples}</strong> (${x.nomeTecnico})<br>${x.oQueE}<br><br><strong>Como fazer:</strong><ol>${x.passos.map((p) => `<li>${p}</li>`).join('')}</ol><a href="#/${x.id}">Abrir este teste →</a>`,
                sugestoes: ['É seguro fazer o teste?', 'Qual teste devo fazer?'],
            };
        }
        if (melhor) return { html: melhor.resposta(ctx), sugestoes: melhor.sugestoes };
        return {
            html: 'Hmm, não entendi bem essa. 🤔 Eu sei responder sobre os testes, o que significa o seu resultado, VO₂máx, METs, calorias, como medir os batimentos, segurança e como melhorar o condicionamento. Tente uma das sugestões abaixo:',
            sugestoes: ['O que significa meu resultado?', 'O que é VO₂máx?', 'Qual teste devo fazer?', 'Como melhorar meu fôlego?'],
        };
    }

    const Assistente = { responder, SUGESTOES_INICIAIS, normalizar };
    if (typeof module !== 'undefined' && module.exports) module.exports = Assistente;
    else global.Assistente = Assistente;
})(typeof window !== 'undefined' ? window : globalThis);
