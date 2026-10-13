/* =====================================================================
 * calculos.js — fórmulas, tabelas de referência e textos dos testes.
 * Não depende do navegador: pode ser testado com Node (module.exports).
 * ===================================================================== */
(function (global) {
    'use strict';

    // ---------- utilidades ----------
    const num = (n, casas = 1) =>
        Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

    const fmtTempo = (seg) => {
        const m = Math.floor(seg / 60);
        const s = Math.round(seg % 60);
        return s ? `${m} min ${s} s` : `${m} min`;
    };

    const nomeSexo = (s) => (s === 'M' ? 'Masculino' : 'Feminino');
    const grupoRef = (sexo, a, b) =>
        `comparado com ${sexo === 'M' ? 'homens' : 'mulheres'} ${b > 100 ? `com ${a} anos ou mais` : `de ${a} a ${b} anos`}`;

    // ---------- tabelas de referência ----------

    /* VO₂máx (ml/kg/min) por idade e sexo — normas gerais de aptidão
     * (Topend Sports, compiladas de várias fontes). Cada vetor traz o valor
     * mínimo para subir de nível: [Fraco, Abaixo da média, Média,
     * Acima da média, Bom, Excelente]. Abaixo do primeiro = Muito fraco. */
    const NIVEIS_VO2 = ['Muito fraco', 'Fraco', 'Abaixo da média', 'Média', 'Acima da média', 'Bom', 'Excelente'];
    const NORMAS_VO2 = {
        faixas: [[18, 25], [26, 35], [36, 45], [46, 55], [56, 65], [66, 120]],
        M: [
            [30, 37, 42, 47, 52, 60.1],
            [30, 35, 40, 43, 49, 56.1],
            [26, 31, 35, 39, 43, 51.1],
            [25, 29, 32, 36, 39, 45.1],
            [22, 26, 30, 32, 36, 41.1],
            [20, 22, 26, 29, 33, 37.1],
        ],
        F: [
            [28, 33, 38, 42, 47, 56.1],
            [26, 31, 35, 39, 45, 52.1],
            [22, 27, 31, 34, 38, 45.1],
            [20, 25, 28, 31, 34, 40.1],
            [18, 22, 25, 28, 32, 37.1],
            [17, 19, 22, 25, 28, 32.1],
        ],
    };

    /* Cooper 12 min — distância (m). Cooper (1968), via Topend Sports.
     * Níveis: [Fraco, Abaixo da média, Média, Acima da média, Excelente]. */
    const NIVEIS_COOPER12 = ['Fraco', 'Abaixo da média', 'Média', 'Acima da média', 'Excelente'];
    const COOPER12 = {
        faixas: [[20, 29], [30, 39], [40, 49], [50, 120]],
        M: [[1600, 2200, 2400, 2801], [1500, 1900, 2300, 2701], [1400, 1700, 2100, 2501], [1300, 1600, 2000, 2401]],
        F: [[1500, 1800, 2200, 2701], [1400, 1700, 2000, 2501], [1200, 1500, 1900, 2301], [1100, 1400, 1700, 2201]],
    };

    /* Caminhada de 3 milhas (4.800 m) — The Cooper Institute.
     * Tempo máximo (s) para cada nível: [Excelente, Bom, Regular, Fraco];
     * acima do último = Muito fraco. */
    const NIVEIS_4800 = ['Muito fraco', 'Fraco', 'Regular', 'Bom', 'Excelente'];
    const CAMINHADA_4800 = {
        faixas: [[20, 29], [30, 39], [40, 49], [50, 59]],
        M: [[2039, 2310, 2520, 2760], [2099, 2400, 2670, 2940], [2189, 2520, 2820, 3120], [2339, 2700, 3000, 3300]],
        F: [[2189, 2430, 2640, 2880], [2249, 2520, 2790, 3060], [2339, 2640, 2940, 3240], [2519, 2820, 3120, 3420]],
    };

    const indiceFaixa = (faixas, idade) => faixas.findIndex(([a, b]) => idade >= a && idade <= b);

    function classificarVO2(vo2, idade, sexo) {
        if (!idade || !sexo) return null;
        const i = indiceFaixa(NORMAS_VO2.faixas, idade);
        if (i < 0) return null;
        const cortes = NORMAS_VO2[sexo][i];
        const nivel = cortes.filter((c) => vo2 >= c).length;
        const [a, b] = NORMAS_VO2.faixas[i];
        return {
            nivel, escala: NIVEIS_VO2, rotulo: NIVEIS_VO2[nivel],
            referencia: grupoRef(sexo, a, b),
            fonte: 'Normas gerais de VO₂máx por idade e sexo (Topend Sports)',
        };
    }

    function classificarCooper12(dist, idade, sexo) {
        const i = indiceFaixa(COOPER12.faixas, idade);
        if (i < 0) return null;
        const nivel = COOPER12[sexo][i].filter((c) => dist >= c).length;
        const [a, b] = COOPER12.faixas[i];
        return {
            nivel, escala: NIVEIS_COOPER12, rotulo: NIVEIS_COOPER12[nivel],
            referencia: grupoRef(sexo, a, b),
            fonte: 'Tabela de Cooper (1968) para 12 minutos',
        };
    }

    function classificar4800(seg, idade, sexo) {
        const i = indiceFaixa(CAMINHADA_4800.faixas, idade);
        if (i < 0) return null;
        const limites = CAMINHADA_4800[sexo][i];
        let nivel = 0;
        for (let k = 0; k < limites.length; k++) {
            if (seg <= limites[k]) { nivel = 4 - k; break; }
        }
        const [a, b] = CAMINHADA_4800.faixas[i];
        return {
            nivel, escala: NIVEIS_4800, rotulo: NIVEIS_4800[nivel],
            referencia: grupoRef(sexo, a, b),
            fonte: 'The Cooper Institute — caminhada de 3 milhas',
        };
    }

    // ---------- campos reutilizáveis ----------
    const campo = {
        peso: { id: 'peso', label: 'Peso', unidade: 'kg', type: 'number', min: 25, max: 250, step: '0.1',
            ajuda: 'Seu peso em quilos. Pode usar vírgula ou ponto.' },
        idade: { id: 'idade', label: 'Idade', unidade: 'anos', type: 'number', min: 10, max: 100,
            ajuda: 'Usada na fórmula ou para comparar você com pessoas da mesma idade.' },
        idadeOpc: { id: 'idade', label: 'Idade', unidade: 'anos', type: 'number', min: 10, max: 100, opcional: true,
            ajuda: 'Opcional — serve só para comparar seu resultado com pessoas da sua idade.' },
        sexo: { id: 'sexo', label: 'Sexo', type: 'select', options: [{ value: 'M', text: 'Masculino' }, { value: 'F', text: 'Feminino' }],
            ajuda: 'Homens e mulheres têm tabelas de referência diferentes.' },
        sexoOpc: { id: 'sexo', label: 'Sexo', type: 'select', opcional: true,
            options: [{ value: '', text: '— prefiro não informar —' }, { value: 'M', text: 'Masculino' }, { value: 'F', text: 'Feminino' }],
            ajuda: 'Opcional — usado apenas para a comparação.' },
        fc: { id: 'fc', label: 'Batimentos ao terminar', unidade: 'bpm', type: 'number', min: 50, max: 220,
            ajuda: 'Logo que parar, conte os batimentos no pulso ou pescoço por 15 segundos e multiplique por 4. Ou use o relógio/frequencímetro.' },
        tempo: (label, minMin, maxMin) => ({ id: 'tempo', label, type: 'time', minMin, maxMin,
            ajuda: 'O tempo do cronômetro: minutos de um lado, segundos do outro.' }),
        distancia: (min, max) => ({ id: 'distancia', label: 'Distância percorrida', unidade: 'metros', type: 'number', min, max,
            ajuda: 'Em metros. Numa pista oficial, cada volta tem 400 m.' }),
    };

    // ---------- resultado padrão para testes de VO₂ ----------
    function resultadoVO2(vo2, d, extras = {}) {
        const { classificacao: clsTeste, ...resto } = extras;
        const clsVO2 = classificarVO2(vo2, d.idade, d.sexo);
        return Object.assign({
            vo2,
            principal: { valor: num(vo2, 1), unidade: 'ml/kg/min', rotulo: 'VO₂máx estimado' },
            // Se o teste tem tabela própria (ex.: Cooper), ela vem primeiro;
            // a comparação pelo VO₂máx aparece como complemento.
            classificacao: clsTeste || clsVO2,
            classificacaoVO2: clsTeste ? clsVO2 : null,
        }, resto);
    }

    // ---------- catálogo de testes ----------
    const testes = [
        {
            id: 'caminhada_1200m', grupo: 'caminhada', icone: '🚶',
            nomeTecnico: 'Caminhada 1.200 m', nomeSimples: 'Caminhar 1,2 km',
            resumo: 'Caminhe 1,2 km o mais rápido que puder e conte os batimentos no final.',
            duracao: '10–20 min', precisa: ['Cronômetro', 'Percurso de 1.200 m', 'Medir batimentos'],
            nivelIndicado: 'iniciante',
            oQueE: 'Um teste leve, feito só caminhando. Com o seu tempo e os seus batimentos no final, dá para estimar o seu fôlego (VO₂máx). Bom para quem está começando ou não pode correr.',
            passos: ['Aqueça caminhando devagar por 3 a 5 minutos.', 'Caminhe 1.200 m (3 voltas numa pista de 400 m) o mais rápido possível, sem correr.', 'Pare o cronômetro ao terminar.', 'Na hora, conte os batimentos por 15 segundos e multiplique por 4.'],
            metodologia: 'O avaliado caminha 1.200 m no menor tempo possível; a FC é medida imediatamente ao final. Utiliza-se a equação de Rockport (Kline et al., 1987), originalmente para 1 milha (1.609 m). Como adaptação, o tempo de 1.200 m é projetado proporcionalmente para 1 milha antes de entrar na equação.',
            inputs: [campo.peso, campo.idade, campo.sexo, campo.tempo('Tempo para caminhar 1.200 m', 6, 40), campo.fc],
            calcular(d) {
                const t = d.tempoSeg / 60;
                const tMilha = t * (1609.34 / 1200);
                const s = d.sexo === 'M' ? 1 : 0;
                const vo2 = 132.853 - 0.1692 * d.peso - 0.3877 * d.idade + 6.315 * s - 3.2649 * tMilha - 0.1565 * d.fc;
                return resultadoVO2(vo2, d, {
                    linhas: [
                        ['Tempo em minutos (T)', num(t, 2), `${fmtTempo(d.tempoSeg)} ÷ 60`],
                        ['Tempo projetado para 1 milha', num(tMilha, 2) + ' min', `T × 1609,34 ÷ 1200`],
                        ['Fórmula de Rockport', '', '132,853 − 0,1692·Peso − 0,3877·Idade + 6,315·Sexo(1=M, 0=F) − 3,2649·T(milha) − 0,1565·FC'],
                        ['VO₂máx', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `132,853 − ${num(0.1692 * d.peso, 2)} − ${num(0.3877 * d.idade, 2)} + ${num(6.315 * s, 2)} − ${num(3.2649 * tMilha, 2)} − ${num(0.1565 * d.fc, 2)}`],
                        ['VO₂máx absoluto', `${num(vo2 * d.peso / 1000, 2)} L/min`, 'VO₂ × Peso ÷ 1000'],
                    ],
                });
            },
        },
        {
            id: 'caminhada_3000m', grupo: 'caminhada', icone: '🚶‍♀️',
            nomeTecnico: 'Caminhada 3.000 m', nomeSimples: 'Caminhar 3 km',
            resumo: 'Caminhe 3 km e veja sua velocidade e quanto oxigênio usou.',
            duracao: '25–45 min', precisa: ['Cronômetro', 'Percurso plano de 3 km'],
            nivelIndicado: 'iniciante',
            oQueE: 'Você caminha 3 km em terreno plano, o mais rápido que conseguir sem correr. Mostramos sua velocidade média e quanto oxigênio (energia) seu corpo usou durante a caminhada.',
            passos: ['Aqueça por alguns minutos.', 'Caminhe 3.000 m (7,5 voltas numa pista de 400 m) em ritmo forte e constante.', 'Anote o tempo total.'],
            metodologia: 'Caminhada de 3.000 m em terreno plano, registrando o tempo. O VO₂ é calculado pela equação de caminhada do ACSM (componente horizontal): VO₂ = 0,1·v + 3,5, com v em m/min (válida de ~50 a 100 m/min). Atenção: a equação estima o custo de O₂ da caminhada naquela velocidade (submáximo), e não o VO₂máx.',
            inputs: [campo.tempo('Tempo para caminhar 3.000 m', 15, 90)],
            calcular(d) {
                const t = d.tempoSeg / 60;
                const v = 3000 / t;
                const vo2 = 0.1 * v + 3.5;
                return {
                    vo2Exercicio: vo2,
                    principal: { valor: num(v * 0.06, 1), unidade: 'km/h', rotulo: 'Sua velocidade média' },
                    classificacao: null,
                    aviso: v > 110 ? 'Sua velocidade passou de 110 m/min (6,6 km/h) — provavelmente você trotou em parte do percurso. A equação de caminhada vale para ~50 a 100 m/min.' : null,
                    nota: `Durante a caminhada seu corpo usou cerca de <strong>${num(vo2, 1)} ml/kg/min</strong> de oxigênio (≈ ${num(vo2 / 3.5, 1)} METs). Atenção: isso é o gasto <em>da caminhada</em>, não o seu VO₂máx — seu máximo é sempre maior. Para estimar o VO₂máx caminhando, use o teste de <a href="#/caminhada_1200m">1,2 km com batimentos</a>.`,
                    linhas: [
                        ['Tempo', `${num(t, 2)} min`, fmtTempo(d.tempoSeg)],
                        ['Velocidade média (v)', `${num(v, 1)} m/min (${num(v * 0.06, 1)} km/h)`, '3000 ÷ T'],
                        ['Fórmula (ACSM, caminhada)', '', '0,1 · v + 3,5'],
                        ['VO₂ da caminhada', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `0,1 × ${num(v, 1)} + 3,5`],
                        ['Observação', 'Custo submáximo', 'A equação do ACSM estima o VO₂ na velocidade de caminhada, não o VO₂máx'],
                    ],
                };
            },
        },
        {
            id: 'caminhada_4800m', grupo: 'caminhada', icone: '🥾',
            nomeTecnico: 'Caminhada 4.800 m (Cooper)', nomeSimples: 'Caminhar 4,8 km',
            resumo: 'Uma caminhada mais longa. Compara o seu tempo com o de pessoas da sua idade.',
            duracao: '35–60 min', precisa: ['Cronômetro', 'Percurso plano de 4,8 km'],
            nivelIndicado: 'iniciante',
            oQueE: 'Você caminha 4,8 km (3 milhas) sem correr. O seu tempo é comparado com uma tabela de pessoas do mesmo sexo e idade.',
            passos: ['Aqueça por alguns minutos.', 'Caminhe 4.800 m (12 voltas numa pista de 400 m) o mais rápido possível, sem correr.', 'Anote o tempo total.'],
            metodologia: 'Caminhada de 3 milhas (4.800 m) em terreno plano, sem correr. Classificação pela tabela normativa do The Cooper Institute (20 a 59 anos). Como complemento, mostra-se o custo de O₂ da caminhada pela equação do ACSM (submáximo, não é VO₂máx).',
            inputs: [campo.idade, campo.sexo, campo.tempo('Tempo para caminhar 4.800 m', 25, 120)],
            calcular(d) {
                const t = d.tempoSeg / 60;
                const v = 4800 / t;
                const vo2 = 0.1 * v + 3.5;
                const cls = classificar4800(d.tempoSeg, d.idade, d.sexo);
                return {
                    vo2Exercicio: vo2,
                    principal: { valor: fmtTempo(d.tempoSeg), unidade: '', rotulo: 'Seu tempo' },
                    classificacao: cls,
                    semTabela: cls ? null : 'A tabela de Cooper para este teste só vai de 20 a 59 anos, então não há classificação para a sua idade.',
                    nota: `Sua velocidade média foi de <strong>${num(v * 0.06, 1)} km/h</strong>, e durante a caminhada seu corpo usou cerca de ${num(vo2, 1)} ml/kg/min de oxigênio (≈ ${num(vo2 / 3.5, 1)} METs).`,
                    linhas: [
                        ['Tempo', fmtTempo(d.tempoSeg), 'Informado'],
                        ['Classificação (tabela Cooper)', cls ? `<strong>${cls.rotulo}</strong>` : '—', cls ? cls.referencia : 'Fora da faixa 20–59 anos'],
                        ['Velocidade média (v)', `${num(v, 1)} m/min (${num(v * 0.06, 1)} km/h)`, '4800 ÷ T'],
                        ['VO₂ da caminhada (ACSM)', `${num(vo2, 2)} ml/kg/min`, `0,1 × ${num(v, 1)} + 3,5 — custo submáximo, não é o VO₂máx`],
                    ],
                };
            },
        },
        {
            id: 'cooper_12min', grupo: 'corrida', icone: '⏱️',
            nomeTecnico: 'Andar e/ou correr 12 min (Cooper)', nomeSimples: 'O máximo em 12 minutos',
            resumo: 'O teste mais famoso: ande ou corra o máximo que puder em 12 minutos.',
            duracao: '12 min', precisa: ['Cronômetro', 'Pista ou percurso medido'],
            nivelIndicado: 'intermediario',
            oQueE: 'Durante 12 minutos você corre (ou alterna corrida e caminhada) tentando ir o mais longe possível. Quanto maior a distância, melhor o seu fôlego.',
            passos: ['Aqueça por 5 a 10 minutos.', 'Inicie o cronômetro e percorra a maior distância possível em 12 minutos. Pode caminhar se precisar.', 'Ao final, anote a distância (numa pista: voltas × 400 m + o pedaço da última volta).'],
            metodologia: 'Correr e/ou caminhar sem interrupção por 12 minutos, registrando a distância total. Equação de Cooper (1968): VO₂máx = (D − 504,9) ÷ 44,73. Classificação pela tabela de Cooper (20+ anos).',
            inputs: [campo.distancia(500, 5000), campo.idade, campo.sexo],
            calcular(d) {
                const vo2 = (d.distancia - 504.9) / 44.73;
                const cls = classificarCooper12(d.distancia, d.idade, d.sexo);
                return resultadoVO2(vo2, d, {
                    classificacao: cls || undefined,
                    linhas: [
                        ['Distância (D)', `${num(d.distancia, 0)} m`, 'Informada'],
                        ['Fórmula de Cooper', '', '(D − 504,9) ÷ 44,73'],
                        ['VO₂máx', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `(${num(d.distancia, 0)} − 504,9) ÷ 44,73`],
                        ['Classificação (tabela Cooper)', cls ? `<strong>${cls.rotulo}</strong>` : '—', cls ? cls.referencia : 'Tabela de Cooper só a partir de 20 anos'],
                    ],
                });
            },
        },
        {
            id: 'balke_15min', grupo: 'corrida', icone: '🏃',
            nomeTecnico: 'Corrida de Balke — 15 min', nomeSimples: 'Correr 15 minutos',
            resumo: 'Corra 15 minutos sem parar e anote a distância. Para quem já corre.',
            duracao: '15 min', precisa: ['Cronômetro', 'Pista ou percurso medido'],
            nivelIndicado: 'avancado',
            oQueE: 'Parecido com o de 12 minutos, mas mais longo e só correndo. Indicado para quem já tem costume de correr.',
            passos: ['Aqueça por 5 a 10 minutos.', 'Corra 15 minutos sem parar, em ritmo forte e constante.', 'Anote a distância total.'],
            metodologia: 'Corrida contínua de 15 minutos registrando a distância. Equação (Horwill, 1994, derivada de Balke): VO₂máx = 0,172 · (v − 133) + 33,3, com v = D ÷ 15 em m/min.',
            inputs: [campo.distancia(1000, 7000), campo.idadeOpc, campo.sexoOpc],
            calcular(d) {
                const v = d.distancia / 15;
                const vo2 = 0.172 * (v - 133) + 33.3;
                return resultadoVO2(vo2, d, {
                    linhas: [
                        ['Distância (D)', `${num(d.distancia, 0)} m`, 'Informada'],
                        ['Velocidade (v)', `${num(v, 1)} m/min (${num(v * 0.06, 1)} km/h)`, 'D ÷ 15'],
                        ['Fórmula (Balke/Horwill)', '', '0,172 · (v − 133) + 33,3'],
                        ['VO₂máx', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `0,172 × (${num(v, 1)} − 133) + 33,3`],
                    ],
                });
            },
        },
        {
            id: 'corrida_1000m', grupo: 'corrida', icone: '🏃‍♀️',
            nomeTecnico: 'Corrida de 1.000 m', nomeSimples: 'Correr 1 km',
            resumo: 'Corra 1 km o mais rápido possível, sem caminhar.',
            duracao: '3–8 min', precisa: ['Cronômetro', 'Percurso de 1.000 m'],
            nivelIndicado: 'intermediario',
            oQueE: 'Um teste curto e intenso: correr 1 km no menor tempo possível, sem parar para caminhar.',
            passos: ['Aqueça bem (5 a 10 minutos de trote leve).', 'Corra 1.000 m (2,5 voltas na pista) no menor tempo possível, sem caminhar.', 'Anote o tempo.'],
            metodologia: 'Percorrer 1.000 m no menor tempo possível, em ritmo contínuo. Equação de Klissouras (1973): VO₂máx = (652,17 − T) ÷ 6,762, com T em segundos.',
            inputs: [campo.tempo('Tempo para correr 1.000 m', 2, 15), campo.idadeOpc, campo.sexoOpc],
            calcular(d) {
                const vo2 = (652.17 - d.tempoSeg) / 6.762;
                return resultadoVO2(vo2, d, {
                    linhas: [
                        ['Tempo (T)', `${num(d.tempoSeg, 0)} s`, fmtTempo(d.tempoSeg)],
                        ['Fórmula (Klissouras)', '', '(652,17 − T) ÷ 6,762'],
                        ['VO₂máx', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `(652,17 − ${num(d.tempoSeg, 0)}) ÷ 6,762`],
                    ],
                });
            },
        },
        {
            id: 'cooper_2400m', grupo: 'corrida', icone: '🏅',
            nomeTecnico: 'Corrida de 2.400 m (Cooper)', nomeSimples: 'Correr 2,4 km',
            resumo: 'Corra 2,4 km (1,5 milha) no menor tempo possível.',
            duracao: '8–20 min', precisa: ['Cronômetro', 'Percurso de 2.400 m'],
            nivelIndicado: 'intermediario',
            oQueE: 'Você corre 2,4 km (6 voltas numa pista) o mais rápido que conseguir. Quanto menor o tempo, melhor o fôlego.',
            passos: ['Aqueça por 5 a 10 minutos.', 'Corra 2.400 m no menor tempo possível. Se precisar, pode caminhar um pouco.', 'Anote o tempo total.'],
            metodologia: 'Cronometrar o tempo para percorrer 2.400 m (1,5 milha). Equação: VO₂máx = 483 ÷ T + 3,5, com T em minutos.',
            inputs: [campo.tempo('Tempo para correr 2.400 m', 5, 40), campo.idade, campo.sexo],
            calcular(d) {
                const t = d.tempoSeg / 60;
                const vo2 = 483 / t + 3.5;
                return resultadoVO2(vo2, d, {
                    linhas: [
                        ['Tempo (T)', `${num(t, 2)} min`, `${fmtTempo(d.tempoSeg)} ÷ 60`],
                        ['Fórmula', '', '483 ÷ T + 3,5'],
                        ['VO₂máx', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `483 ÷ ${num(t, 2)} + 3,5`],
                    ],
                });
            },
        },
        {
            id: 'ribisl_kachodorian', grupo: 'corrida', icone: '🏃‍♂️',
            nomeTecnico: 'Corrida 3.200 m (Ribisl & Kachodorian)', nomeSimples: 'Correr 3,2 km',
            resumo: 'Corra 3,2 km (2 milhas) no menor tempo. Usa idade e peso no cálculo.',
            duracao: '12–25 min', precisa: ['Cronômetro', 'Percurso de 3.200 m', 'Balança'],
            nivelIndicado: 'avancado',
            oQueE: 'Uma corrida mais longa, de 3,2 km (8 voltas na pista). Além do tempo, a conta leva em conta sua idade e seu peso.',
            passos: ['Aqueça por 5 a 10 minutos.', 'Corra 3.200 m no menor tempo possível.', 'Anote o tempo total.'],
            metodologia: 'Percorrer 3.200 m (2 milhas) no menor tempo possível. Equação de Ribisl & Kachodorian (1969): VO₂máx = 114,496 − 0,04689·T − 0,37817·I − 0,15406·P, com T em segundos, I em anos e P em kg.',
            inputs: [campo.peso, campo.idade, campo.sexo, campo.tempo('Tempo para correr 3.200 m', 9, 45)],
            calcular(d) {
                const vo2 = 114.496 - 0.04689 * d.tempoSeg - 0.37817 * d.idade - 0.15406 * d.peso;
                return resultadoVO2(vo2, d, {
                    linhas: [
                        ['Tempo (T)', `${num(d.tempoSeg, 0)} s`, fmtTempo(d.tempoSeg)],
                        ['Fórmula', '', '114,496 − 0,04689·T − 0,37817·Idade − 0,15406·Peso'],
                        ['VO₂máx', `<strong>${num(vo2, 2)} ml/kg/min</strong>`, `114,496 − ${num(0.04689 * d.tempoSeg, 2)} − ${num(0.37817 * d.idade, 2)} − ${num(0.15406 * d.peso, 2)}`],
                    ],
                });
            },
        },
        {
            id: 'def_ritmo', grupo: 'ferramenta', icone: '📏',
            nomeTecnico: 'Andar, trotar e correr (ritmo)', nomeSimples: 'Estou andando ou correndo?',
            resumo: 'Informe quanto tempo leva para fazer 1 km e veja sua velocidade.',
            duracao: '—', precisa: ['Tempo para 1 km'],
            oQueE: 'O “ritmo” (ou pace) é quanto tempo você leva para percorrer 1 km. Com ele, mostramos a sua velocidade em km/h e se isso é considerado andar, trotar ou correr.',
            passos: ['Use o tempo médio que você leva para 1 km (o relógio ou o app de corrida mostram como “pace”).'],
            metodologia: 'Classificação pelo ritmo (min/km): até 5:34 = correr; até 7:27 = trotar; até 8:42 = andar/trotar; acima = andar. Velocidade = 3600 ÷ T(s) km/h.',
            inputs: [campo.tempo('Tempo para 1 km', 2, 30)],
            calcular(d) {
                const s = d.tempoSeg;
                const kmh = 3600 / s;
                const mmin = 1000 / (s / 60);
                const escala = ['Andar', 'Andar/Trotar', 'Trotar', 'Correr'];
                const nivel = s <= 334 ? 3 : s <= 447 ? 2 : s <= 522 ? 1 : 0;
                return {
                    principal: { valor: num(kmh, 1), unidade: 'km/h', rotulo: 'Sua velocidade' },
                    classificacao: { nivel, escala, rotulo: escala[nivel], referencia: 'segundo o seu ritmo por km', fonte: 'Faixas de ritmo do material de Medidas e Avaliação' },
                    tipo: 'ritmo',
                    linhas: [
                        ['Ritmo (pace)', `${fmtTempo(s)} por km`, 'Informado'],
                        ['Velocidade', `${num(mmin, 1)} m/min`, '1000 ÷ T(min)'],
                        ['Velocidade', `<strong>${num(kmh, 2)} km/h</strong>`, `3600 ÷ ${num(s, 0)} s`],
                        ['Classificação', `<strong>${escala[nivel]}</strong>`, 'Correr ≤ 5:34 · Trotar ≤ 7:27 · Andar/Trotar ≤ 8:42 · Andar > 8:42'],
                    ],
                };
            },
        },
        {
            id: 'def_mets', grupo: 'ferramenta', icone: '🔥',
            nomeTecnico: 'METs e gasto calórico (Kcal)', nomeSimples: 'Quantas calorias eu gasto?',
            resumo: 'Entenda o que são METs e calcule as calorias de uma atividade.',
            duracao: '—', precisa: ['Seu peso', 'Duração da atividade'],
            oQueE: '<strong>MET</strong> é uma forma simples de dizer quanto esforço uma atividade exige. 1 MET é o gasto de ficar sentado parado. Uma atividade de 4 METs gasta 4 vezes mais energia que o repouso.<br><br><strong>Kcal</strong> (quilocaloria) é a “caloria” dos rótulos de alimentos. Para cada litro de oxigênio que o corpo usa, ele gasta cerca de 5 kcal.',
            passos: ['Escolha a atividade, informe seu peso e por quantos minutos vai fazer.'],
            metodologia: '1 MET = 3,5 ml O₂·kg⁻¹·min⁻¹. 1 L de O₂ ≈ 5 kcal. Logo, kcal/min = MET × 3,5 × Peso ÷ 1000 × 5 = MET × 3,5 × Peso ÷ 200. Valores de MET aproximados do Compendium of Physical Activities.',
            inputs: [
                { id: 'atividade', label: 'Atividade', type: 'select', ajuda: 'Valores aproximados de MET para cada atividade.',
                    options: [
                        { value: '1.3', text: 'Sentado vendo TV (1,3 MET)' },
                        { value: '2.5', text: 'Tarefas leves de casa (2,5 MET)' },
                        { value: '3.5', text: 'Caminhada leve, 4 km/h (3,5 MET)' },
                        { value: '5', text: 'Caminhada rápida, 6 km/h (5 MET)' },
                        { value: '6', text: 'Musculação vigorosa (6 MET)' },
                        { value: '7', text: 'Pedalar moderado, 20 km/h (7 MET)' },
                        { value: '8.3', text: 'Correr a 8 km/h (8,3 MET)' },
                        { value: '9.8', text: 'Correr a 10 km/h (9,8 MET)' },
                        { value: '11.8', text: 'Correr a 12 km/h (11,8 MET)' },
                        { value: '7', text: 'Futebol recreativo (7 MET)' },
                        { value: '6', text: 'Natação moderada (6 MET)' },
                    ] },
                campo.peso,
                { id: 'minutos_ativ', label: 'Duração', unidade: 'min', type: 'number', min: 1, max: 600, ajuda: 'Por quantos minutos você faz a atividade.' },
            ],
            calcular(d) {
                const met = parseFloat(d.atividade);
                const kcalMin = met * 3.5 * d.peso / 200;
                const kcal = kcalMin * d.minutos_ativ;
                return {
                    principal: { valor: num(kcal, 0), unidade: 'kcal', rotulo: 'Gasto estimado' },
                    tipo: 'kcal', met, kcal,
                    linhas: [
                        ['Intensidade', `${num(met, 1)} METs`, 'Da atividade escolhida'],
                        ['Oxigênio por minuto', `${num(met * 3.5, 1)} ml/kg/min`, 'MET × 3,5'],
                        ['Gasto por minuto', `${num(kcalMin, 2)} kcal/min`, `${num(met, 1)} × 3,5 × ${num(d.peso, 1)} ÷ 200`],
                        ['Gasto total', `<strong>${num(kcal, 0)} kcal</strong>`, `${num(kcalMin, 2)} × ${num(d.minutos_ativ, 0)} min`],
                    ],
                };
            },
        },
    ];

    // ---------- leitura e validação dos dados ----------
    function lerNumero(txt) {
        if (txt === undefined || txt === null) return NaN;
        const limpo = String(txt).trim().replace(',', '.');
        return limpo === '' ? NaN : Number(limpo);
    }

    /** valores: { id: string } brutos do formulário. Retorna { dados } ou { erros: {campo: msg} } */
    function validar(teste, valores) {
        const dados = {};
        const erros = {};
        for (const c of teste.inputs) {
            if (c.type === 'time') {
                const m = lerNumero(valores.minutos);
                const s = valores.segundos === '' || valores.segundos === undefined ? 0 : lerNumero(valores.segundos);
                if (isNaN(m)) { erros.tempo = 'Informe os minutos.'; continue; }
                if (isNaN(s) || s < 0 || s >= 60) { erros.tempo = 'Os segundos devem ficar entre 0 e 59.'; continue; }
                if (m < 0) { erros.tempo = 'O tempo não pode ser negativo.'; continue; }
                const total = m * 60 + s;
                if (total < c.minMin * 60 || total > c.maxMin * 60) {
                    erros.tempo = `Esse tempo parece fora do comum para este teste (esperado entre ${c.minMin} e ${c.maxMin} minutos). Confira os números.`;
                    continue;
                }
                dados.tempoSeg = total;
            } else if (c.type === 'select') {
                const v = valores[c.id];
                if (!v && !c.opcional) { erros[c.id] = 'Escolha uma opção.'; continue; }
                dados[c.id] = v || null;
            } else {
                const v = lerNumero(valores[c.id]);
                if (isNaN(v)) {
                    if (c.opcional) { dados[c.id] = null; continue; }
                    erros[c.id] = `Informe ${c.label.toLowerCase()}.`; continue;
                }
                if (v < c.min || v > c.max) {
                    erros[c.id] = `Use um valor entre ${c.min} e ${c.max}${c.unidade ? ' ' + c.unidade : ''}.`; continue;
                }
                dados[c.id] = v;
            }
        }
        return Object.keys(erros).length ? { erros } : { dados };
    }

    // ---------- interpretação em linguagem simples ----------
    function explicarVO2(vo2) {
        const mets = vo2 / 3.5;
        const atividades = [
            ['caminhar devagar', 3], ['caminhar rápido', 5], ['pedalar em ritmo moderado', 7],
            ['correr a 8 km/h', 8.3], ['correr a 10 km/h', 9.8], ['correr a 12 km/h', 11.8], ['correr a 16 km/h', 14.5],
        ];
        // Em esforço confortável e prolongado usamos cerca de 60% da capacidade máxima.
        const confortavel = mets * 0.6;
        const tranquilas = atividades.filter(([, m]) => m <= confortavel).map(([n]) => n);
        return { mets, confortavel, tranquilas };
    }

    const MENSAGENS_NIVEL = {
        baixo: 'Seu condicionamento está abaixo do esperado para a sua idade. Não é motivo de alarme — é um ponto de partida. Caminhadas regulares já trazem melhora perceptível em poucas semanas.',
        medio: 'Você está na média das pessoas da sua idade. Com 150 minutos por semana de atividade moderada, dá para subir de nível.',
        alto: 'Ótimo! Seu fôlego está acima da maioria das pessoas da sua idade. Manter a regularidade é o que preserva esse resultado.',
    };

    function faixaMensagem(cls) {
        if (!cls) return null;
        const frac = cls.nivel / (cls.escala.length - 1);
        return frac < 0.4 ? 'baixo' : frac <= 0.6 ? 'medio' : 'alto';
    }

    // ---------- textos para o arquivo .txt ----------
    function textoParaSalvar(teste, d, r) {
        const linhas = [];
        linhas.push(`Resultado — ${teste.nomeTecnico}`);
        linhas.push('='.repeat(40));
        linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
        linhas.push('');
        linhas.push('Dados informados:');
        for (const c of teste.inputs) {
            if (c.type === 'time') linhas.push(`- ${c.label}: ${fmtTempo(d.tempoSeg)}`);
            else if (c.type === 'select') {
                const op = c.options.find((o) => o.value === d[c.id]);
                if (d[c.id]) linhas.push(`- ${c.label}: ${op ? op.text : d[c.id]}`);
            } else if (d[c.id] !== null && d[c.id] !== undefined) linhas.push(`- ${c.label}: ${num(d[c.id], c.step ? 1 : 0)}${c.unidade ? ' ' + c.unidade : ''}`);
        }
        linhas.push('');
        linhas.push('Resultado:');
        linhas.push(`- ${r.principal.rotulo}: ${r.principal.valor} ${r.principal.unidade}`);
        if (r.classificacao) linhas.push(`- Classificação: ${r.classificacao.rotulo} (${r.classificacao.referencia})`);
        if (r.vo2 && !r.vo2Exercicio) linhas.push(`- Equivale a ${num(r.vo2 / 3.5, 1)} METs (capacidade máxima)`);
        linhas.push('');
        linhas.push('Cálculo:');
        for (const [p, v, c] of r.linhas) linhas.push(`- ${p}: ${String(v).replace(/<[^>]+>/g, '')}${c ? `  [${c}]` : ''}`);
        linhas.push('');
        linhas.push('Observação: estimativa por teste de campo, não substitui avaliação profissional.');
        return linhas.join('\n');
    }

    const AF = {
        testes, validar, explicarVO2, faixaMensagem, MENSAGENS_NIVEL, textoParaSalvar,
        classificarVO2, classificarCooper12, classificar4800, num, fmtTempo, lerNumero,
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = AF;
    else global.AF = AF;
})(typeof window !== 'undefined' ? window : globalThis);
