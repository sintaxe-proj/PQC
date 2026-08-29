export class BurnCalculator {
    constructor(paciente) {
        this.paciente = paciente; // { nome, leito, enfermaria, peso, horaAcidente, tipoAcidente, scq }
    }

    // Define o fator da fórmula (2 mL ou 4 mL) conforme a etiologia da queimadura
    obterFatorParkland() {
        const tiposAltoRisco = ['eletrico', 'inflamavel_alto_impacto'];
        return tiposAltoRisco.includes(this.paciente.tipoAcidente) ? 4 : 2;
    }

    calcularVolumeTotal() {
        const fator = this.obterFatorParkland();
        return fator * this.paciente.peso * this.paciente.scq; // mL nas primeiras 24h
    }

    /**
     * Calcula o cronograma de infusão e a vazão da bomba conforme a hora do acidente.
     * @param {Date} horaAdmissao - Data/Hora do momento da aferição ou início do soro
     */
    calcularCronogramaInfusao(horaAdmissao = new Date()) {
        const volTotal = this.calcularVolumeTotal();
        const volAtaque = volTotal * 0.5;      // 50% nas primeiras 8h pós-acidente
        const volManutencao = volTotal * 0.5;  // 50% nas 16h subsequentes

        // Horas decorridas desde o momento do acidente (garante valor positivo)
        const diffHoras = Math.max(0, (horaAdmissao - new Date(this.paciente.horaAcidente)) / 36e5);

        let faseAtual = '';
        let tempoRestanteFase = 0;
        let vazaoBombaMLh = 0;
        let alertaSeguranca = null;

        // FASE 1: ATAQUE (Primeiras 8 horas pós-acidente)
        if (diffHoras < 8) {
            faseAtual = 'Ataque (0-8h)';
            // Garante janela mínima razoável de 2h para evitar estouro de vazão por atraso na admissão
            tempoRestanteFase = Math.max(8 - diffHoras, 2.0); 
            vazaoBombaMLh = volAtaque / tempoRestanteFase;

            // Trava de segurança clínica: Vazão máxima razoável em bomba de infusão contínua
            if (vazaoBombaMLh > 1200) {
                alertaSeguranca = 'Atenção: Vazão calculada excede o limite seguro. Recomenda-se reavaliar o tempo decorrido ou ajustar para teto de 1000-1200 mL/h.';
                vazaoBombaMLh = 1200; // Limita ao teto de segurança
            }
        } 
        // FASE 2: MANUTENÇÃO (Das 8h às 24h pós-acidente)
        else if (diffHoras >= 8 && diffHoras < 24) {
            faseAtual = 'Manutenção (8-24h)';
            tempoRestanteFase = Math.max(24 - diffHoras, 1.0);
            vazaoBombaMLh = volManutencao / 16; // Taxa padrão para a janela de 16h
        } 
        // PÓS-24 HORAS
        else {
            faseAtual = 'Pós-24h (Reavaliação de Coloides / Cristaloides)';
            tempoRestanteFase = 0;
            vazaoBombaMLh = 0;
        }

        return {
            faseAtual,
            volumeTotal24h: volTotal.toFixed(1),
            volumeAtaque: volAtaque.toFixed(1),
            volumeManutencao: volManutencao.toFixed(1),
            horasDecorridas: diffHoras.toFixed(2),
            tempoRestanteFase: tempoRestanteFase.toFixed(2),
            vazaoManutencaoPadrao: (volManutencao / 16).toFixed(1), // Vazão que entrará nas 16h seguintes
            vazaoBombaMLh: vazaoBombaMLh.toFixed(1),
            alertaSeguranca
        };
    }
}

export class FluidBalance {
    static calcularPerdaCompressa(qtdCompressas) {
        return qtdCompressas * 300; // Cada compressa absorve até 300 mL
    }

    static calcularBalanco(entradas = [], saidas = {}) {
        const totalEntradas = entradas.reduce((acc, v) => acc + v, 0);
        const perdaSangue = this.calcularPerdaCompressa(saidas.compressas || 0);
        
        const totalSaidas = (saidas.diurese || 0) + 
                            (saidas.emese || 0) + 
                            perdaSangue + 
                            (saidas.outrasPerdas || 0);

        return {
            totalEntradas,
            totalSaidas,
            balancoFinal: totalEntradas - totalSaidas
        };
    }
}
