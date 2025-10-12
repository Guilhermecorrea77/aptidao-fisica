document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');

    // ===============================================================
    // == BANCO DE DADOS DE TODOS OS TESTES E DEFINIÇÕES ==
    // ===============================================================

    const pages = {
        'menu': {
            title: 'Escolha abaixo o teste que você preferir:',
            isMenu: true,
            items: [
                { id: 'caminhada_1200m', name: 'Caminhada 1.200 m' }, { id: 'caminhada_3000m', name: 'Caminhada 3.000 m' }, { id: 'ribisl_kachodorian', name: 'Corrida de Ribisl & Kachodorian' }, { id: 'caminhada_4800m', name: 'Andar 4.800 m (Cooper)' }, { id: 'cooper_12min', name: 'Andar e/ou correr em 12\'' }, { id: 'corrida_1000m', name: 'Corrida de 1.000 m' }, { id: 'balke_15min', name: 'Corrida de Balke - 15\'' }, { id: 'cooper_2400m', name: 'Corrida de 2.400 m (Cooper)' }, { id: 'def_mets', name: 'Definição: METs', isDef: true }, { id: 'def_kcal', name: 'Definição: Kcal', isDef: true }, { id: 'def_ritmo', name: 'Definição: Andar, Trotar e Correr', isDef: true },
            ]
        },
        'caminhada_1200m': {
            title: 'Teste de caminhada 1.200 metros',
            methodology: `O avaliado caminha 1.200 metros no menor tempo possível. Ao final, a frequência cardíaca é medida imediatamente. Este teste é ideal para iniciantes.<br><small>Nota: A fórmula utilizada é baseada no Teste de Rockport (1 milha), um dos protocolos mais validados que utiliza estas variáveis.</small>`,
            inputs: [
                { id: 'peso', label: 'Peso (Kg)', type: 'number' }, { id: 'idade', label: 'Idade (anos)', type: 'number' }, { id: 'sexo', label: 'Sexo', type: 'select', options: [{ value: '1', text: 'Masculino' }, { value: '0', text: 'Feminino' }] }, { id: 'tempo', label: 'Tempo total', type: 'time' }, { id: 'fc', label: 'FC Final (bpm)', type: 'number' },
            ],
            calculation: (data) => {
                const { peso, idade, sexo, minutos, segundos, fc } = data;
                if (!peso || !idade || sexo === undefined || (!minutos && !segundos) || !fc) return { error: 'Preencha todos os dados.' };
                const tempoDecimal = minutos + (segundos / 60);
                const vo2max_relativo = 132.853 - (0.1692 * peso) - (0.3877 * idade) + (6.315 * sexo) - (3.2649 * tempoDecimal) - (0.1565 * fc);
                const vo2max_absoluto = (vo2max_relativo * peso) / 1000;
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th></tr>
                        <tr><td>Inputs</td><td>Peso: ${peso}kg, Idade: ${idade}, Sexo: ${sexo==1?'M':'F'}, Tempo: ${minutos}m ${segundos}s, FC: ${fc}bpm</td></tr>
                        <tr><td>Fórmula VO₂máx Relativo</td><td>132.853 - (0.1692 * P) - (0.3877 * I) + (6.315 * S) - (3.2649 * T) - (0.1565 * FC)</td></tr>
                        <tr><td>Resultado Relativo</td><td><strong>${vo2max_relativo.toFixed(2)} ml/kg/min</strong></td></tr>
                        <tr><td>Fórmula VO₂máx Absoluto</td><td>(VO₂máx Relativo * Peso) / 1000</td></tr>
                        <tr><td>Resultado Absoluto</td><td><strong>${vo2max_absoluto.toFixed(2)} L/min</strong></td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Caminhada 1.200m\n----------------------------------\nInputs:\n- Peso: ${peso} kg\n- Idade: ${idade} anos\n- Sexo: ${sexo==1?'Masculino':'Feminino'}\n- Tempo: ${minutos}m ${segundos}s\n- FC Final: ${fc} bpm\n\nResultados:\n- VO₂máx Relativo: ${vo2max_relativo.toFixed(2)} ml/kg/min\n- VO₂máx Absoluto: ${vo2max_absoluto.toFixed(2)} L/min`;
                return { text: `<strong>VO₂máx Relativo:</strong> ${vo2max_relativo.toFixed(2)} ml/kg/min`, className: '', table, saveText };
            }
        },
        'caminhada_3000m': {
            title: 'Teste de caminhada de 3.000 metros',
            methodology: 'O avaliado deve caminhar em terreno plano, registrando o tempo necessário para completar 3.000 metros.',
            inputs: [ { id: 'tempo', label: 'Tempo total', type: 'time' } ],
            calculation: (data) => {
                const { minutos, segundos } = data;
                if (minutos === 0 && segundos === 0) return { error: 'Insira um tempo válido.'};
                const tempoDecimal = minutos + (segundos / 60);
                const velocidade_m_min = 3000 / tempoDecimal;
                const vo2max = (0.1 * velocidade_m_min) + 3.5;
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th><th>Cálculo</th></tr>
                        <tr><td>Tempo Total</td><td>${minutos}m ${segundos}s</td><td>Input do usuário</td></tr>
                        <tr><td>Velocidade Média</td><td>${velocidade_m_min.toFixed(2)} m/min</td><td>3000m / ${tempoDecimal.toFixed(2)}min</td></tr>
                        <tr><td>Fórmula VO₂máx</td><td colspan="2">(Velocidade * 0.1) + 3.5</td></tr>
                        <tr><td>Cálculo Final</td><td><strong>${vo2max.toFixed(2)} ml/kg/min</strong></td><td>(${velocidade_m_min.toFixed(2)} * 0.1) + 3.5</td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Caminhada 3.000m\n----------------------------------\nInput:\n- Tempo: ${minutos}m ${segundos}s\n\nResultado:\n- VO₂máx Estimado: ${vo2max.toFixed(2)} ml/kg/min`;
                return { text: `<strong>VO₂máx estimado:</strong> ${vo2max.toFixed(2)} ml/kg/min`, className: '', table, saveText };
            }
        },
        'ribisl_kachodorian': {
            title: 'Teste de Corrida de Ribisl & Kachodorian (3.200m)',
            methodology: 'Percorrer a distância de 3.200 metros no menor tempo possível. Fórmulas para este teste frequentemente usam idade e peso para refinar a estimativa de VO₂máx. <br><small>Nota: Usamos aqui uma fórmula validada (George et al., 1993) para corrida que utiliza estas variáveis para dar um resultado funcional.</small>',
            inputs: [
                { id: 'peso', label: 'Peso (Kg)', type: 'number' }, { id: 'idade', label: 'Idade (anos)', type: 'number' }, { id: 'sexo', label: 'Sexo', type: 'select', options: [{ value: '1', text: 'Masculino' }, { value: '0', text: 'Feminino' }] }, { id: 'tempo', label: 'Tempo total', type: 'time' },
            ],
            calculation: (data) => {
                 const { peso, idade, sexo, minutos, segundos } = data;
                if (!peso || !idade || sexo === undefined || (minutos === 0 && segundos === 0)) return { error: 'Preencha todos os dados.' };
                const tempoDecimal = minutos + (segundos / 60);
                const vo2max = 108.844 - (0.1636 * peso) - (1.437 * tempoDecimal) - (0.1928 * idade) + (8.344 * sexo);
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th></tr>
                        <tr><td>Inputs</td><td>Peso: ${peso}kg, Idade: ${idade}, Sexo: ${sexo==1?'M':'F'}, Tempo: ${minutos}m ${segundos}s</td></tr>
                        <tr><td>Fórmula VO₂máx</td><td>108.844 - (0.1636*P) - (1.437*T) - (0.1928*I) + (8.344*S)</td></tr>
                        <tr><td>Cálculo Final</td><td><strong>${vo2max.toFixed(2)} ml/kg/min</strong></td></tr>
                    </table>`;
                const saveText = `Resultado - Teste Ribisl & Kachodorian\n----------------------------------\nInputs:\n- Peso: ${peso} kg\n- Idade: ${idade} anos\n- Sexo: ${sexo==1?'Masculino':'Feminino'}\n- Tempo: ${minutos}m ${segundos}s\n\nResultado:\n- VO₂máx Estimado: ${vo2max.toFixed(2)} ml/kg/min`;
                return { text: `<strong>VO₂máx estimado:</strong> ${vo2max.toFixed(2)} ml/kg/min`, className: '', table, saveText };
            }
        },
        'caminhada_4800m': {
            title: 'Teste de andar 4.800 metros (Cooper)',
            methodology: 'O indivíduo deverá caminhar uma distância de 4.800 metros em terreno plano, tendo seu tempo cronometrado para posterior classificação.',
            inputs: [
                { id: 'idade', label: 'Idade (anos)', type: 'number' }, { id: 'sexo', label: 'Sexo', type: 'select', options: [{ value: 'M', text: 'Masculino' }, { value: 'F', text: 'Feminino' }] }, { id: 'tempo', label: 'Tempo total', type: 'time' },
            ],
            calculation: (data) => {
                const { idade, sexo, minutos, segundos } = data;
                if (!idade || !sexo || (minutos === 0 && segundos === 0)) return { error: 'Preencha todos os dados.' };
                const tempoTotal = minutos + (segundos / 60);
                let classificacao = 'Não classificado para esta faixa etária.';
                if (sexo === 'M') {
                    if (idade >= 20 && idade <= 29) {
                        if (tempoTotal < 35.5) classificacao = 'Excelente'; else if (tempoTotal <= 39) classificacao = 'Bom'; else if (tempoTotal <= 43) classificacao = 'Regular'; else if (tempoTotal <= 47) classificacao = 'Ruim'; else classificacao = 'Muito Ruim';
                    } // Adicionar outras faixas
                } else {
                    if (idade >= 20 && idade <= 29) {
                        if (tempoTotal < 38) classificacao = 'Excelente'; else if (tempoTotal <= 42) classificacao = 'Bom'; else if (tempoTotal <= 46) classificacao = 'Regular'; else if (tempoTotal <= 50) classificacao = 'Ruim'; else classificacao = 'Muito Ruim';
                    } // Adicionar outras faixas
                }
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th></tr>
                        <tr><td>Inputs</td><td>Idade: ${idade}, Sexo: ${sexo}, Tempo: ${minutos}m ${segundos}s</td></tr>
                        <tr><td>Método</td><td>Comparação com tabela de referência por idade e sexo.</td></tr>
                        <tr><td>Resultado</td><td><strong>${classificacao}</strong></td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Caminhada 4.800m\n----------------------------------\nInputs:\n- Idade: ${idade} anos\n- Sexo: ${sexo}\n- Tempo: ${minutos}m ${segundos}s\n\nResultado:\n- Classificação: ${classificacao}`;
                return { text: `<strong>Classificação:</strong> ${classificacao}`, className: '', table, saveText };
            }
        },
        'cooper_12min': {
            title: 'Teste de andar / correr em 12 minutos (Cooper)',
            methodology: `O avaliado deverá correr/ou caminhar sem interrupção durante 12 minutos, sendo registrada a distância total percorrida. A forma ideal é manter uma velocidade constante.`,
            inputs: [
                { id: 'idade', label: 'Idade (anos)', type: 'number' }, { id: 'sexo', label: 'Sexo', type: 'select', options: [{ value: 'M', text: 'Masculino' }, { value: 'F', text: 'Feminino' }] }, { id: 'distancia', label: 'Distância percorrida (metros)', type: 'number' },
            ],
            calculation: (data) => {
                const { idade, sexo, distancia } = data;
                if (!idade || !sexo || !distancia) return { error: 'Preencha todos os dados.' };
                const vo2max = (distancia - 504.9) / 44.73;
                let classificacao = 'Não classificado para esta faixa etária.';
                if (sexo === 'M' && idade >= 30 && idade <= 39) { if (distancia > 2700) classificacao = 'Excelente'; else if (distancia >= 2300) classificacao = 'Bom'; else if (distancia >= 1900) classificacao = 'Regular'; else if (distancia >= 1500) classificacao = 'Ruim'; else classificacao = 'Muito Ruim'; }
                if (sexo === 'F' && idade >= 30 && idade <= 39) { if (distancia > 2500) classificacao = 'Excelente'; else if (distancia >= 2100) classificacao = 'Bom'; else if (distancia >= 1700) classificacao = 'Regular'; else if (distancia >= 1400) classificacao = 'Ruim'; else classificacao = 'Muito Ruim'; }
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th><th>Cálculo</th></tr>
                        <tr><td>Distância Total</td><td>${distancia} metros</td><td>Input do usuário</td></tr>
                        <tr><td>Fórmula VO₂máx</td><td colspan="2">(Distância - 504.9) / 44.73</td></tr>
                        <tr><td>Cálculo VO₂máx</td><td>${vo2max.toFixed(2)} ml/kg/min</td><td>(${distancia} - 504.9) / 44.73</td></tr>
                        <tr><td>Classificação</td><td colspan="2"><strong>${classificacao}</strong> (para ${sexo}, ${idade} anos)</td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Cooper 12min\n----------------------------------\nInputs:\n- Idade: ${idade} anos\n- Sexo: ${sexo}\n- Distância: ${distancia}m\n\nResultados:\n- VO₂máx Estimado: ${vo2max.toFixed(2)} ml/kg/min\n- Classificação: ${classificacao}`;
                return { text: `<strong>VO₂máx:</strong> ${vo2max.toFixed(2)} ml/kg/min<br><strong>Classificação:</strong> ${classificacao}`, className: '', table, saveText };
            }
        },
        'corrida_1000m': {
            title: 'Teste de Corrida de 1.000 metros',
            methodology: 'Percorrer a distância de 1.000 metros no menor tempo possível, em ritmo contínuo. Não é permitido caminhar.',
            inputs: [ { id: 'tempo', label: 'Tempo total', type: 'time' } ],
            calculation: (data) => {
                const { minutos, segundos } = data;
                if (minutos === 0 && segundos === 0) return { error: 'Insira um tempo válido.'};
                const tempoTotalSegundos = (minutos * 60) + segundos;
                const vo2max = 71.056 - (0.084 * tempoTotalSegundos);
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th><th>Cálculo</th></tr>
                        <tr><td>Tempo Total</td><td>${minutos}m ${segundos}s</td><td>Input do usuário</td></tr>
                        <tr><td>Tempo em Segundos</td><td>${tempoTotalSegundos} s</td><td>(${minutos} * 60) + ${segundos}</td></tr>
                        <tr><td>Fórmula VO₂máx</td><td colspan="2">71.056 - (0.084 * Tempo em Segundos)</td></tr>
                        <tr><td>Cálculo Final</td><td><strong>${vo2max.toFixed(2)} ml/kg/min</strong></td><td>71.056 - (0.084 * ${tempoTotalSegundos})</td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Corrida 1.000m\n----------------------------------\nInput:\n- Tempo: ${minutos}m ${segundos}s\n\nResultado:\n- VO₂máx Estimado: ${vo2max.toFixed(2)} ml/kg/min`;
                return { text: `<strong>VO₂máx estimado:</strong> ${vo2max.toFixed(2)} ml/kg/min`, className: '', table, saveText };
            }
        },
        'balke_15min': {
            title: 'Teste de corrida de Balke - 15 minutos',
            methodology: 'O indivíduo deverá correr sem interrupção durante 15 minutos, sendo registrada a distância total percorrida.',
            inputs: [ { id: 'distancia', label: 'Distância percorrida (metros)', type: 'number' } ],
            calculation: (data) => {
                const { distancia } = data;
                if (!distancia) return { error: 'Insira a distância percorrida.' };
                const velocidade_m_min = distancia / 15;
                const vo2max = (velocidade_m_min * 0.2) + 3.5;
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th><th>Cálculo</th></tr>
                        <tr><td>Distância Total</td><td>${distancia} metros</td><td>Input do usuário</td></tr>
                        <tr><td>Velocidade Média</td><td>${velocidade_m_min.toFixed(2)} m/min</td><td>${distancia} / 15</td></tr>
                        <tr><td>Fórmula VO₂máx</td><td colspan="2">(Velocidade * 0.2) + 3.5</td></tr>
                        <tr><td>Cálculo Final</td><td><strong>${vo2max.toFixed(2)} ml/kg/min</strong></td><td>(${velocidade_m_min.toFixed(2)} * 0.2) + 3.5</td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Balke (15 min)\n----------------------------------\nInput:\n- Distância: ${distancia} metros\n\nResultado:\n- VO₂máx Estimado: ${vo2max.toFixed(2)} ml/kg/min`;
                return { text: `<strong>VO₂máx estimado:</strong> ${vo2max.toFixed(2)} ml/kg/min`, className: '', table, saveText };
            }
        },
        'cooper_2400m': {
            title: 'Teste de corrida de 2400 metros (Cooper)',
            methodology: 'O teste consiste em cronometrar o tempo gasto pelo avaliado para percorrer a distância de 2400 metros.',
            inputs: [
                { id: 'idade', label: 'Idade (anos)', type: 'number' }, { id: 'sexo', label: 'Sexo', type: 'select', options: [{ value: 'M', text: 'Masculino' }, { value: 'F', text: 'Feminino' }] }, { id: 'tempo', label: 'Tempo total', type: 'time' },
            ],
            calculation: (data) => {
                const { idade, sexo, minutos, segundos } = data;
                if (!idade || !sexo || (minutos === 0 && segundos === 0)) return { error: 'Preencha todos os dados corretamente.'};
                const tempoDecimal = minutos + (segundos / 60);
                const vo2max = (483 / tempoDecimal) + 3.5;
                const table = `
                    <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th><th>Cálculo</th></tr>
                        <tr><td>Tempo Total</td><td>${minutos}m ${segundos}s</td><td>Input do usuário</td></tr>
                        <tr><td>Tempo em Minutos Decimais</td><td>${tempoDecimal.toFixed(2)}</td><td>${minutos} + (${segundos} / 60)</td></tr>
                        <tr><td>Fórmula VO₂máx</td><td colspan="2">(483 / Tempo em Minutos) + 3.5</td></tr>
                        <tr><td>Cálculo Final</td><td><strong>${vo2max.toFixed(2)} ml/kg/min</strong></td><td>(483 / ${tempoDecimal.toFixed(2)}) + 3.5</td></tr>
                    </table>`;
                const saveText = `Resultado - Teste de Corrida 2400m (Cooper)\n-------------------------------------------\nInputs:\n- Idade: ${idade} anos\n- Sexo: ${sexo}\n- Tempo: ${minutos}m ${segundos}s\n\nResultado Final:\n- VO₂máx Estimado: ${vo2max.toFixed(2)} ml/kg/min`;
                return { text: `<strong>VO₂máx estimado:</strong> ${vo2max.toFixed(2)} ml/kg/min`, className: '', table, saveText };
            }
        },
        'def_mets': { title: 'Definição: METs (Equivalente Metabólico)', isDefinition: true, content: `<p>O MET representa o consumo de O2 em repouso. É um parâmetro fisiológico, muito comum na avaliação funcional, que expressa o gasto metabólico do organismo.</p><p>Um (1) MET equivale ao gasto energético de ficar sentado em repouso.</p><div id="resultado" style="margin-top:1rem; text-align:center;"><strong>1 MET = 3,5 ml.kg⁻¹.min⁻¹</strong></div><p style="margin-top:1rem;">Atividades são medidas em múltiplos de METs. Por exemplo, uma atividade de 4 METs gasta 4 vezes mais energia que o repouso.</p>` },
        'def_kcal': { title: 'Definição: Kcal (Quilocaloria)', isDefinition: true, content: `<p>A captação de oxigênio pode ser convertida a um valor correspondente de gasto energético. O valor prático utilizado é:</p><div id="resultado" style="margin-top:1rem; text-align:center;"><strong>1 Litro de O₂ consumido ≈ 5 Kcal de energia gasta</strong></div><p style="margin-top:1rem;">Essa relação permite calcular o gasto calórico de uma atividade medindo-se o consumo de oxigênio (VO₂). A "Caloria" de alimentos e exercícios é, na verdade, uma Quilocaloria (Kcal).</p>` },
        'def_ritmo': {
            title: 'Definições de Andar, Trotar e Correr',
            methodology: 'Insira o tempo que você leva para completar 1 Km para classificar seu ritmo e calcular sua velocidade.',
            inputs: [ { id: 'tempo', label: 'Tempo para 1 Km', type: 'time' } ],
            calculation: (data) => {
                const { minutos, segundos } = data;
                if ((!minutos && !segundos) || (minutos === 0 && segundos === 0)) return { error: 'Insira um tempo válido.'};
                const tempoTotalSegundos = (minutos * 60) + segundos;
                const velocidadeKmh = 3600 / tempoTotalSegundos;
                const velocidadeMmin = 1000 / (minutos + segundos / 60);
                let classificacao = '';
                if (tempoTotalSegundos <= 334) classificacao = 'Correr'; else if (tempoTotalSegundos <= 447) classificacao = 'Trotar'; else if (tempoTotalSegundos <= 522) classificacao = 'Andar/Trotar'; else classificacao = 'Andar';
                const table = `
                     <table class="calculation-table">
                        <tr><th>Parâmetro</th><th>Valor</th><th>Cálculo</th></tr>
                        <tr><td>Ritmo (Pace)</td><td>${minutos}m ${segundos}s /km</td><td>Input do usuário</td></tr>
                        <tr><td>Velocidade (m/min)</td><td>${velocidadeMmin.toFixed(2)} m/min</td><td>1000 / (${minutos} + ${segundos}/60)</td></tr>
                        <tr><td>Velocidade (km/h)</td><td>${velocidadeKmh.toFixed(2)} km/h</td><td>3600 / (${minutos}*60 + ${segundos})</td></tr>
                        <tr><td>Classificação</td><td colspan="2"><strong>${classificacao}</strong></td></tr>
                    </table>`;
                const saveText = `Análise de Ritmo\n----------------------------------\nInput:\n- Ritmo: ${minutos}m ${segundos}s por km\n\nResultados:\n- Classificação: ${classificacao}\n- Velocidade: ${velocidadeKmh.toFixed(2)} km/h`;
                return { text: `<strong>Classificação:</strong> ${classificacao}<br><strong>Velocidade:</strong> ${velocidadeKmh.toFixed(2)} Km/h`, className: '', table, saveText };
            }
        },
    };

    function renderPage(pageId) {
        const page = pages[pageId];
        let html = `<h2>${page.title}</h2>`;
        if (page.isMenu) {
            html += `<div id="menu-principal">`;
            page.items.forEach(item => { html += `<a href="#" class="menu-item ${item.isDef ? 'definicao' : ''}" data-page="${item.id}">${item.name}</a>`; });
            html += `</div>`;
        } else {
            if (page.isDefinition) { html += `<div class="card">${page.content}</div>`; } 
            else {
                html += `<div class="card"><p>${page.methodology}</p></div>`;
                if (page.inputs) {
                    html += `<div class="card"><div class="calculator-grid">`;
                    page.inputs.forEach(input => {
                        html += `<div class="form-group"><label for="${input.id}">${input.label}</label>`;
                        if (input.type === 'select') {
                            html += `<select id="${input.id}">`;
                            input.options.forEach(opt => { html += `<option value="${opt.value}">${opt.text}</option>`; });
                            html += `</select>`;
                        } else if (input.type === 'time') {
                            html += `<div class="time-inputs"><input type="number" id="minutos" placeholder="Min" min="0"><input type="number" id="segundos" placeholder="Seg" min="0" max="59"></div>`;
                        } else { html += `<input type="${input.type}" id="${input.id}" min="0">`; }
                        html += `</div>`;
                    });
                    html += `</div><button id="calculateBtn" class="btn-calc">Calcular</button><div id="resultado-wrapper"></div></div>`;
                }
            }
            html += `<button class="btn-voltar" data-page="menu">‹ Voltar ao Menu</button>`;
        }
        mainContent.innerHTML = html;
        addEventListeners(pageId);
    }
    function addEventListeners(pageId) {
        if (pageId === 'menu') {
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo(0, 0); renderPage(e.target.dataset.page); });
            });
        } else {
            document.querySelector('.btn-voltar').addEventListener('click', (e) => { e.preventDefault(); window.scrollTo(0, 0); renderPage('menu'); });
            const calculateBtn = document.getElementById('calculateBtn');
            if (calculateBtn) {
                calculateBtn.addEventListener('click', () => {
                    const page = pages[pageId];
                    const data = {};
                    page.inputs.forEach(input => {
                        if (input.type === 'time') {
                           data.minutos = parseFloat(document.getElementById('minutos').value) || 0;
                           data.segundos = parseFloat(document.getElementById('segundos').value) || 0;
                        } else {
                           let element = document.getElementById(input.id);
                           data[input.id] = element.value;
                           if (input.type === 'number' || element.tagName === 'SELECT') data[input.id] = parseFloat(data[input.id]);
                        }
                    });
                    const result = page.calculation(data);
                    const resultadoWrapper = document.getElementById('resultado-wrapper');
                    if (result.error) {
                        resultadoWrapper.innerHTML = `<div id="resultado" class="resultado-erro">${result.error}</div>`;
                    } else {
                        resultadoWrapper.innerHTML = `<div id="resultado" class="${result.className}">${result.text}</div> ${result.table || ''} <button id="saveBtn" class="btn-save">Salvar Resultado (.txt)</button>`;
                        document.getElementById('saveBtn').addEventListener('click', () => {
                            const blob = new Blob([result.saveText], { type: 'text/plain;charset=utf-8' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `resultado_${pageId}.txt`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                    }
                });
            }
        }
    }
    renderPage('menu');
});