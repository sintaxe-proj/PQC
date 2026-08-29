// js/app.js
// Controladora principal da interface e cálculos clínicos do PQC-HFA

import { SVGInteractive } from './SVGInteractive.js';
import { FluidBalance } from './fluidBalance.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o seletor vetorial (SVG) e a calculadora de balanço hídrico
    const bodyMap = new SVGInteractive('body-map', 'scq-display');
    const fluidCalculator = new FluidBalance();

    const btnCalcular = document.getElementById('btn-calcular');
    const pqcForm = document.getElementById('pqc-form');
    const inputDataNascimento = document.getElementById('dataNascimento');
    const labelFaixaEtaria = document.getElementById('faixa-etaria-label');

    // 2. Preenche a data/hora do acidente com o horário atual por padrão
    const inputHoraAcidente = document.getElementById('horaAcidente');
    if (inputHoraAcidente && !inputHoraAcidente.value) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        inputHoraAcidente.value = agora.toISOString().slice(0, 16);
    }

    // 3. Listener para mudança na Data de Nascimento (Ajuste Lund-Browder)
    if (inputDataNascimento) {
        inputDataNascimento.addEventListener('change', (e) => {
            const dataNascVal = e.target.value;
            if (!dataNascVal) return;

            const dataNasc = new Date(dataNascVal);
            const hoje = new Date();
            
            // Cálculo da idade exata em anos
            let idade = hoje.getFullYear() - dataNasc.getFullYear();
            const m = hoje.getMonth() - dataNasc.getMonth();
            if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
                idade--;
            }

            // Atualiza os percentuais das regiões SVG via método da classe SVGInteractive
            if (typeof bodyMap.atualizarLundBrowder === 'function') {
                bodyMap.atualizarLundBrowder(idade);
            }

            // Atualiza o rótulo visual da Faixa Etária
            if (labelFaixaEtaria) {
                if (idade < 1) labelFaixaEtaria.innerText = 'Lund-Browder: Lactente (<1 ano)';
                else if (idade <= 4) labelFaixaEtaria.innerText = `Lund-Browder: Infantil (${idade} anos)`;
                else if (idade <= 9) labelFaixaEtaria.innerText = `Lund-Browder: Escolar (${idade} anos)`;
                else if (idade <= 14) labelFaixaEtaria.innerText = `Lund-Browder: Jovem (${idade} anos)`;
                else labelFaixaEtaria.innerText = 'Lund-Browder: Adulto (15+ anos)';
            }
        });
    }

    // 4. Listener do botão de cálculo
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
            const scq = parseFloat(document.getElementById('scq-display')?.innerText) || 0;

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

            // 5. Cálculo do Balanço Hídrico via módulo FluidBalance
            const balancoResult = fluidCalculator.calculate({
                entradas: document.getElementById('entradas')?.value,
                diurese: document.getElementById('diurese')?.value,
                emese: document.getElementById('emese')?.value,
                compressas: document.getElementById('compressas')?.value,
                outrasPerdas: document.getElementById('outrasPerdas')?.value
            });

            // 6. Renderização dos resultados no painel de saída
            document.getElementById('res-fator').innerText = `${fatorParkland} mL / kg / % SCQ`;
            document.getElementById('res-vol-total').innerText = `${volumeTotal24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            document.getElementById('res-vol-ataque').innerText = `${volAtaque.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL (${tempoRestanteAtaque.toFixed(1)}h restantes)`;
            document.getElementById('res-vazao-ataque').innerText = `${vazaoAtaqueMLh.toFixed(1)} mL/h`;
            document.getElementById('res-vol-manutencao').innerText = `${volManutencao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL (${vazaoManutencaoMLh.toFixed(1)} mL/h)`;
            
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
