// js/fluidBalance.js
// Módulo de cálculo e gerenciamento do Balanço Hídrico no PQC-HFA

export class FluidBalance {
    constructor() {
        // Constante clínica: retenção estimada por compressa cirúrgica impregnada
        this.VOLUME_PER_COMPRESS = 300; // mL
    }

    /**
     * Calcula o balanço hídrico simplificado ou acumulado de 24h
     * @param {Object} inputs - Objeto contendo os volumes de entrada e saída
     * @returns {Object} - Objeto com totais de entradas, saídas e o saldo final
     */
    calculate({ entradas = 0, diurese = 0, emese = 0, compressas = 0, outrasPerdas = 0 }) {
        const volEntradas = parseFloat(entradas) || 0;
        const volDiurese = parseFloat(diurese) || 0;
        const volEmese = parseFloat(emese) || 0;
        const qtdCompressas = parseFloat(compressas) || 0;
        const volOutrasPerdas = parseFloat(outrasPerdas) || 0;

        // Cálculo das perdas por compressas (300 mL cada)
        const perdaCompressas = qtdCompressas * this.VOLUME_PER_COMPRESS;

        // Somatório total das saídas
        const totalSaidas = volDiurese + volEmese + perdaCompressas + volOutrasPerdas;

        // Saldo final do balanço
        const balancoFinal = volEntradas - totalSaidas;

        return {
            entradas: volEntradas,
            saidas: totalSaidas,
            perdaCompressas: perdaCompressas,
            balancoFinal: balancoFinal
        };
    }
}
