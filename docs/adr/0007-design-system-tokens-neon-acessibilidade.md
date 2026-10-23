# ADR 0007 — Design System com Tokens Neon Controlados e Acessibilidade WCAG 2.2 AA

**Status:** Aprovado — Onda W03.

## Contexto

A identidade visual do Birthub 360 utiliza elementos neon (azul, rosa, dourado e verde) sobre fundo escuro profundo. Se mal aplicadas, cores neon puras causam fadiga visual e falham nos critérios de contraste mínimo para acessibilidade digital (WCAG 2.2 nível AA). É necessário equilibrar a sofisticação da marca com a usabilidade profissional para operadores que utilizam a ferramenta durante todo o dia.

## Decisão

Adotar os seguintes princípios de design system:
1. **Neon como Acento:** As cores neon (`#00E5FF`, `#FF007F`, `#FFD700`, `#00FFA3`) são reservadas estritamente para acentos, indicadores de status, botões primários e foco interativo. Nunca são utilizadas para grandes fundos nem para blocos longos de texto.
2. **Superfícies e Contraste Auditado:** Os fundos adotam gradações profundas (`#0B0E18`, `#101423`, `#181E32`), e os textos utilizam tons claros contrastados (`#F2F5FF`, `#B8C1DE`) garantindo razão de contraste superior a 4.5:1 para texto normal e 3:1 para componentes de interface.
3. **Navegação Acessível:** Implementação mandatória de Skip Link para pular ao conteúdo principal, anéis de foco visíveis em todos os elementos clicáveis (`outline: 2px solid #00E5FF`) e atributos ARIA nos componentes semânticos (`ApprovalPanel`, `Topbar`, `Badge`).

## Consequências

- **Positivas:** Interface moderna e imersiva com conformidade de acessibilidade comprovada e conforto visual contínuo.
- **Negativas / Cuidados:** Exige atenção contínua dos desenvolvedores para não introduzir textos em cores neon puras sem contraste de fundo adequado.
