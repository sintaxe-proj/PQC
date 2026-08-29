/**
 * SVGInteractive.js - Módulo de Interatividade e Tabela de Lund-Browder
 */
export class SVGInteractive {
    constructor(svgElementId, onUpdateCallback) {
        this.svgElement = document.getElementById(svgElementId);
        this.onUpdateCallback = onUpdateCallback;
        this.selectedRegions = new Set();
        this.currentAge = 25; // Default Adulto

        if (this.svgElement) {
            this.init();
        } else {
            console.warn(`Elemento SVG com id '${svgElementId}' não foi encontrado.`);
        }
    }

    init() {
        // Adiciona evento de clique em todos os caminhos/grupos interativos do SVG
        const clickableElements = this.svgElement.querySelectorAll('[data-porcentagem], path, g');
        
        clickableElements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', (e) => this.toggleRegion(e.currentTarget));
        });

        // Aplica tabela inicial
        this.setAgeGroup(this.currentAge);
    }

    /**
     * Tabela de Lund-Browder: Atualiza as proporções corporais com base na idade (0 a 15+ anos)
     */
    setAgeGroup(idade) {
        this.currentAge = parseFloat(idade) || 0;

        // Proporções por região (valores base por lado/metade quando aplicável)
        let propCabeca = 4.5; // Adulto (Frontal: 4.5%, Posterior: 4.5% = 9% total)
        let propCoxa = 4.5;   // Adulto (Cada coxa ant/post = 4.5%)
        let propPerna = 3.5;  // Adulto (Cada perna ant/post = 3.5%)

        if (this.currentAge < 1) {
            propCabeca = 9.5;
            propCoxa = 2.75;
            propPerna = 2.5;
        } else if (this.currentAge < 5) {
            propCabeca = 8.5;
            propCoxa = 3.25;
            propPerna = 2.5;
        } else if (this.currentAge < 10) {
            propCabeca = 6.5;
            propCoxa = 4.0;
            propPerna = 2.75;
        } else if (this.currentAge < 15) {
            propCabeca = 5.5;
            propCoxa = 4.25;
            propPerna = 3.0;
        }

        // Atualiza os data-attributes no SVG de forma dinâmica
        this.updateRegionData('#cabeca_ant, #cabeca_post, [id*="cabeca"]', propCabeca);
        this.updateRegionData('[id*="coxa"]', propCoxa);
        this.updateRegionData('[id*="perna"]', propPerna);

        // Atualiza o indicador textual na interface se existir
        const labelEtaria = document.getElementById('faixa-etaria-label');
        if (labelEtaria) {
            labelEtaria.innerText = this.currentAge < 15 ? `Pediátrico (${this.currentAge} anos)` : 'Adulto (15+ anos)';
        }

        // Recalcula o SCQ total com os novos valores
        this.recalcularSCQ();
    }

    updateRegionData(selector, porcentagem) {
        if (!this.svgElement) return;
        const elements = this.svgElement.querySelectorAll(selector);
        elements.forEach(el => {
            el.dataset.porcentagem = porcentagem;
        });
    }

    toggleRegion(element) {
        const id = element.id || element.getAttribute('name');
        if (!id) return;

        if (this.selectedRegions.has(id)) {
            this.selectedRegions.delete(id);
            element.classList.remove('selected', 'active');
            element.style.fill = ''; // Reseta para a cor original
        } else {
            this.selectedRegions.add(id);
            element.classList.add('selected', 'active');
            element.style.fill = '#e74c3c'; // Destaque visual (vermelho queimadura)
        }

        this.recalcularSCQ();
    }

    recalcularSCQ() {
        let totalSCQ = 0;

        this.selectedRegions.forEach(regionId => {
            const el = this.svgElement.querySelector(`#${regionId}`);
            if (el && el.dataset.porcentagem) {
                totalSCQ += parseFloat(el.dataset.porcentagem) || 0;
            }
        });

        // Limita o máximo teórico a 100%
        totalSCQ = Math.min(totalSCQ, 100);

        // Dispara o callback para notificar a aplicação principal (app.js)
        if (typeof this.onUpdateCallback === 'function') {
            this.onUpdateCallback(totalSCQ, Array.from(this.selectedRegions));
        }

        return totalSCQ;
    }

    getSelectedRegions() {
        return Array.from(this.selectedRegions);
    }

    reset() {
        this.selectedRegions.clear();
        if (this.svgElement) {
            const elements = this.svgElement.querySelectorAll('.selected, .active');
            elements.forEach(el => {
                el.classList.remove('selected', 'active');
                el.style.fill = '';
            });
        }
        this.recalcularSCQ();
    }
}
