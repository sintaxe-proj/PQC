/**
 * ReportGenerator.js - Gerador de Relatório Clínico em PDF
 */
export const ReportGenerator = {
    generatePDF(dadosPaciente, resultadosCalculos) {
        // Cria elemento temporário para o conteúdo do PDF
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.color = '#333';
        element.style.backgroundColor = '#fff';

        const dataAtual = new Date().toLocaleString('pt-BR');

        element.innerHTML = `
            <div style="border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #2c3e50; margin: 0; font-size: 22px;">PQC-HFA - Relatório de Assistência ao Queimado</h1>
                <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 12px;">Gerado em: ${dataAtual}</p>
            </div>

            <!-- Dados Identificatórios -->
            <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; margin-bottom: 15px;">
                <h3 style="margin-top: 0; color: #34495e; font-size: 14px; text-transform: uppercase;">1. Identificação do Paciente</h3>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                    <tr>
                        <td><strong>Paciente:</strong> ${dadosPaciente.nomePaciente || 'Não informado'}</td>
                        <td><strong>Idade:</strong> ${dadosPaciente.idade || '0'} anos</td>
                        <td><strong>Peso:</strong> ${dadosPaciente.peso || '0'} kg</td>
                    </tr>
                    <tr>
                        <td><strong>Tipo de Acidente:</strong> ${dadosPaciente.tipoAcidente || 'Térmico'}</td>
                        <td><strong>SCQ Total:</strong> <span style="color: #c0392b; font-weight: bold;">${dadosPaciente.scq || '0'}%</span></td>
                        <td><strong>Hora do Acidente:</strong> ${dadosPaciente.horaAcidente || 'N/A'}</td>
                    </tr>
                </table>
            </div>

            <!-- Ressuscitação Volêmica -->
            <div style="margin-bottom: 15px;">
                <h3 style="color: #34495e; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">2. Plano de Ressuscitação Volêmica</h3>
                <table style="width: 100%; font-size: 13px; margin-top: 8px;">
                    <tr>
                        <td><strong>Fórmula Utilizada:</strong> ${resultadosCalculos.formulaNome || 'Parkland/Consenso'}</td>
                        <td><strong>Volume Total (24h):</strong> ${Math.round(resultadosCalculos.volumeTotal24h || 0)} mL</td>
                    </tr>
                    <tr>
                        <td><strong>Primeiras 8h (Vazão):</strong> ${resultadosCalculos.vazaoAtaqueMLh ? resultadosCalculos.vazaoAtaqueMLh.toFixed(1) : 0} mL/h</td>
                        <td><strong>Próximas 16h (Vazão):</strong> ${resultadosCalculos.vazaoManutencaoMLh ? resultadosCalculos.vazaoManutencaoMLh.toFixed(1) : 0} mL/h</td>
                    </tr>
                </table>
            </div>

            <!-- Monitoramento e Débito Urinário -->
            <div style="margin-bottom: 15px;">
                <h3 style="color: #34495e; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">3. Monitoramento Hemodinâmico e Diurese</h3>
                <p style="font-size: 13px; margin: 5px 0;"><strong>Débito Urinário Medido:</strong> ${resultadosCalculos.debitoUrinario ? resultadosCalculos.debitoUrinario.toFixed(2) : '0.00'} mL/kg/h</p>
                <div style="background: #eef9ff; border-left: 4px solid #3498db; padding: 8px; font-size: 12px; margin-top: 5px;">
                    <strong>Conduta / Titulação Sugerida:</strong><br>
                    ${resultadosCalculos.ajusteInfusao || 'Manter parâmetros e reavaliar hora a hora.'}
                </div>
            </div>

            <!-- Checklist e Conduta de Curativos -->
            ${dadosPaciente.coberturaCurativo ? `
            <div style="margin-bottom: 15px;">
                <h3 style="color: #34495e; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">4. Avaliação de Feridas / Curativos</h3>
                <p style="font-size: 13px; margin: 3px 0;"><strong>Cobertura Utilizada:</strong> ${dadosPaciente.coberturaCurativo}</p>
                <p style="font-size: 13px; margin: 3px 0;"><strong>Aspecto do Exsudato:</strong> ${dadosPaciente.aspectoExsudato || 'Ausente/Seroso'}</p>
                <p style="font-size: 13px; margin: 3px 0;"><strong>Sinais Flogísticos / Infecção:</strong> ${dadosPaciente.sinaisInfeccao ? 'Sua presença exige atenção' : 'Ausentes'}</p>
            </div>
            ` : ''}

            <!-- Rodapé -->
            <div style="margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; font-size: 11px; color: #95a5a6;">
                Documento gerado automaticamente pelo Sistema PQC-HFA. Requer validação e assinatura do profissional responsável.
            </div>
        `;

        // Configurações do html2pdf
        const options = {
            margin:       [10, 10, 10, 10],
            filename:     `Relatorio_Queimadura_${(dadosPaciente.nomePaciente || 'Paciente').replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Verifica se a biblioteca html2pdf está disponível no escopo global
        if (typeof window.html2pdf !== 'undefined') {
            window.html2pdf().set(options).from(element).save();
        } else {
            console.warn('html2pdf não encontrado. Abrindo caixa de impressão do navegador...');
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`<html><head><title>Relatório PDF</title></head><body>${element.innerHTML}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }
};
