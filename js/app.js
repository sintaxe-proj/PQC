// js/app.js
// Controladora principal da interface, interações SVG, cálculos e módulo PIA/SCA

import { SVGInteractive } from './SVGInteractive.js';
import { FluidBalance } from './fluidBalance.js';
import { PIAModule } from './piaModule.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o seletor vetorial (SVG) e o módulo de balanço hídrico
    const bodyMap = new SVGInteractive('body-map', 'scq-display');
    const fluidCalculator = new FluidBalance();

    const btnCalcular = document.getElementById('btn-calcular');
    const btnCopiar = document.getElementById('btn-copiar-prontuario');
    const pqcForm = document.getElementById('pqc-form');
    const inputDataNascimento = document.getElementById('dataNascimento');
    const labelFaixaEtaria = document.getElementById('faixa-etaria-label');

    // 2. Botões de Seleção Rápida e Reset do Mapa SVG
    document.getElementById('btn-reset-mapa')?.addEventListener('click', () => {
        if (typeof bodyMap.limparSelecao === 'function') {
            bodyMap.limparSelecao();
        } else {
            location.reload();
        }
    });

    document.getElementById('btn-select-frente')?.addEventListener('click', () => {
        if (typeof bodyMap.selecionarGrupo === 'function') {
            bodyMap.selecionarGrupo('visao-anterior');
        }
    });

    document.getElementById('btn-select-verso')?.addEventListener('click', () => {
        if (typeof bodyMap.selecionarGrupo === 'function') {
            bodyMap.selecionarGrupo('visao-posterior');
        }
    });

    // 3. Preenche a data/hora do acidente por padrão com a hora atual
    const inputHoraAcidente = document.getElementById('horaAcidente');
    if (inputHoraAcidente && !inputHoraAcidente.value) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        inputHoraAcidente.value = agora.toISOString().slice(0, 16);
    }

    // 4. Identificação de Idade e Ajuste Dinâmico Lund-Browder
    let idadeCalculada = 30; // Padrão adulto
    if (inputDataNascimento) {
        inputDataNascimento.addEventListener('change', (e) => {
            const dataNascVal = e.target.value;
            if (!dataNascVal) return;

            const dataNasc = new Date(dataNascVal);
            const hoje = new Date();
            let idade = hoje.getFullYear() - dataNasc.getFullYear();
            const m = hoje.getMonth() - dataNasc.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
                idade--;
            }

            idadeCalculada = idade;

            // Atualiza percentuais das regiões no SVG
            if (typeof bodyMap.atualizarLundBrowder === 'function') {
                bodyMap.atualizarLundBrowder(idade);
            }

            // Atualiza indicador da faixa etária
            if (labelFaixaEtaria) {
                if (idade < 1) labelFaixaEtaria.innerText = 'Lund-Browder: Lactente (<1 ano)';
                else if (idade <= 4) labelFaixaEtaria.innerText = `Lund-Browder: Infantil (${idade} anos)`;
                else if (idade <= 9) labelFaixaEtaria.innerText = `Lund-Browder: Escolar (${idade} anos)`;
                else if (idade <= 14) labelFaixaEtaria.innerText = `Lund-Browder: Jovem (${idade} anos)`;
                else labelFaixaEtaria.innerText = 'Lund-Browder: Adulto (15+ anos)';
            }
        });
    }

    // 5. Listener Principal do Botão de Cálculo
    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            if (pqcForm && !pqcForm.checkValidity()) {
                pqcForm.reportValidity();
                return;
            }

            const peso = parseFloat(document.getElementById('peso')?.value) || 0;
            const altura = parseFloat(document.getElementById('altura')?.value) || 170;
            const tipoAcidente = document.getElementById('tipoAcidente')?.value || 'direto';
            const horaAcidenteVal = document.getElementById('horaAcidente')?.value;
            const scq = parseFloat(document.getElementById('scq-display')?.innerText) || 0;

            if (scq === 0) {
                alert('Por favor, selecione ao menos uma região do corpo afetada no mapa.');
                return;
            }

            // Fator de Parkland
            const fatoresElevados = ['inflamavel', 'eletrico'];
            const fatorParkland = fatoresElevados.includes(tipoAcidente) ? 4 : 2;
            const volumeTotal24h = fatorParkland * peso * scq;

            // Ajuste temporal
            const dataAcidente = horaAcidenteVal ? new Date(horaAcidenteVal) : new Date();
            const agora = new Date();
            const diffHoras = Math.max(0, (agora - dataAcidente) / (1000 * 60 * 60));

            const volAtaque = volumeTotal24h * 0.5;
            const tempoRestanteAtaque = Math.max(8 - diffHoras, 0.5);
            const vazaoAtaqueMLh = volAtaque / tempoRestanteAtaque;

            // Avaliação Renal
            const diureseVal = document.getElementById('diurese')?.value;
            const horasDiureseVal = document.getElementById('horasDiurese')?.value;
            const avaliacaoRenal = fluidCalculator.evaluateUrineOutput(diureseVal, horasDiureseVal, peso, idadeCalculada);

            // Balanço Hídrico, Perda Evaporativa e ΔNa⁺
            const balancoResult = fluidCalculator.calculate({
                entradas: document.getElementById('entradas')?.value,
                diurese: diureseVal,
                emese: document.getElementById('emese')?.value,
                compressas: document.getElementById('compressas')?.value,
                outrasPerdas: document.getElementById('outrasPerdas')?.value,
                peso,
                altura,
                scq,
                naSerico: document.getElementById('naSerico')?.value,
                naInfusao: document.getElementById('naInfusao')?.value,
                volumeParklandML: volumeTotal24h
            });

            // Avaliação de PIA e SCA
            const valPia = parseFloat(document.getElementById('piaValor')?.value);
            const unidadePia = document.getElementById('piaUnidade')?.value || 'mmHg';
            const valPam = parseFloat(document.getElementById('pam')?.value);
            const temDisfuncao = document.getElementById('disfuncaoOrgao')?.value === 'sim';

            const avaliacaoPIA = PIAModule.evaluate(valPia, unidadePia, valPam, temDisfuncao);

            // 6. Exibição dos Resultados no Painel
            document.getElementById('res-fator').innerText = `${fatorParkland} mL/kg/% SCQ`;
            document.getElementById('res-vol-total').innerText = `${volumeTotal24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            document.getElementById('res-vazao-ataque').innerText = `${vazaoAtaqueMLh.toFixed(1)} mL/h (${volAtaque.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL em ${tempoRestanteAtaque.toFixed(1)}h)`;

            // Diurese e Bomba
            document.getElementById('res-diurese-kgh').innerText = `${avaliacaoRenal.diureseKgH} mL/kg/h (Meta: ${avaliacaoRenal.metaTexto})`;
            const elAjuste = document.getElementById('res-ajuste-bomba');
            if (elAjuste) {
                elAjuste.innerText = avaliacaoRenal.recomendacao;
                elAjuste.style.color = avaliacaoRenal.status === 'oliguria' ? 'var(--accent-red)' : (avaliacaoRenal.status === 'poliuria' ? 'var(--accent-amber)' : 'var(--accent-green)');
            }

            // Perdas e Balanço
            document.getElementById('res-perda-evaporativa').innerText = `${balancoResult.perdaEvaporativa24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            const elBalanco = document.getElementById('res-balanco');
            if (elBalanco) {
                const sinal = balancoResult.balancoFinal > 0 ? '+' : '';
                elBalanco.innerText = `${sinal}${balancoResult.balancoFinal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
                elBalanco.style.color = balancoResult.balancoFinal < 0 ? 'var(--accent-red)' : 'var(--accent-green)';
            }

            // Impacto Osmolar
            const elImpactoNa = document.getElementById('res-impacto-na');
            if (elImpactoNa) {
                const sinalNa = balancoResult.variacaoNaEstimada > 0 ? '+' : '';
                elImpactoNa.innerText = `${sinalNa}${balancoResult.variacaoNaEstimada} mEq/L (Proj: ${balancoResult.naSericoProjetado} mEq/L)`;
            }

            // Resultados PIA e PPA
            const elPiaClass = document.getElementById('res-pia-class');
            if (elPiaClass) {
                elPiaClass.innerText = avaliacaoPIA.classificacao;
                elPiaClass.style.color = avaliacaoPIA.cor;
            }

            const elPpaVal = document.getElementById('res-ppa-valor');
            if (elPpaVal) {
                elPpaVal.innerText = avaliacaoPIA.ppa !== null ? `${avaliacaoPIA.ppa} mmHg (Meta ≥ 60)` : 'PAM não informada';
                if (avaliacaoPIA.ppa !== null && avaliacaoPIA.ppa < 60) {
                    elPpaVal.style.color = 'var(--accent-red)';
                } else if (avaliacaoPIA.ppa !== null) {
                    elPpaVal.style.color = 'var(--accent-green)';
                }
            }

            // Painel de SCA
            const painelSCA = document.getElementById('painel-sca');
            const tituloSCA = document.getElementById('sca-titulo');
            const condutaSCA = document.getElementById('sca-conduta');

            if (painelSCA && avaliacaoPIA.status !== 'nao_aferido') {
                painelSCA.style.display = 'block';
                painelSCA.style.background = avaliacaoPIA.isSCA ? 'rgba(155, 44, 44, 0.25)' : 'rgba(255, 255, 255, 0.05)';
                painelSCA.style.borderLeft = `4px solid ${avaliacaoPIA.cor}`;
                
                if (tituloSCA) {
                    tituloSCA.innerText = `Estratificação PIA: ${avaliacaoPIA.classificacao}`;
                    tituloSCA.style.color = avaliacaoPIA.cor;
                }
                if (condutaSCA) {
                    condutaSCA.innerHTML = avaliacaoPIA.conduta;
                }
            } else if (painelSCA) {
                painelSCA.style.display = 'none';
            }

            // Suporte Pediátrico (Holliday-Segar)
            const painelPeds = document.getElementById('painel-pediatrico');
            const resHolliday = document.getElementById('res-holliday');
            if (idadeCalculada < 15) {
                const holliday = fluidCalculator.calculateHollidaySegar(peso);
                if (holliday && painelPeds && resHolliday) {
                    painelPeds.style.display = 'block';
                    resHolliday.innerHTML = `<strong>Manutenção Basal:</strong> ${holliday.volume24h} mL/24h (${holliday.vazaoHora} mL/h)<br><strong>Composição Recomendada:</strong> ${holliday.solucaoSugerida}`;
                }
            } else if (painelPeds) {
                painelPeds.style.display = 'none';
            }

            // Alerta Fluid Creep
            const painelCreep = document.getElementById('alerta-fluid-creep');
            if (painelCreep) {
                if (scq >= 50 || volumeTotal24h > (peso * 250) || avaliacaoPIA.piammHg >= 16) {
                    painelCreep.style.display = 'block';
                } else {
                    painelCreep.style.display = 'none';
                }
            }
        });
    }

    // 7. Copiar Evolução Anônima para Prontuário
    if (btnCopiar) {
        btnCopiar.addEventListener('click', () => {
            const peso = document.getElementById('peso')?.value || '0';
            const scq = document.getElementById('scq-display')?.innerText || '0%';
            const volTotal = document.getElementById('res-vol-total')?.innerText || '0 mL';
            const vazaoAtaque = document.getElementById('res-vazao-ataque')?.innerText || '0 mL/h';
            const diureseAferida = document.getElementById('res-diurese-kgh')?.innerText || '--';
            const ajusteBomba = document.getElementById('res-ajuste-bomba')?.innerText || '--';
            const balanco = document.getElementById('res-balanco')?.innerText || '0 mL';
            const deltaNa = document.getElementById('res-impacto-na')?.innerText || '--';
            const piaClass = document.getElementById('res-pia-class')?.innerText || 'Não aferida';
            const ppaVal = document.getElementById('res-ppa-valor')?.innerText || '--';

            const textoProntuario = `[EVOLUÇÃO PQC - RESSUSCITAÇÃO VOLÊMICA & PARÂMETROS HEMODINÂMICOS/PIA]
Parâmetros Biofísicos: Peso ${peso} kg | SCQ: ${scq}
--------------------------------------------------
• Volume Parkland (24h): ${volTotal}
• Vazão Teórica de Ataque: ${vazaoAtaque}
• Diurese Real Aferida: ${diureseAferida}
• Conduta / Ajuste na Bomba: ${ajusteBomba}
• Balanço Hídrico (com perdas evaporativas): ${balanco}
• Impacto Osmolar Projetado (ΔNa⁺): ${deltaNa}
--------------------------------------------------
MONITORIZAÇÃO ABDOMINAL (WSACS):
• Classificação PIA: ${piaClass}
• Pressão de Perfusão Abdominal (PPA): ${ppaVal}
--------------------------------------------------
Avaliação contínua para prevenção de Fluid Creep e Síndrome Compartimental.`;

            navigator.clipboard.writeText(textoProntuario).then(() => {
                alert('Evolução copiada com sucesso para a área de transferência!');
            }).catch(() => {
                alert('Erro ao copiar automaticamente.');
            });
        });
    }

    // 8. Service Worker para suporte Offline (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[PQC-HFA PWA] SW ativo:', reg.scope))
                .catch((err) => console.error('[PQC-HFA PWA] Falha SW:', err));
        });
    }
});
