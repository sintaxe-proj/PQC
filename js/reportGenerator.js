// js/reportGenerator.js
// Módulo para exportação de dados e integração com Prontuário Eletrônico

export class ReportGenerator {
    static generatePEPSummary(data) {
        const agora = new Date().toLocaleString('pt-BR');
        return `
=== RESUMO DE ADMISSÃO E RESSUSCITAÇÃO VOLÊMICA (PQC-HFA) ===
Data do Relatório: ${agora}
Paciente: ${data.nome} | Leito: ${data.leito} | Setor: ${data.enfermaria}
Peso: ${data.peso} kg | Etiologia: ${data.tipoAcidente}
Data/Hora do Acidente: ${data.horaAcidente}

--- PARAMETROS CLÍNICOS ---
Superfície Corporal Queimada (SCQ): ${data.scq}%
Fator Aplicado (Parkland): ${data.fator} mL/kg/%SCQ
Volume Total Calculado (24h): ${data.volTotal} mL

--- PLANO DE INFUSÃO ---
Fase de Ataque (1ªs 8h): ${data.volAtaque} mL | Vazão: ${data.vazaoAtaque} mL/h
Fase de Manutenção (16h seguitas): ${data.volManutencao} mL | Vazão: ${data.vazaoManutencao} mL/h

--- BALANÇO HÍDRICO ACUMULADO ---
Entradas: ${data.entradas} mL | Saídas Totais: ${data.saidas} mL
Saldo Final: ${data.balanco} mL
===========================================================
        `.trim();
    }

    static copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }
}
