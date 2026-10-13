# 🏃 Aptidão Física — Calculadora de Avaliação Física

**Acesse:** https://guilhermecorrea77.github.io/aptidao-fisica/

Aplicativo web que reúne testes clássicos de aptidão cardiorrespiratória (caminhada e corrida) e conceitos de Educação Física. Você faz o teste na pista ou no parque, digita o resultado e o app calcula **e explica o que ele significa**.

Atende dois públicos com um clique:

| 🙂 **Linguagem simples** | 🎓 **Técnico** |
|---|---|
| Para quem não é da área: nomes do dia a dia (“Caminhar 1,2 km”), explicação do que é cada teste, passo a passo, dicas em cada campo e interpretação do resultado (“seu fôlego está acima da média para a sua idade”). | Para estudantes e professores: nome do protocolo, metodologia, equação com referência e a tabela completa com cada etapa do cálculo. |

---

## ✨ Funcionalidades

### Testes
| Teste | O que calcula | Equação / referência |
|---|---|---|
| 🚶 Caminhada 1.200 m | VO₂máx (peso, idade, sexo, tempo, FC) | Rockport (Kline et al., 1987), com tempo projetado para 1 milha |
| 🚶‍♀️ Caminhada 3.000 m | Velocidade e custo de O₂ da caminhada | ACSM (caminhada) — *submáximo, não é VO₂máx* |
| 🥾 Caminhada 4.800 m | Classificação por idade e sexo | Tabela do The Cooper Institute (20–59 anos) |
| ⏱️ Andar/correr 12 min | VO₂máx + classificação | Cooper (1968): (D − 504,9) ÷ 44,73 |
| 🏃 Balke 15 min | VO₂máx | 0,172 · (v − 133) + 33,3 (Balke/Horwill) |
| 🏃‍♀️ Corrida 1.000 m | VO₂máx | Klissouras (1973): (652,17 − T) ÷ 6,762 |
| 🏅 Corrida 2.400 m | VO₂máx | 483 ÷ T + 3,5 |
| 🏃‍♂️ Corrida 3.200 m | VO₂máx | Ribisl & Kachodorian (1969): 114,496 − 0,04689·T − 0,37817·I − 0,15406·P |

### Ferramentas
- 📏 **Estou andando ou correndo?** — ritmo (pace) → velocidade e classificação.
- 🔥 **Quantas calorias eu gasto?** — explica METs e kcal e calcula o gasto de uma atividade.

### Recursos
- **Modo simples / técnico**, lembrado entre visitas.
- **Guia “Não sabe qual escolher?”**, que destaca os testes certos para o seu nível.
- **Classificação visual** (régua colorida) comparando com pessoas do mesmo sexo e faixa etária.
- **“O que isso significa?”**: VO₂máx convertido em METs e em atividades do dia a dia.
- **💬 Assistente de texto** que tira dúvidas (qual teste fazer, como medir os batimentos, segurança, como melhorar, o que significa meu resultado…). Funciona sem internet e sem custo.
- **Validação dos dados** com mensagens claras (ex.: segundos acima de 59, valores fora do comum).
- **Salvar (.txt)** e **Copiar** o resultado, com data, dados e cálculo.
- Aviso de **segurança** antes dos testes.
- Links diretos para cada teste (ex.: `#/cooper_12min`), botão voltar do navegador funcionando.
- Acessível (rótulos, navegação por teclado, `aria-live`) e responsivo para celular.

---

## 🔧 Correções feitas nos cálculos (out/2026)

| Teste | Problema | Correção |
|---|---|---|
| Corrida 3.200 m | Usava uma equação de George et al. feita para 1,5 milha; quem corria em 14 min recebia VO₂ ≈ 79 (nível de atleta de elite) | Equação de Ribisl & Kachodorian (T em segundos) |
| Corrida 1.000 m | Equação `71,056 − 0,084·T` sem fonte identificada | Klissouras (1973): (652,17 − T) ÷ 6,762 |
| Balke 15 min | Usava a equação genérica de corrida do ACSM | Equação específica do teste de Balke |
| Caminhada 1.200 m | A equação de Rockport é para 1 milha (1.609 m), mas recebia o tempo de 1.200 m e superestimava o resultado | Tempo projetado proporcionalmente para 1 milha (adaptação indicada na tela) |
| Caminhada 3.000 m | Mostrava o custo de O₂ da caminhada como se fosse o VO₂máx (subestimava muito) | Agora mostra como “oxigênio usado na caminhada” e indica o teste de 1,2 km para estimar o VO₂máx |
| Caminhada 4.800 m | Classificava só a faixa de 20–29 anos, com tabela sem fonte | Tabela completa do The Cooper Institute (20–59 anos) |
| Cooper 12 min | Classificava só a faixa de 30–39 anos | Tabela completa (20 anos ou mais) |

> ⚠️ **Para conferir:** a equação de Ribisl & Kachodorian foi reconstruída a partir da literatura (Marins & Giannichi). Vale conferir com o livro de referência da disciplina antes de usar em aula.

---

## 💡 Sugestões de próximos passos

1. **Assistente com IA de verdade.** O assistente atual responde com uma base de conhecimento escrita à mão. Para respostas livres (estilo ChatGPT/Claude), é preciso um pequeno servidor (ex.: Cloudflare Workers ou Vercel) que guarde a chave da API em segredo, porque o GitHub Pages só hospeda arquivos estáticos e a chave ficaria exposta.
2. **Histórico de resultados.** Guardar os testes no próprio aparelho e mostrar um gráfico de evolução ao longo dos meses.
3. **Cronômetro embutido.** Um cronômetro com contagem de voltas na própria página (útil no Cooper e no Balke).
4. **Relatório em PDF** com o nome do avaliado, para professores e personal trainers.
5. **Modo professor/turma.** Lançar vários alunos de uma vez e exportar uma planilha (CSV).
6. **Mais protocolos:** banco de Harvard/Queens (step test), Leger (vai-e-vem 20 m), testes de força e flexibilidade (PROESP-BR para escolares).
7. **Tabelas para menores de 18 anos** (ex.: PROESP-BR, FITNESSGRAM), já que hoje a comparação começa aos 18 anos.
8. **Tema claro** e opção de fonte maior, para leitura ao ar livre no celular.
9. **PWA (funcionar offline e “instalar” no celular)**, útil na pista sem sinal.
10. **Testes automatizados** das fórmulas (o arquivo `calculos.js` já pode ser importado no Node).

---

## 💻 Tecnologias
HTML5, CSS3 e JavaScript puro, sem dependências nem etapa de build.

## 🚀 Como executar
```bash
git clone https://github.com/Guilhermecorrea77/aptidao-fisica.git
cd aptidao-fisica
# abra o index.html no navegador
```

## 📂 Estrutura
```
/
├── index.html      # Estrutura da página e do assistente
├── style.css       # Visual (responsivo, acessível)
├── calculos.js     # Fórmulas, tabelas de referência e textos de cada teste
├── assistente.js   # Assistente de texto (base de conhecimento)
└── script.js       # Interface: navegação, formulários, resultados
```

## 📚 Referências
- Cooper, K. H. (1968). A means of assessing maximal oxygen intake. *JAMA*, 203, 201–204.
- The Cooper Institute. *Physical Fitness Assessment and Norms* (caminhada de 3 milhas).
- Kline, G. M. et al. (1987). Estimation of VO₂max from a one-mile track walk. *MSSE*, 19(3), 253–259.
- Klissouras, V. (1973). Prediction of potential performance with special reference to heredity. *J Sports Med Phys Fitness*, 13(2), 100–107.
- Ribisl, P. M.; Kachodorian, W. A. (1969). Maximal oxygen intake prediction in young and middle-aged males. *J Sports Med Phys Fitness*, 9, 17–22.
- ACSM's Guidelines for Exercise Testing and Prescription (equações metabólicas).
- Ainsworth, B. E. et al. *Compendium of Physical Activities* (valores de MET).
- Topend Sports — normas de VO₂máx e do teste de Cooper.

> Os resultados são estimativas de testes de campo e não substituem uma avaliação profissional.
