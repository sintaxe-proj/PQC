// js/app.js
// Controladora principal e lógica de cálculos clínicos do PQC-HFA

document.addEventListener('DOMContentLoaded', () => {
    const btnCalcular = document.getElementById('btn-calcular');
    const pqcForm = document.getElementById('pqc-form');

    // Inicializa a data/hora do acidente com o horário atual por padrão
    const inputHoraAcidente = document.getElementById('horaAcidente');
    if (inputHoraAcidente && !inputHoraAcidente.value) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        inputHoraAcidente.value = agora.toISOString().slice(0, 16);
    }

    btnCalcular.addEventListener('click', () => {
        // Validação dos campos obrigatórios da UI
        if (!pqcForm.checkValidity()) {
            pqcForm.reportValidity();
            return;
        }

        // 1. Coleta e sanitização de dados admissionais
        const peso = parseFloat(document.getElementById('peso').value) || 0;
        const tipoAcidente = document.getElementById('tipoAcidente').value;
        const horaAcidenteVal = document.getElementById('horaAcidente').value;
        const scq = parseFloat(document.getElementById('scq-display').innerText) || 0;

        // Entradas e Saídas do Balanço Hídrico
        const entradas = parseFloat(document.getElementById('entradas').value) || 0;
        const diurese = parseFloat(document.getElementById('diurese').value) || 0;
        const emese = parseFloat(document.getElementById('emese').value) || 0;
        const compressas = parseFloat(document.getElementById('compressas').value) || 0;
        const outrasPerdas = parseFloat(document.getElementById('outrasPerdas').value) || 0;

        // 2. Determinação do Fator da Fórmula de Parkland (2 mL ou 4 mL)
        const fatoresElevados = ['inflamavel', 'eletrico'];
        const fatorParkland = fatoresElevados.includes(tipoAcidente) ? 4 : 2;

        // 3. Cálculo do Volume Total em 24h
        const volumeTotal24h = fatorParkland * peso * scq;

        // 4. Cronograma de Infusão Ajustado pelo Horário do Acidente
        const dataAcidente = new Date(horaAcidenteVal);
        const agora = new Date();
        const diffHoras = (agora - dataAcidente) / (1000 * 60 * 60);

        // Fase de Ataque (50% do volume total)
        const volAtaque = volumeTotal24h * 0.5;
        // Ajusta o tempo restante da janela de 8 horas pós-acidente
        const tempoRestanteAtaque = Math.max(8 - diffHoras, 0.5); // Garante divisor mínimo de segurança (30 min)
        const vazaoAtaqueMLh = volAtaque / tempoRestanteAtaque;

        // Fase de Manutenção (50% do volume nas 16h seguintes)
        const volManutencao = volumeTotal24h * 0.5;
        const vazaoManutencaoMLh = volManutencao / 16;

        // 5. Cálculo do Balanço Hídrico e Perdas Sanguíneas
        const perdaCompressas = compressas * 300; // Quantificação: 300 mL por compressa
        const totalSaidas = diurese + emese + perdaCompressas + outrasPerdas;
        const balancoFinal = entradas - totalSaidas;

        // 6. Renderização dos Resultados na Interface
        document.getElementById('res-fator').innerText = `${fatorParkland} mL / kg / % SCQ`;
        document.getElementById('res-vol-total').innerText = `${volumeTotal24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
        document.getElementById('res-vol-ataque').innerText = `${volAtaque.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL (${tempoRestanteAtaque.toFixed(1)}h restantes)`;
        document.getElementById('res-vazao-ataque').innerText = `${vazaoAtaqueMLh.toFixed(1)} mL/h`;
        document.getElementById('res-vol-manutencao').innerText = `${volManutencao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL (${vazaoManutencaoMLh.toFixed(1)} mL/h)`;
        
        const elBalanco = document.getElementById('res-balanco');
        const sinal = balancoFinal > 0 ? '+' : '';
        elBalanco.innerText = `${sinal}${balancoFinal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
        
        // Destaque visual para balanço positivo ou negativo
        if (balancoFinal < 0) {
            elBalanco.style.color = 'var(--accent-red)';
        } else if (balancoFinal > 0) {
            elBalanco.style.color = 'var(--accent-green)';
        } else {
            elBalanco.style.color = 'var(--text-main)';
        }
    });
});
