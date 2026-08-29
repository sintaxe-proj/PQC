/**
 * SVGInteractive.js - Módulo de Interatividade e Tabela de Lund-Browder
 */
export class SVGInteractive {
    constructor(svgElementId, onUpdateCallback) {
        this.svgElement = document.getElementById(svgElementId);
        
        // Trata o parâmetro caso seja passado uma String de ID em vez de uma função callback
        if (typeof onUpdateCallback === 'string') {
            const elementId = onUpdateCallback;
            this.onUpdateCallback = (totalSCQ) => {
                const displayEl = document.getElementById(elementId);
                if (displayEl) {
                    displayEl.innerText = `${totalSCQ.toFixed(1)}%`;
                }
            };
        } else {
            this.onUpdateCallback = onUpdateCallback;
        }

        this.selectedRegions = new Set();
        this.currentAge = 25; // Default Adulto

        if (this.svgElement) {
            this.init();
        } else {
            console.warn(`Elemento SVG com id '${svgElementId}' não foi encontrado.`);
        }
    }

    init() {
        // Busca elementos interativos com ID ou atributos válidos
        const clickableElements = this.svgElement.querySelectorAll('.burn-region, [data-porcentagem], path, rect, polygon');
        
        clickableElements.forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Sobe até o ancestral mais próximo que possua ID ou data-porcentagem
                let target = e.currentTarget;
                if (!target.id && !target.dataset.porcentagem && target.parentElement) {
                    target = target.closest('[id], [data-porcentagem]') || target;
                }
                
                this.toggleRegion(target);
            });
        });

        // Aplica tabela inicial de Lund-Browder
        this.setAgeGroup(this.currentAge);
    }

    /**
     * Tabela de Lund-Browder: Atualiza as proporções corporais com base na idade (0 a 15+ anos)
     */
    setAgeGroup(idade) {
        this.currentAge = parseFloat(idade) || 0;

        // Proporções por região (valores base por lado/metade)
        let propCabeca = 4.5; // Adulto (Ant: 4.5%, Post: 4.5%)
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

        // Atualiza os data-attributes no SVG dinamicamente
        this.updateRegionData('#cabeca_ant, #cabeca_post, [id*="cabeca"]', propCabeca);
        this.updateRegionData('[id*="coxa"]', propCoxa);
        this.updateRegionData('[id*="perna"]', propPerna);

        // Indicador de faixa etária na UI
        const labelEtaria = document.getElementById('faixa-etaria-label');
        if (labelEtaria) {
            labelEtaria.innerText = this.currentAge < 15 ? `Pediátrico (${this.currentAge} anos)` : 'Adulto (15+ anos)';
        }

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
        
        // Se não houver id direto, utiliza a referência do elemento
        const key = id || element;

        if (this.selectedRegions.has(key)) {
            this.selectedRegions.delete(key);
            element.classList.remove('selected', 'active');
            element.style.fill = ''; 
        } else {
            this.selectedRegions.add(key);
            element.classList.add('selected', 'active');
            element.style.fill = '#dc2626'; // Vermelho de destaque da queimadura
        }

        this.recalcularSCQ();
    }

    recalcularSCQ() {
        let totalSCQ = 0;

        this.selectedRegions.forEach(key => {
            let el = null;
            if (typeof key === 'string') {
                el = this.svgElement.querySelector(`#${key}`) || this.svgElement.querySelector(`[name="${key}"]`);
            } else {
                el = key;
            }

            if (el) {
                // Tenta buscar o valor do data-porcentagem no elemento ou nos seus dataset
                const val = parseFloat(el.dataset.porcentagem || el.getAttribute('data-porcentagem')) || 0;
                totalSCQ += val;
            }
        });

        // Trava no limite de 100%
        totalSCQ = Math.min(totalSCQ, 100);

        // Notifica o app.js e atualiza o display
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
