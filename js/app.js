// js/app.js
// Controladora principal da interface e integração dos módulos fisiológicos e PIA

import { SVGInteractive } from './SVGInteractive.js';
import { FluidBalance } from './fluidBalance.js';
import { PIAModule } from './piaModule.js';

document.addEventListener('DOMContentLoaded', () => {
    const bodyMap = new SVGInteractive('body-map', 'scq-display');
    const fluidCalculator = new FluidBalance();

    const btnCalcular = document.getElementById('btn-calcular');
    const btnCopiar = document.getElementById('btn-copiar-prontuario');
    const pqcForm = document.getElementById('pqc-form');
    const inputDataNascimento = document.getElementById('dataNascimento');
    const labelFaixaEtaria = document.getElementById('faixa-etaria-label');

    // Botões de Seleção Rápida e Reset
    document.getElementById('btn-reset-mapa')?.addEventListener('click', () => {
        if (typeof bodyMap.limparSelecao === 'function') bodyMap.limparSelecao();
        else location.reload();
    });

    document.getElementById('btn-select-frente')?.addEventListener('click', () => {
        if (typeof bodyMap.selecionarGrupo === 'function') bodyMap.selecionarGrupo('visao-anterior');
    });

    document.getElementById('btn-select-verso')?.addEventListener('click', () => {
        if (typeof bodyMap.selecionarGrupo === 'function') bodyMap.selecionarGrupo('visao-posterior');
    });

    // Hora do acidente (Default para o momento atual caso esteja vazio)
    const inputHoraAcidente = document.getElementById('horaAcidente');
    if (inputHoraAcidente && !inputHoraAcidente.value) {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        inputHoraAcidente.value = agora.toISOString().slice(0, 16);
    }

    /**
     * Helper para calcular a idade exata com base na data de nascimento
     */
    function calcularIdade(dataNascVal) {
        if (!dataNascVal) return null;
        const dataNasc = new Date(dataNascVal);
        if (isNaN(dataNasc.getTime())) return null;

        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const m = hoje.getMonth() - dataNasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }
        return idade < 0 ? 0 : idade;
    }

    /**
     * Atualiza o mapa de Lund-Browder e as labels de faixa etária
     */
    function processarMudancaIdade() {
        if (!inputDataNascimento) return;
        const idade = calcularIdade(inputDataNascimento.value);

        if (idade === null) return;

        if (typeof bodyMap.atualizarLundBrowder === 'function') {
            bodyMap.atualizarLundBrowder(idade);
        }

        if (labelFaixaEtaria) {
            if (idade < 1) labelFaixaEtaria.innerText = 'Lund-Browder: Lactente (<1 ano)';
            else if (idade <= 4) labelFaixaEtaria.innerText = `Lund-Browder: Infantil (${idade} anos)`;
            else if (idade <= 9) labelFaixaEtaria.innerText = `Lund-Browder: Escolar (${idade} anos)`;
            else if (idade <= 14) labelFaixaEtaria.innerText = `Lund-Browder: Jovem (${idade} anos)`;
            else labelFaixaEtaria.innerText = 'Lund-Browder: Adulto (15+ anos)';
        }
    }

    // Ouvinte e execução inicial caso o campo venha preenchido (ex: autocomplete do browser)
    if (inputDataNascimento) {
        inputDataNascimento.addEventListener('change', processarMudancaIdade);
        if (inputDataNascimento.value) processarMudancaIdade();
    }

    /**
     * Helper sanitizador para extração da SCQ a partir do DOM
     */
    function obterSCQ() {
        const scqElement = document.getElementById('scq-display');
        if (!scqElement) return 0;
        const texto = scqElement.innerText || '0';
        const sanitizado = texto.replace(/[^\d.,]/g, '').replace(',', '.');
        return parseFloat(sanitizado) || 0;
    }

    // Evento de Cálculo
    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            if (pqcForm && !pqcForm.checkValidity()) {
                pqcForm.reportValidity();
                return;
            }

            const peso = parseFloat(document.getElementById('peso')?.value) || 0;
            const altura = parseFloat(document.getElementById('altura')?.value) || 170;
            const tipoAcidente = document.getElementById('tipoAcidente')?.value || 'direto';
            const faseRessuscitacao = document.getElementById('faseRessuscitacao')?.value || 'fase1';
            const horaAcidenteVal = document.getElementById('horaAcidente')?.value;
            const scq = obterSCQ();

            // Resolução da Idade dinâmica no momento do cálculo (Default: 30 anos se não informado)
            const idadeCalculada = calcularIdade(inputDataNascimento?.value) ?? 30;

            if (scq === 0) {
                alert('Por favor, selecione ao menos uma região do corpo afetada no mapa.');
                return;
            }

            // Parkland (Diretrizes: 4 mL para elétrico/inflamável; 2 mL para queimadura térmica padrão)
            const fatoresElevados = ['inflamavel', 'eletrico'];
            const fatorParkland = fatoresElevados.includes(tipoAcidente) ? 4 : 2;
            const volumeTotal24h = fatorParkland * peso * scq;

            // Tempo
            const dataAcidente = horaAcidenteVal ? new Date(horaAcidenteVal) : new Date();
            const agora = new Date();
            const diffHoras = Math.max(0, (agora - dataAcidente) / (1000 * 60 * 60));

            const volAtaque = volumeTotal24h * 0.5;
            const tempoRestanteAtaque = Math.max(8 - diffHoras, 0.5);
            const vazaoAtaqueMLh = volAtaque / tempoRestanteAtaque;

            // Parâmetros de Perfusão
            const lactato = document.getElementById('lactato')?.value;
            const svco2 = document.getElementById('svco2')?.value;
            const pam = document.getElementById('pam')?.value;

            // Avaliação Renal e Fisiológica
            const diureseVal = document.getElementById('diurese')?.value;
            const horasDiureseVal = document.getElementById('horasDiurese')?.value;
            const avaliacaoRenal = fluidCalculator.evaluateUrineOutput(diureseVal, horasDiureseVal, peso, idadeCalculada, lactato, pam, svco2);

            // Balanço Hídrico, Perda Evaporativa e Coloides
            const balancoResult = fluidCalculator.calculate({
                entradas: document.getElementById('entradas')?.value,
                diurese: diureseVal,
                emese: document.getElementById('emese')?.value,
                compressas: document.getElementById('compressas')?.value,
                outrasPerdas: document.getElementById('outrasPerdas')?.value,
                peso,
                altura,
                scq,
                naSerico: document.getElementById('naSerico')?.value,
                naInfusao: document.getElementById('naInfusao')?.value,
                volumeParklandML: volumeTotal24h,
                faseRessuscitacao
            });

            // PIA / SCA
            const valPia = parseFloat(document.getElementById('piaValor')?.value);
            const unidadePia = document.getElementById('piaUnidade')?.value || 'mmHg';
            const valPam = parseFloat(pam);
            const temDisfuncao = document.getElementById('disfuncaoOrgao')?.value === 'sim';

            const avaliacaoPIA = PIAModule.evaluate(valPia, unidadePia, valPam, temDisfuncao);

            // Renderização no Painel
            document.getElementById('res-fator').innerText = `${fatorParkland} mL/kg/% SCQ`;
            document.getElementById('res-vol-total').innerText = `${volumeTotal24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            document.getElementById('res-vazao-ataque').innerText = `${vazaoAtaqueMLh.toFixed(1)} mL/h (${volAtaque.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL em ${tempoRestanteAtaque.toFixed(1)}h)`;

            document.getElementById('res-diurese-kgh').innerText = `${avaliacaoRenal.diureseKgH} mL/kg/h (Meta: ${avaliacaoRenal.metaTexto})`;
            const elAjuste = document.getElementById('res-ajuste-bomba');
            if (elAjuste) {
                elAjuste.innerText = avaliacaoRenal.recomendacao;
                elAjuste.style.color = avaliacaoRenal.status === 'oliguria' ? 'var(--accent-red)' : (avaliacaoRenal.status === 'poliuria' ? 'var(--accent-amber)' : 'var(--accent-green)');
            }

            document.getElementById('res-perda-evaporativa').innerText = `${balancoResult.perdaEvaporativa24h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
            const elBalanco = document.getElementById('res-balanco');
            if (elBalanco) {
                const sinal = balancoResult.balancoFinal > 0 ? '+' : '';
                elBalanco.innerText = `${sinal}${balancoResult.balancoFinal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mL`;
                elBalanco.style.color = balancoResult.balancoFinal < 0 ? 'var(--accent-red)' : 'var(--accent-green)';
            }

            const elImpactoNa = document.getElementById('res-impacto-na');
            if (elImpactoNa) {
                const sinalNa = balancoResult.variacaoNaEstimada > 0 ? '+' : '';
                elImpactoNa.innerText = `${sinalNa}${balancoResult.variacaoNaEstimada} mEq/L (Proj: ${balancoResult.naSericoProjetado} mEq/L)`;
            }

            // Painel Alerta Fisiológico (Lactato x Diurese)
            const painelFisio = document.getElementById('painel-alerta-fisiologico');
            const tituloFisio = document.getElementById('alerta-fisio-titulo');
            const msgFisio = document.getElementById('alerta-fisio-msg');

            if (painelFisio && avaliacaoRenal.alertaFisiologico) {
                painelFisio.style.display = 'block';
                if (tituloFisio) tituloFisio.innerText = avaliacaoRenal.alertaFisiologico.titulo;
                if (msgFisio) msgFisio.innerHTML = avaliacaoRenal.alertaFisiologico.mensagem;
            } else if (painelFisio) {
                painelFisio.style.display = 'none';
            }

            // Painel Albumina
            const painelAlbumina = document.getElementById('painel-albumina');
            const msgAlbumina = document.getElementById('albumina-msg');

            if (painelAlbumina && balancoResult.recomendacaoAlboumina) {
                painelAlbumina.style.display = 'block';
                if (msgAlbumina) msgAlbumina.innerHTML = balancoResult.recomendacaoAlboumina.mensagem;
            } else if (painelAlbumina) {
                painelAlbumina.style.display = 'none';
            }

            // PIA & PPA
            const elPiaClass = document.getElementById('res-pia-class');
            if (elPiaClass) {
                elPiaClass.innerText = avaliacaoPIA.classificacao;
                elPiaClass.style.color = avaliacaoPIA.cor;
            }

            const elPpaVal = document.getElementById('res-ppa-valor');
            if (elPpaVal) {
                elPpaVal.innerText = avaliacaoPIA.ppa !== null ? `${avaliacaoPIA.ppa} mmHg (Meta ≥ 60)` : 'PAM não informada';
                if (avaliacaoPIA.ppa !== null && avaliacaoPIA.ppa < 60) elPpaVal.style.color = 'var(--accent-red)';
                else if (avaliacaoPIA.ppa !== null) elPpaVal.style.color = 'var(--accent-green)';
            }

            // SCA
            const painelSCA = document.getElementById('painel-sca');
            const tituloSCA = document.getElementById('sca-titulo');
            const condutaSCA = document.getElementById('sca-conduta');

            if (painelSCA && avaliacaoPIA.status !== 'nao_aferido') {
                painelSCA.style.display = 'block';
                painelSCA.style.background = avaliacaoPIA.isSCA ? 'rgba(155, 44, 44, 0.25)' : 'rgba(255, 255, 255, 0.05)';
                painelSCA.style.borderLeft = `4px solid ${avaliacaoPIA.cor}`;
                if (tituloSCA) {
                    tituloSCA.innerText = `Estratificação PIA: ${avaliacaoPIA.classificacao}`;
                    tituloSCA.style.color = avaliacaoPIA.cor;
                }
                if (condutaSCA) condutaSCA.innerHTML = avaliacaoPIA.conduta;
            } else if (painelSCA) {
                painelSCA.style.display = 'none';
            }

            // Pediátrico (Holliday-Segar para menores de 15 anos)
            const painelPeds = document.getElementById('painel-pediatrico');
            const resHolliday = document.getElementById('res-holliday');
            if (idadeCalculada < 15) {
                const holliday = fluidCalculator.calculateHollidaySegar(peso);
                if (holliday && painelPeds && resHolliday) {
                    painelPeds.style.display = 'block';
                    resHolliday.innerHTML = `<strong>Manutenção Basal:</strong> ${holliday.volume24h} mL/24h (${holliday.vazaoHora} mL/h)<br><strong>Composição Sugerida:</strong> ${holliday.solucaoSugerida}`;
                }
            } else if (painelPeds) {
                painelPeds.style.display = 'none';
            }

            // Fluid Creep
            const painelCreep = document.getElementById('alerta-fluid-creep');
            if (painelCreep) {
                if (scq >= 50 || volumeTotal24h > (peso * 250) || (avaliacaoPIA.piammHg && avaliacaoPIA.piammHg >= 16)) {
                    painelCreep.style.display = 'block';
                } else {
                    painelCreep.style.display = 'none';
                }
            }
        });
    }

    // Copiar Evolução para Prontuário
    if (btnCopiar) {
        btnCopiar.addEventListener('click', () => {
            const peso = document.getElementById('peso')?.value || '0';
            const scq = document.getElementById('scq-display')?.innerText || '0%';

            // Mapeamento dinâmico e seguro da fase de ressuscitacao
            const elFase = document.getElementById('faseRessuscitacao');
            const faseMap = {
                'fase1': 'Fase 1 (0-12h)',
                'fase2': 'Fase 2 (12-24h)',
                'manutencao': 'Fase de Manutenção / Estabilização (>24h)'
            };
            const fase = faseMap[elFase?.value] || elFase?.options[elFase.selectedIndex]?.text || 'Fase não especificada';

            const volTotal = document.getElementById('res-vol-total')?.innerText || '0 mL';
            const vazaoAtaque = document.getElementById('res-vazao-ataque')?.innerText || '0 mL/h';
            const diureseAferida = document.getElementById('res-diurese-kgh')?.innerText || '--';
            const ajusteBomba = document.getElementById('res-ajuste-bomba')?.innerText || '--';
            const balanco = document.getElementById('res-balanco')?.innerText || '0 mL';
            const piaClass = document.getElementById('res-pia-class')?.innerText || 'Não aferida';
            const ppaVal = document.getElementById('res-ppa-valor')?.innerText || '--';

            const lactato = document.getElementById('lactato')?.value;
            const svco2 = document.getElementById('svco2')?.value;
            const pam = document.getElementById('pam')?.value;

            let perfusaoStr = 'Não informada';
            if (lactato || svco2 || pam) {
                perfusaoStr = `PAM: ${pam || '--'} mmHg | Lactato: ${lactato || '--'} mmol/L | SvcO₂: ${svco2 || '--'}%`;
            }

            const textoProntuario = `[EVOLUÇÃO PQC - RESSUSCITAÇÃO VOLÊMICA, PERFUSÃO & PIA]
Fase: ${fase} | Peso: ${peso} kg | SCQ: ${scq}
--------------------------------------------------
PERFUSÃO TISSULAR: ${perfusaoStr}
• Diurese Real Aferida: ${diureseAferida}
• Conduta / Ajuste na Bomba: ${ajusteBomba}
• Volume Parkland (24h): ${volTotal} (Vazão Ataque: ${vazaoAtaque})
• Balanço Hídrico (com perdas evaporativas): ${balanco}
--------------------------------------------------
MONITORIZAÇÃO ABDOMINAL (WSACS):
• Classificação PIA: ${piaClass}
• Pressão de Perfusão Abdominal (PPA): ${ppaVal}
--------------------------------------------------
Avaliação contínua para prevenção de Fluid Creep, SCA e transição para coloides conforme estabilização capilar.`;

            navigator.clipboard.writeText(textoProntuario).then(() => {
                alert('Evolução anônima copiada com sucesso para a área de transferência!');
            }).catch(() => {
                alert('Erro ao copiar automaticamente.');
            });
        });
    }

    // Registro do Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[PQC-HFA PWA] SW ativo:', reg.scope))
                .catch((err) => console.error('[PQC-HFA PWA] Falha SW:', err));
        });
    }
});
