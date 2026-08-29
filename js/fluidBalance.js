// js/fluidBalance.js
// Módulo de Balanço Hídrico Avançado, Avaliação Renal e Perfusoômetro Tecidual

export class FluidBalance {
    /**
     * Avalia a diurese e os indicadores de perfusão tecidual.
     * Previne a armadilha da hiper-ressuscitação (Fluid Creep) quando o lactato está normal.
     */
    evaluateUrineOutput(diurese, horas, peso, idade, lactato = null, pam = null, svco2 = null) {
        const diureseNum = parseFloat(diurese) || 0;
        const horasNum = parseFloat(horas) || 1;
        const pesoNum = parseFloat(peso) || 1;
        
        if (horasNum <= 0 || pesoNum <= 0) {
            return {
                diureseKgH: '0.00',
                metaTexto: '0.5 a 1.0 mL/kg/h',
                status: 'indeterminado',
                recomendacao: 'Insira o peso e período aferido.',
                alertaFisiologico: null
            };
        }

        const diureseKgH = parseFloat((diureseNum / horasNum / pesoNum).toFixed(2));
        const metaMin = idade < 15 ? 1.0 : 0.5;
        const metaMax = idade < 15 ? 1.5 : 1.0;
        const metaTexto = `${metaMin.toFixed(1)} a ${metaMax.toFixed(1)} mL/kg/h`;

        let status = 'adequado';
        let recomendacao = 'Manter vazão atual da bomba de infusão.';

        if (diureseKgH < metaMin) {
            status = 'oliguria';
            recomendacao = 'Aumentar vazão de cristaloides em 20% a 30%.';
        } else if (diureseKgH > metaMax) {
            status = 'poliuria';
            recomendacao = 'Reduzir vazão de cristaloides em 20% a 30%.';
        }

        // --- AJUSTE FISIOLÓGICO FINO (PERFUSÃO TISSULAR X DIURESE) ---
        let alertaFisiologico = null;
        const lactatoNum = parseFloat(lactato);
        const pamNum = parseFloat(pam);
        const svco2Num = parseFloat(svco2);

        const perfusaoNormal = (
            (!isNaN(lactatoNum) && lactatoNum <= 2.0) || 
            (!isNaN(svco2Num) && svco2Num >= 70)
        );
        const pamAdequada = isNaN(pamNum) || pamNum >= 65;

        // Se há oligúria, mas a perfusão tecidual e PAM estão preservadas:
        if (status === 'oliguria' && perfusaoNormal && pamAdequada) {
            recomendacao = '⚠️ MANTER VAZÃO (NÃO AUMENTAR). Perfusão tecidual preservada.';
            alertaFisiologico = {
                tipo: 'warning',
                titulo: '⚠️ Oligúria Refratária com Perfusão Preservada',
                mensagem: 'Diurese abaixo da meta, mas **Lactato normal/SvcO₂ ≥ 70%** e PAM adequada. **NÃO aumente os cristaloides** para evitar *Fluid Creep*. Investigue lesão renal prévia, disfunção miocárdica ou elevação da Pressão Intra-Abdominal (PIA).'
            };
        }

        return {
            diureseKgH: diureseKgH.toFixed(2),
            metaTexto,
            status,
            recomendacao,
            alertaFisiologico
        };
    }

    /**
     * Calcula o balanço hídrico, perda evaporativa, impacto no sódio e transição para Álbumina.
     */
    calculate(params) {
        const {
            entradas = 0,
            diurese = 0,
            emese = 0,
            compressas = 0,
            outrasPerdas = 0,
            peso = 0,
            altura = 170,
            scq = 0,
            naSerico = 140,
            naInfusao = 130,
            volumeParklandML = 0,
            faseRessuscitacao = 'fase1'
        } = params;

        const pesoNum = parseFloat(peso) || 0;
        const alturaNum = parseFloat(altura) || 170;
        const scqNum = parseFloat(scq) || 0;
        const entradasNum = parseFloat(entradas) || 0;
        const diureseNum = parseFloat(diurese) || 0;
        const emeseNum = parseFloat(emese) || 0;
        const compressasNum = parseFloat(compressas) || 0;
        const outrasPerdasNum = parseFloat(outrasPerdas) || 0;

        // Perda Evaporativa em 24h: (25 + SCQ) * Área Superfície Corporal (m²) * 24
        // ASC (Mosteller) = sqrt((Peso * Altura) / 3600)
        const asc = Math.sqrt((pesoNum * alturaNum) / 3600);
        const perdaEvaporativa24h = (25 + scqNum) * asc * 24;

        // Perdas totais mensuráveis + evaporativa proporcional
        const perdasTotais = diureseNum + emeseNum + (compressasNum * 300) + outrasPerdasNum + (perdaEvaporativa24h / 24);
        const balancoFinal = entradasNum - perdasTotais;

        // Variação de Sódio Estimada (Fórmula de Adrogué-Madias)
        const tbw = pesoNum * 0.6; // Agua Corporal Total estimada
        const infNa = parseFloat(naInfusao) || 130;
        const curNa = parseFloat(naSerico) || 140;
        const variacaoNaEstimada = parseFloat(((infNa - curNa) / (tbw + 1)).toFixed(2));
        const naSericoProjetado = parseFloat((curNa + variacaoNaEstimada).toFixed(1));

        // --- MÓDULO DE TRANSIÇÃO: PROTOCOLO DE ÁLBUMINA (12-24h) ---
        let recomendacaoAlboumina = null;
        if (faseRessuscitacao === 'fase2' && scqNum > 30) {
            // Sugestão: 0.3 a 0.5 mL de Álbumina a 20% por kg por %SCQ
            const volAlbuminaMin = 0.3 * pesoNum * scqNum;
            const volAlbuminaMax = 0.5 * pesoNum * scqNum;
            
            // Redução proporcional no Ringer Lactato (reduz ~20% a 30% da infusão de cristaloides)
            recomendacaoAlboumina = {
                indicado: true,
                dosagemMin: Math.round(volAlbuminaMin),
                dosagemMax: Math.round(volAlbuminaMax),
                mensagem: `Fase de restabelecimento capilar (12-24h) com SCQ > 30%. **Indicação de Álbumina Humana 20%**: Administrar de **${Math.round(volAlbuminaMin)} mL a ${Math.round(volAlbuminaMax)} mL** nas próximas 12h. Reduzir a taxa de Ringer Lactato em 25% para evitar edema e SCA.`
            };
        } else if (faseRessuscitacao === 'fase2' && scqNum <= 30) {
            recomendacaoAlboumina = {
                indicado: false,
                mensagem: 'Fase 2 (12-24h): SCQ ≤ 30%. Manter ressuscitação baseada primariamente em cristaloides, a menos que haja hipoalbuminemia grave (< 2.0 g/dL).'
            };
        }

        return {
            perdaEvaporativa24h: Math.round(perdaEvaporativa24h),
            balancoFinal: Math.round(balancoFinal),
            variacaoNaEstimada,
            naSericoProjetado,
            recomendacaoAlboumina
        };
    }

    /**
     * Suporte para Cálculo Pediátrico Basal (Holliday-Segar)
     */
    calculateHollidaySegar(peso) {
        const p = parseFloat(peso) || 0;
        if (p <= 0) return null;

        let vol = 0;
        if (p <= 10) vol = p * 100;
        else if (p <= 20) vol = 1000 + (p - 10) * 50;
        else vol = 1500 + (p - 20) * 20;

        return {
            volume24h: Math.round(vol),
            vazaoHora: Math.round(vol / 24),
            solucaoSugerida: 'Soro Glicosado 5% com NaCl 0.45% + KCl 20 mEq/L'
        };
    }
}
