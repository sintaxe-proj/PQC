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

    calcularInfusaoAtaque(horaAdmissao = new Date()) {
        const volTotal = this.calcularVolumeTotal();
        const volAtaque = volTotal * 0.5;

        // Horas decorridas do acidente até o início do atendimento
        const diffHoras = Math.abs(horaAdmissao - this.paciente.horaAcidente) / 36e5;
        const tempoRestanteAtaque = Math.max(8 - diffHoras, 0.5); // Garante divisor mínimo para segurança

        const vazaoAtaqueMLh = volAtaque / tempoRestanteAtaque;

        return {
            volumeAtaque: volAtaque,
            tempoRestanteHoras: tempoRestanteAtaque.toFixed(2),
            vazaoBombaMLh: vazaoAtaqueMLh.toFixed(1)
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
