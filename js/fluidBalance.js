/**
 * FluidBalance.js - Balanço Hídrico e Cálculo de Osmolaridade / Tonicidade
 */
export class FluidBalance {
    constructor() {}

    /**
     * Realiza o cálculo do Balanço Hídrico Volumétrico e Projeção de Sódio
     */
    calculate({ entradas = 0, diurese = 0, emese = 0, compressas = 0, outrasPerdas = 0, peso = 70, naSerico = 140, naInfusao = 130, volumeParklandML = 0 }) {
        const entInsumos = parseFloat(entradas) || 0;
        const diur = parseFloat(diurese) || 0;
        const eme = parseFloat(emese) || 0;
        const comp = (parseFloat(compressas) || 0) * 300; // 300 mL por compressa
        const out = parseFloat(outrasPerdas) || 0;

        // Entradas Totais = Outras Entradas + Volume de Parkland Calculado
        const totalEntradas = entInsumos + parseFloat(volumeParklandML || 0);
        const totalSaidas = diur + eme + comp + out;
        const balancoFinal = totalEntradas - totalSaidas;

        // Parâmetros para Fórmula de Adrogué-Madias (Tonicidade)
        const p = parseFloat(peso) || 70;
        const naS = parseFloat(naSerico) || 140;
        const naI = parseFloat(naInfusao) || 130;

        // Água Corporal Total (ACT) estimada: ~60% do peso em adultos
        const act = p * 0.6;

        // Variação de Na+ por 1 Litro de infusão infundido
        const deltaNaPorLitro = (naI - naS) / (act + 1);

        // Variação total estimada de Na+ com base no volume total infundido em 24h
        const variacaoNaEstimada = deltaNaPorLitro * (totalEntradas / 1000);

        return {
            totalEntradas,
            totalSaidas,
            balancoFinal,
            perdaCompressasML: comp,
            variacaoNaEstimada: parseFloat(variacaoNaEstimada.toFixed(2)),
            naSericoProjetado: parseFloat((naS + variacaoNaEstimada).toFixed(1))
        };
    }

    /**
     * Calcula a Osmolalidade Sérica Estimada (mOsm/kg)
     */
    calculateOsmolality(sodio, glicemia, ureia) {
        const na = parseFloat(sodio) || 0;
        const gli = parseFloat(glicemia) || 0;
        const ur = parseFloat(ureia) || 0;

        if (na === 0) return null;

        const osmolalidade = (2 * na) + (gli / 18) + (ur / 6);
        
        let status = 'normal';
        let mensagem = 'Osmolalidade dentro dos parâmetros normais (275 - 295 mOsm/kg).';

        if (osmolalidade < 275) {
            status = 'hipoosmolar';
            mensagem = 'Atenção: Hipoosmolalidade sérica. Risco de edema celular / intoxicação por água.';
        } else if (osmolalidade > 295) {
            status = 'hiperosmolar';
            mensagem = 'Atenção: Hiperosmolalidade sérica. Risco de desidratação celular expressiva.';
        }

        return {
            valor: parseFloat(osmolalidade.toFixed(1)),
            status: status,
            mensagem: mensagem
        };
    }
}
