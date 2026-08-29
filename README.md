# PQC

# PQC - Percentual de Queima Corporal (HFA) 🩺🔥

O **PQC-HFA** é uma solução web interativa desenvolvida para auxílio no cálculo de superfície corporal queimada (SCQ), prescrição de ressuscitação volêmica (Fórmula de Parkland ajustada) e cálculo de balanço hídrico para pacientes vítimas de queimaduras.

---

## 🎯 Objetivos do Projeto

- **Precisão Diagnóstica:** Mapeamento vetorial (SVG) da área corporal para cálculo automático de SCQ (Regra dos Noves).
- **Ressuscitação Volêmica Direcionada:** Prescrição automatizada da Fórmula de Parkland ajustada conforme a etiologia da lesão.
- **Cronograma de Infusão Ajustado:** Cálculo dinâmico das fases de infusão (Ataque x Manutenção) considerando o **horário real do acidente**.
- **Gestão de Balanço Hídrico:** Correção de vazão e monitoramento de perdas corporais (incluindo quantificação de perda sanguínea por compressas cirúrgicas).

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
├── index.html            # Interface principal e formulário
├── css/
│   └── styles.css        # Estilos e design system
├── js/
│   ├── app.js            # Controladora principal e eventos do formulário
│   ├── burnCalculator.js # Motor de cálculos de Parkland e Infusão
│   ├── fluidBalance.js   # Módulo de cálculo de perdas e balanço hídrico
│   └── svgInteractive.js # Mapeamento interativo do corpo humano (SVG)
└── assets/
    └── body-map.svg      # Mapa anátomo-vetorial com data-attributes de SCQ
