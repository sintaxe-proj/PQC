// js/app.js
// Controladora principal da interface, interações SVG e cálculos do PQC-HFA

import { SVGInteractive } from './SVGInteractive.js';
import { FluidBalance } from './fluidBalance.js';

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
    let idadeCalculada = 30; // Padrão adulto caso não informada
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

            // Atualiza o indicador visual da faixa etária
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
            // Validação de formulário
            if (pqcForm && !pqcForm.checkValidity()) {
                pqcForm.reportValidity();
                return;
            }

            // Coleta de dados
            const peso = parseFloat(document.getElementById('peso')?.value) || 0;
            const altura = parseFloat(document.getElementById('altura')?.value) || 170;
            const tipoAcidente = document.getElementById('tipoAcidente')?.value || 'direto';
            const horaAcidenteVal = document.getElementById('horaAcidente')?.value;
            const scq = parseFloat(document.getElementById('scq-display')?.innerText) || 0;

            if (scq === 0) {
                alert('Por favor, selecione ao menos uma região do corpo afetada no mapa.');
                return;
            }

            // Fator de Parkland (2 mL para térmico/químico, 4 mL para inflamável/elétrico)
            const fatoresElevados = ['inflamavel', 'eletrico'];
            const fatorParkland = fatoresElevados.includes(tipoAcidente) ? 4 : 2;
            const volumeTotal24h = fatorParkland * peso * scq;

            // Ajuste temporal da infusão
            const dataAcidente = horaAcidenteVal ? new Date(horaAcidenteVal) : new Date();
            const agora = new Date();
            const diffHoras = Math.max(0, (agora - dataAcidente) / (1000 * 60 * 60));

            const volAtaque = volumeTotal24h * 0.5;
            const tempoRestanteAtaque = Math.max(8 - diffHoras, 0.5); // Divisor de segurança (30 min min.)
            const vazaoAtaqueMLh = volAtaque / tempoRestanteAtaque;

            const volManutencao = volumeTotal24h * 0.5;
            const vazaoManutencaoMLh = volManutencao / 16;

            // Avaliação da Diurese Real e Sugestão de Ajuste da Bomba
            const diureseVal = document.getElementById('diurese')?.value;
            const horasDiureseVal = document.getElementById('horasDiurese')?.value;
            const avaliacaoRenal = fluidCalculator.evaluateUrineOutput(diureseVal, horasDiureseVal, peso, idadeCalculada);

            // Cálculo do Balanço Hídrico, Perda Evaporativa e Impacto Osmolar (Adrogué-Madias)
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

            // 6. Exibição de Resultados no Painel
            document.getElementById('res-fator').innerText = `${fatorParkland} mL/kg/% SCQ`;
            document.getElementById('res-vol-total').innerText = `${volumeTotal24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            document.getElementById('res-vazao-ataque').innerText = `${vazaoAtaqueMLh.toFixed(1)} mL/h (${volAtaque.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL em ${tempoRestanteAtaque.toFixed(1)}h)`;

            // Diurese e Recomendação de Vazão da Bomba
            document.getElementById('res-diurese-kgh').innerText = `${avaliacaoRenal.diureseKgH} mL/kg/h (Meta: ${avaliacaoRenal.metaTexto})`;
            const elAjuste = document.getElementById('res-ajuste-bomba');
            if (elAjuste) {
                elAjuste.innerText = avaliacaoRenal.recomendacao;
                if (avaliacaoRenal.status === 'oliguria') {
                    elAjuste.style.color = 'var(--accent-red)';
                } else if (avaliacaoRenal.status === 'poliuria') {
                    elAjuste.style.color = 'var(--accent-amber)';
                } else {
                    elAjuste.style.color = 'var(--accent-green)';
                }
            }

            // Perda Evaporativa e Balanço
            document.getElementById('res-perda-evaporativa').innerText = `${balancoResult.perdaEvaporativa24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            const elBalanco = document.getElementById('res-balanco');
            if (elBalanco) {
                const sinal = balancoResult.balancoFinal > 0 ? '+' : '';
                elBalanco.innerText = `${sinal}${balancoResult.balancoFinal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
                elBalanco.style.color = balancoResult.balancoFinal < 0 ? 'var(--accent-red)' : (balancoResult.balancoFinal > 0 ? 'var(--accent-green)' : 'var(--text-main)');
            }

            // Impacto Osmolar (ΔNa⁺)
            const elImpactoNa = document.getElementById('res-impacto-na');
            if (elImpactoNa) {
                const sinalNa = balancoResult.variacaoNaEstimada > 0 ? '+' : '';
                elImpactoNa.innerText = `${sinalNa}${balancoResult.variacaoNaEstimada} mEq/L (Proj: ${balancoResult.naSericoProjetado} mEq/L)`;
                
                if (Math.abs(balancoResult.variacaoNaEstimada) >= 8) {
                    elImpactoNa.style.color = 'var(--accent-red)';
                } else if (Math.abs(balancoResult.variacaoNaEstimada) >= 4) {
                    elImpactoNa.style.color = 'var(--accent-amber)';
                } else {
                    elImpactoNa.style.color = 'var(--text-main)';
                }
            }

            // Módulo Pediátrico de Holliday-Segar
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

            // Alerta Crítico de Fluid Creep / Síndrome Compartimental
            const painelCreep = document.getElementById('alerta-fluid-creep');
            if (painelCreep) {
                if (scq >= 50 || volumeTotal24h > (peso * 250)) {
                    painelCreep.style.display = 'block';
                } else {
                    painelCreep.style.display = 'none';
                }
            }
        });
    }

    // 7. Botão para Copiar a Evolução para o Prontuário Eletrônico
    if (btnCopiar) {
        btnCopiar.addEventListener('click', () => {
            const nome = document.getElementById('nome')?.value || 'Não informado';
            const leito = document.getElementById('leito')?.value || 'S/N';
            const peso = document.getElementById('peso')?.value || '0';
            const scq = document.getElementById('scq-display')?.innerText || '0%';
            const volTotal = document.getElementById('res-vol-total')?.innerText || '0 mL';
            const vazaoAtaque = document.getElementById('res-vazao-ataque')?.innerText || '0 mL/h';
            const diureseAferida = document.getElementById('res-diurese-kgh')?.innerText || '--';
            const ajusteBomba = document.getElementById('res-ajuste-bomba')?.innerText || '--';
            const balanco = document.getElementById('res-balanco')?.innerText || '0 mL';
            const deltaNa = document.getElementById('res-impacto-na')?.innerText || '--';

            const textoProntuario = `[EVOLUÇÃO PQC - RESPOSTA VOLÊMICA E RESTRUTURAÇÃO HÍDRICA]
Paciente: ${nome} | Leito: ${leito} | Peso: ${peso}kg
Superfície Corporal Queimada (SCQ): ${scq}
--------------------------------------------------
- Volume Parkland (24h): ${volTotal}
- Vazão Teórica de Ataque: ${vazaoAtaque}
- Diurese Real Aferida: ${diureseAferida}
- Conduta/Ajuste na Bomba: ${ajusteBomba}
- Balanço Hídrico (com perdas evaporativas): ${balanco}
- Impacto Osmolar Projetado (ΔNa⁺): ${deltaNa}
--------------------------------------------------
Avaliação de Risco: Monitoramento contínuo de sinais de perfusão e compartimentação tecidual.`;

            navigator.clipboard.writeText(textoProntuario).then(() => {
                alert('Evolução copiada com sucesso para a área de transferência!');
            }).catch(() => {
                alert('Erro ao copiar automaticamente. Selecione o texto e copie manualmente.');
            });
        });
    }

    // 8. Registro do Service Worker para suporte Offline (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[PQC-HFA PWA] Service Worker registrado com sucesso:', reg.scope))
                .catch((err) => console.error('[PQC-HFA PWA] Falha ao registrar Service Worker:', err));
        });
    }
});
