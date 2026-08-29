// js/piaModule.js
// Módulo de Avaliação de Pressão Intra-Abdominal (PIA) e Síndrome Compartimental Abdominal (SCA)
// Baseado nas diretrizes do WSACS (World Society of the Abdominal Compartment Syndrome)

export class PIAModule {
    /**
     * Avalia a PIA, PPA e estratifica o risco de HIA / SCA.
     * @param {number} valorPia - Valor bruto digitado
     * @param {string} unidade - 'mmHg' ou 'cmH2O'
     * @param {number} pam - Pressão Arterial Média em mmHg (opcional)
     * @param {boolean} temDisfuncaoOrgao - Presença de nova disfunção orgânica
     */
    static evaluate(valorPia, unidade = 'mmHg', pam = null, temDisfuncaoOrgao = false) {
        if (valorPia === null || valorPia === undefined || isNaN(valorPia) || valorPia <= 0) {
            return {
                status: 'nao_aferido',
                piammHg: 0,
                classificacao: 'Não aferida',
                ppa: null,
                isSCA: false,
                cor: 'var(--text-main)',
                conduta: 'Monitorização de PIA recomendada caso SCQ > 30% ou ressuscitação volêmica volumosa.'
            };
        }

        // Converte cmH2O para mmHg se necessário (1 mmHg = 1.36 cmH2O)
        let piammHg = valorPia;
        if (unidade === 'cmH2O') {
            piammHg = valorPia / 1.36;
        }

        piammHg = parseFloat(piammHg.toFixed(1));

        // Cálculo da PPA (Pressão de Perfusão Abdominal = PAM - PIA)
        let ppa = null;
        if (pam && !isNaN(pam) && pam > 0) {
            ppa = parseFloat((pam - piammHg).toFixed(1));
        }

        // Definições WSACS
        let classificacao = '';
        let status = '';
        let cor = '';
        let conduta = '';
        let isSCA = false;

        if (piammHg < 12) {
            status = 'normal';
            classificacao = `Normal (${piammHg} mmHg)`;
            cor = 'var(--accent-green)';
            conduta = 'Pressão intra-abdominal dentro da faixa de normalidade. Manter monitorização de rotina.';
        } else if (piammHg >= 12 && piammHg <= 15) {
            status = 'hia_1';
            classificacao = `HIA Grau I (${piammHg} mmHg)`;
            cor = '#F6E05E'; // Amarelo
            conduta = 'Hipertensão Intra-Abdominal Leve. Manter balanço hídrico neutro/evitar fluid creep, evacuar cólon/descompressão gástrica se indicado.';
        } else if (piammHg >= 16 && piammHg <= 20) {
            status = 'hia_2';
            classificacao = `HIA Grau II (${piammHg} mmHg)`;
            cor = '#ED8936'; // Laranja
            conduta = 'HIA Moderada. Otimizar complacência da parede abdominal (sedação/analgesia), descompressão de vísceras ocas e otimizar drenagem de coleções.';
        } else if (piammHg >= 21 && piammHg <= 25) {
            status = 'hia_3';
            classificacao = `HIA Grau III (${piammHg} mmHg)`;
            cor = '#E53E3E'; // Vermelho
            conduta = 'HIA Grave. Considerar remoção de fluidos (diuréticos/hemofiltração se hemodinamicamente estável). Avaliar descompressão cirúrgica de emergência caso haja deterioração clínica.';
        } else {
            status = 'hia_4';
            classificacao = `HIA Grau IV (>${piammHg} mmHg)`;
            cor = '#9B2C2C'; // Vermelho Escuro
            conduta = 'HIA Extrema. Risco iminente de colapso circulatório e isquemia visceral. Preparar para laparotomia descompressiva.';
        }

        // Diagnóstico de Síndrome Compartimental Abdominal (SCA)
        // WSACS: PIA > 20 mmHg sustentada + Nova Disfunção/Falência de Órgãos
        if (piammHg > 20 && temDisfuncaoOrgao) {
            isSCA = true;
            classificacao += ' + SÍNDROME COMPARTIMENTAL ABDOMINAL (SCA)';
            cor = '#9B2C2C';
            conduta = '🚨 **EMERGÊNCIA MÉDICA (SCA CONFIRMADA)**: PIA > 20 mmHg associada à falência de órgãos. Indicação formal de Laparotomia Descompressiva / Peritoniostomia e ressuscitação direcionada por metas de PPA (Meta PPA > 60 mmHg).';
        } else if (ppa !== null && ppa < 60 && piammHg >= 12) {
            // Hipoperfusão visceral por PPA baixa
            conduta += ` ⚠️ **Atenção:** PPA reduzida (${ppa} mmHg, Meta ≥ 60 mmHg). Risco acrescido de isquemia renal e mesentérica.`;
        }

        return {
            status,
            piammHg,
            classificacao,
            ppa,
            isSCA,
            cor,
            conduta
        };
    }
}
