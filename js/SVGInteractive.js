export class SVGInteractive {
    // ... constructor e código existente ...

    setAgeGroup(idade) {
        // Tabela de Lund-Browder
        let propCabeca = 4.5; // Adulto (cada metade = 4.5%, total 9%)
        let propCoxa = 4.5;   // Adulto
        let propPerna = 3.5;  // Adulto

        if (idade < 1) {
            propCabeca = 9.5;
            propCoxa = 2.75;
            propPerna = 2.5;
        } else if (idade < 5) {
            propCabeca = 8.5;
            propCoxa = 3.25;
            propPerna = 2.5;
        } else if (idade < 10) {
            propCabeca = 6.5;
            propCoxa = 4.0;
            propPerna = 2.75;
        } else if (idade < 15) {
            propCabeca = 5.5;
            propCoxa = 4.25;
            propPerna = 3.0;
        }

        // Atualiza os data-attributes das regiões no SVG
        document.querySelectorAll('#cabeca_ant, #cabeca_post').forEach(el => el.dataset.porcentagem = propCabeca);
        document.querySelectorAll('[id^="coxa_"]').forEach(el => el.dataset.porcentagem = propCoxa);
        document.querySelectorAll('[id^="perna_"]').forEach(el => el.dataset.porcentagem = propPerna);

        // Atualiza o rótulo de faixa etária na tela
        const label = document.getElementById('faixa-etaria-label');
        if (label) label.innerText = idade < 15 ? `Pediátrico (${idade} anos)` : 'Adulto';
        
        // Recalcular SCQ total ativo
        this.recalcularSCQ();
    }
}
