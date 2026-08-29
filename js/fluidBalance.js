/**
 * FluidBalance.js - Balanço Hídrico e Cálculo de Osmolaridade
 */
export class FluidBalance {
    constructor() {}

    /**
     * Realiza o cálculo do Balanço Hídrico
     */
    calculate({ entradas = 0, diurese = 0, emese = 0, compressas = 0, outrasPerdas = 0 }) {
        const ent = parseFloat(entradas) || 0;
        const diur = parseFloat(diurese) || 0;
        const eme = parseFloat(emese) || 0;
        
        // Conversão: cada compressa operatória/queimadura embebida calcula ~300mL
        const comp = (parseFloat(compressas) || 0) * 300; 
        const out = parseFloat(outrasPerdas) || 0;

        const totalSaidas = diur + eme + comp + out;
        const balancoFinal = ent - totalSaidas;

        return {
            totalEntradas: ent,
            totalSaidas: totalSaidas,
            balancoFinal: balancoFinal,
            perdaCompressasML: comp
        };
    }

    /**
     * Calcula a Osmolalidade Sérica Estimada (mOsm/kg)
     * Fórmula: 2 * Na + (Glicemia / 18) + (Ureia / 6)
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
