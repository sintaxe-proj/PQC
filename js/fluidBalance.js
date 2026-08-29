/**
 * FluidBalance.js - Balanço Hídrico, Osmolaridade e Fisiologia Avançada do Queimado
 */
export class FluidBalance {
    constructor() {}

    /**
     * Calcula a Superfície Corporal Total (m²) via Fórmula de DuBois
     */
    calculateBSADuBois(pesoKg, alturaCm) {
        if (!pesoKg || !alturaCm) return 1.73; // Média padrão adulto
        return 0.007184 * Math.pow(pesoKg, 0.425) * Math.pow(alturaCm, 0.725);
    }

    /**
     * Estimativa de Perda Evaporativa Insensível na pele lesada (mL/24h)
     * Fórmula: Perda (mL/h) = (25 + %SCQ) * Superfície Corporal (m²)
     */
    calculateEvaporativeLoss(scq, pesoKg, alturaCm) {
        const bsa = this.calculateBSADuBois(pesoKg, alturaCm);
        const perdaHora = (25 + parseFloat(scq || 0)) * bsa;
        return {
            perdaHora: parseFloat(perdaHora.toFixed(1)),
            perda24h: parseFloat((perdaHora * 24).toFixed(1))
        };
    }

    /**
     * Avalia a Diurese Real e sugere a alteração da vazão da Bomba de Infusão
     */
    evaluateUrineOutput(diureseML, horas, pesoKg, idadeAnos) {
        const dML = parseFloat(diureseML) || 0;
        const h = parseFloat(horas) || 1;
        const p = parseFloat(pesoKg) || 1;

        if (dML === 0 || h === 0) return { diureseKgH: 0, status: 'indefinido', ajustePercentual: 0, recomendacao: 'Aguardando dados de diurese' };

        const diureseKgH = dML / h / p;
        const isPediatrico = idadeAnos < 15;

        // Metas: Adulto (0.5 a 1.0 mL/kg/h) | Pediátrico (1.0 a 1.5 mL/kg/h)
        const metaMin = isPediatrico ? 1.0 : 0.5;
        const metaMax = isPediatrico ? 1.5 : 1.0;

        let status = 'adequada';
        let ajustePercentual = 0;
        let recomendacao = 'Manter vazão atual da bomba';

        if (diureseKgH < metaMin) {
            status = 'oliguria';
            ajustePercentual = 20; // Aumentar infusão em 20%
            recomendacao = 'AUMENTAR vazão da bomba em +20% (Sub-ressuscitação)';
        } else if (diureseKgH > metaMax) {
            status = 'poliuria';
            ajustePercentual = -20; // Reduzir infusão em 20%
            recomendacao = 'REDUZIR vazão da bomba em -20% (Risco de Fluid Creep)';
        }

        return {
            diureseKgH: parseFloat(diureseKgH.toFixed(2)),
            status,
            ajustePercentual,
            recomendacao,
            metaTexto: `${metaMin} - ${metaMax} mL/kg/h`
        };
    }

    /**
     * Calcula a Hidratação Basal de Manutenção Pediátrica (Holliday-Segar)
     */
    calculateHollidaySegar(pesoKg) {
        const p = parseFloat(pesoKg) || 0;
        if (p <= 0 || p >= 50) return null;

        let volume24h = 0;
        if (p <= 10) {
            volume24h = p * 100;
        } else if (p <= 20) {
            volume24h = 1000 + (p - 10) * 50;
        } else {
            volume24h = 1500 + (p - 20) * 20;
        }

        const vazaoHora = volume24h / 24;

        return {
            volume24h: Math.round(volume24h),
            vazaoHora: parseFloat(vazaoHora.toFixed(1)),
            solucaoSugerida: 'SG 5% + NaCl 20% (30 mL/L) + KCl 19.1% (15 mL/L) - Evitar Hipoglicemia'
        };
    }

    /**
     * Realiza o cálculo do Balanço Hídrico Completo
     */
    calculate({ entradas = 0, diurese = 0, emese = 0, compressas = 0, outrasPerdas = 0, peso = 70, altura = 170, scq = 0, naSerico = 140, naInfusao = 130, volumeParklandML = 0 }) {
        const entInsumos = parseFloat(entradas) || 0;
        const diur = parseFloat(diurese) || 0;
        const eme = parseFloat(emese) || 0;
        const comp = (parseFloat(compressas) || 0) * 300;
        const out = parseFloat(outrasPerdas) || 0;

        // Estimativa da perda por evaporação lesada nas 24h
        const evaporacao = this.calculateEvaporativeLoss(scq, peso, altura);

        const totalEntradas = entInsumos + parseFloat(volumeParklandML || 0);
        const totalSaidas = diur + eme + comp + out + evaporacao.perda24h;
        const balancoFinal = totalEntradas - totalSaidas;

        // Adrogué-Madias
        const p = parseFloat(peso) || 70;
        const naS = parseFloat(naSerico) || 140;
        const naI = parseFloat(naInfusao) || 130;
        const act = p * 0.6;

        const deltaNaPorLitro = (naI - naS) / (act + 1);
        const variacaoNaEstimada = deltaNaPorLitro * (totalEntradas / 1000);

        return {
            totalEntradas,
            totalSaidas,
            balancoFinal,
            perdaCompressasML: comp,
            perdaEvaporativa24h: evaporacao.perda24h,
            variacaoNaEstimada: parseFloat(variacaoNaEstimada.toFixed(2)),
            naSericoProjetado: parseFloat((naS + variacaoNaEstimada).toFixed(1))
        };
    }
}
