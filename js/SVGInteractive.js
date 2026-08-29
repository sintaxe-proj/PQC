// js/SVGInteractive.js
// Módulo para interação vetorial e mapeamento de Superfície Corporal Queimada (SCQ)

export class SVGInteractive {
    constructor(svgElementId, scqDisplayId) {
        this.svgElement = document.getElementById(svgElementId);
        this.scqDisplay = document.getElementById(scqDisplayId);
        this.totalSCQ = 0;

        if (this.svgElement) {
            this.init();
        }
    }

    init() {
        // Mapeia todos os elementos vetoriais marcados como região clicável
        const regions = this.svgElement.querySelectorAll('.burn-region');

        regions.forEach(region => {
            // Estilização inicial via script ou CSS
            region.style.cursor = 'pointer';
            region.style.transition = 'fill 0.2s ease, opacity 0.2s ease';

            // Evento de clique para alternar seleção da área
            region.addEventListener('click', (e) => {
                const target = e.currentTarget;
                target.classList.toggle('selected');

                if (target.classList.contains('selected')) {
                    target.style.fill = 'var(--accent-red)';
                    target.style.opacity = '0.85';
                } else {
                    target.style.fill = 'var(--border-color)';
                    target.style.opacity = '1';
                }

                this.calcularSCQ();
            });
        });
    }

    calcularSCQ() {
        const selectedRegions = this.svgElement.querySelectorAll('.burn-region.selected');
        let somaSCQ = 0;

        selectedRegions.forEach(region => {
            // Captura a porcentagem definida no atributo data-porcentagem do SVG
            const val = parseFloat(region.dataset.porcentagem) || 0;
            somaSCQ += val;
        });

        this.totalSCQ = somaSCQ;

        if (this.scqDisplay) {
            this.scqDisplay.innerText = this.totalSCQ.toFixed(1);
        }
    }

    // Método público para resetar seleções via interface se necessário
    resetarSelecao() {
        const regions = this.svgElement.querySelectorAll('.burn-region');
        regions.forEach(region => {
            region.classList.remove('selected');
            region.style.fill = 'var(--border-color)';
            region.style.opacity = '1';
        });
        this.totalSCQ = 0;
        if (this.scqDisplay) {
            this.scqDisplay.innerText = '0';
        }
    }
}
