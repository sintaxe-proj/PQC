# PQC

# PQC - Percentual de Queima Corporal (HFA) 🩺🔥

O PQC-HFA é uma solução web interativa desenvolvida para o auxílio ao raciocínio clínico, mapeamento visual de lesões e suporte à decisão na Terapia Intensiva e Emergência de Centros de Tratamento de Queimados (CTQ). O sistema realiza o cálculo de Superfície Corporal Queimada (SCQ), prescrição da ressuscitação volêmica pela Fórmula de Parkland e monitoramento contínuo de balanço hídrico.

---

## 🎯 Objetivos do Projeto

Precisão Diagnóstica Integrada: Mapeamento vetorial interativo (SVG) com atribuição exata de percentual corporal (Regra dos Nove de Wallace e adaptações anatômicas).

Ressuscitação Volêmica Personalizada: Cálculo automatizado da Fórmula de Parkland ajustado conforme a etiologia da queimadura (térmica, química ou elétrica).

Cronograma Dinâmico de Infusão: Reajuste da taxa de infusão em bomba de amostragem/infusão contínua (mL/h) considerando a janela real de tempo decorrido desde o momento do acidente (time-to-admission).

Gestão de Balanço Hídrico & Perdas Complexas: Monitoramento rigoroso do volume acumulado, diurese e estimativa de perda sanguínea em procedimentos/curativos cirúrgicos.

---

## 📋 Parâmetros e Fórmulas Clínicas

### 1. Fator da Fórmula de Parkland
- **2 mL × Peso (kg) × SCQ (%):** Queimaduras térmicas convencionais, químicas ou agressão direta.
- **4 mL × Peso (kg) × SCQ (%):** Queimaduras elétricas de alta voltagem e materiais inflamáveis (alto impacto/lesão tecidual profunda).

### 2. Cronograma de Infusão
- **Fase de Ataque (Primeiras 8h pós-acidente):** 50% do volume total prescrito.
- **Fase de Manutenção (16h subsequentes):** 50% do volume restante.
- *Obs:* Se a admissão ocorrer dentro do intervalo de 8 horas, a vazão da bomba de infusão (mL/h) será reajustada para o tempo restante da janela de ataque.

### 3. Correção por Balanço Hídrico & Perdas
$$\text{Total Saídas} = \text{Diurese} + \text{Emese/Drenagem} + (\text{Nº Compressas} \times 300\,\text{mL}) + \text{Outras Perdas}$$
$$\text{Balanço Hídrico} = \text{Total Entradas} - \text{Total Saídas}$$

---

## 📂 Estrutura do Repositório

```text
pqc-hfa/
├── index.html            # Interface principal, dashboard e formulário clínico
├── css/
│   └── styles.css        # Design System (tokens visuais e responsividade)
├── js/
│   ├── app.js            # Controller principal e orquestração de eventos
│   ├── burnCalculator.js # Motor de cálculos de Parkland, SCQ e metas de mL/h
│   ├── fluidBalance.js   # Módulo de gestão de perdas, diurese e balanço
│   └── svgInteractive.js # Gerenciador do mapa anátomo-vetorial (SVG)
└── assets/
    └── body-map.svg      # Vetor corporal anatômico com data-attributes de SCQ
