// js/app.js
// Controladora principal da interface e cálculos clínicos do PQC-HFA

import { SVGInteractive } from './SVGInteractive.js';
import { FluidBalance } from './fluidBalance.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Variável global de estado para o SCQ
    let scqCalculado = 0;

    // 2. Inicializa o seletor vetorial (SVG) com callback de atualização em tempo real
    const bodyMap = new SVGInteractive('body-map', (totalSCQ) => {
        scqCalculado = totalSCQ;
        
        // Atualiza a badge visual na tela
        const elDisplay = document.getElementById('scq-display');
        if (elDisplay) {
            elDisplay.innerText = `${totalSCQ.toFixed(1)}%`;
        }
    });

    const fluidCalculator = new FluidBalance();

    const btnCalcular = document.getElementById('btn-calcular');
    const pqcForm = document.getElementById('pqc-form');
    const inputIdade = document.getElementById('idade');

    // 3. Atualiza as proporções de Lund-Browder ao alterar a idade
    if (inputIdade) {
        inputIdade.addEventListener('input', (e) => {
            const idade = parseFloat(e.target.value) || 0;
            bodyMap.setAgeGroup(idade);
        });
    }

    // 4. Preenche a data/hora do acidente com o horário atual por padrão
    const inputHoraAcidente = document.getElementById('horaAcidente');
    if (inputHoraAcidente && !inputHoraAcidente.value) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        inputHoraAcidente.value = agora.toISOString().slice(0, 16);
    }

    // 5. Listener do botão de cálculo
    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            // Validação nativa dos campos do formulário
            if (pqcForm && !pqcForm.checkValidity()) {
                pqcForm.reportValidity();
                return;
            }

            // Coleta de dados admissionais
            const peso = parseFloat(document.getElementById('peso')?.value) || 0;
            const tipoAcidente = document.getElementById('tipoAcidente')?.value || 'direto';
            const horaAcidenteVal = document.getElementById('horaAcidente')?.value;

            // Extração segura do SCQ (prioriza a variável de estado, faz fallback limpando o texto)
            let scq = scqCalculado;
            if (scq === 0) {
                const textDisplay = document.getElementById('scq-display')?.innerText || '0';
                scq = parseFloat(textDisplay.replace(/[^0-9.]/g, '')) || 0;
            }

            if (scq === 0) {
                alert('Por favor, selecione ao menos uma região do corpo afetada no mapa.');
                return;
            }

            // Fator da Fórmula de Parkland (2 mL para térmico/químico, 4 mL para inflamável/elétrico)
            const fatoresElevados = ['inflamavel', 'eletrico'];
            const fatorParkland = fatoresElevados.includes(tipoAcidente) ? 4 : 2;

            // Volume Total em 24h (mL)
            const volumeTotal24h = fatorParkland * peso * scq;

            // Cronograma de Infusão Ajustado pela Hora do Acidente
            const dataAcidente = horaAcidenteVal ? new Date(horaAcidenteVal) : new Date();
            const agora = new Date();
            const diffHoras = Math.max(0, (agora - dataAcidente) / (1000 * 60 * 60));

            // Fase de Ataque (50% do volume total nas primeiras 8h do acidente)
            const volAtaque = volumeTotal24h * 0.5;
            const tempoRestanteAtaque = Math.max(8 - diffHoras, 0.5); // Divisor mínimo de segurança (30 min)
            const vazaoAtaqueMLh = volAtaque / tempoRestanteAtaque;

            // Fase de Manutenção (50% do volume nas 16h seguintes)
            const volManutencao = volumeTotal24h * 0.5;
            const vazaoManutencaoMLh = volManutencao / 16;

            // 6. Cálculo do Balanço Hídrico via módulo FluidBalance
            const balancoResult = fluidCalculator.calculate({
                entradas: document.getElementById('entradas')?.value,
                diurese: document.getElementById('diurese')?.value,
                emese: document.getElementById('emese')?.value,
                compressas: document.getElementById('compressas')?.value,
                outrasPerdas: document.getElementById('outrasPerdas')?.value
            });

            // 7. Renderização dos resultados no painel de saída
            const elFator = document.getElementById('res-fator');
            if (elFator) elFator.innerText = `${fatorParkland} mL / kg / % SCQ`;

            const elVolTotal = document.getElementById('res-vol-total');
            if (elVolTotal) elVolTotal.innerText = `${volumeTotal24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;

            const elVolAtaque = document.getElementById('res-vol-ataque');
            if (elVolAtaque) elVolAtaque.innerText = `${volAtaque.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL (${tempoRestanteAtaque.toFixed(1)}h restantes)`;

            const elVazaoAtaque = document.getElementById('res-vazao-ataque');
            if (elVazaoAtaque) elVazaoAtaque.innerText = `${vazaoAtaqueMLh.toFixed(1)} mL/h`;

            const elVolManutencao = document.getElementById('res-vol-manutencao');
            if (elVolManutencao) elVolManutencao.innerText = `${volManutencao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL (${vazaoManutencaoMLh.toFixed(1)} mL/h)`;

            const elBalanco = document.getElementById('res-balanco');
            if (elBalanco && balancoResult) {
                const sinal = balancoResult.balancoFinal > 0 ? '+' : '';
                elBalanco.innerText = `${sinal}${balancoResult.balancoFinal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;

                // Cor dinâmica do Balanço Hídrico
                if (balancoResult.balancoFinal < 0) {
                    elBalanco.style.color = 'var(--accent-red)';
                } else if (balancoResult.balancoFinal > 0) {
                    elBalanco.style.color = 'var(--accent-green)';
                } else {
                    elBalanco.style.color = 'var(--text-main)';
                }
            }
        });
    }
});
