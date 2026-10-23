import BrandMark from "../components/BrandMark";

const features = [
  {
    icon: "◎",
    title: "CRM 360°",
    description:
      "Relacionamentos, negocios, contatos e atividades em uma unica visao."
  },
  {
    icon: "✧",
    title: "Inteligencia comercial",
    description:
      "Identifique oportunidades, riscos e proximas melhores acoes."
  },
  {
    icon: "◇",
    title: "Agentes de IA",
    description:
      "Automatize pesquisas, analises e tarefas com controle humano."
  },
  {
    icon: "⇄",
    title: "Integracoes",
    description:
      "Conecte sistemas comerciais e mantenha informacoes sincronizadas."
  },
  {
    icon: "↗",
    title: "Revenue Operations",
    description:
      "Acompanhe funil, previsibilidade, produtividade e resultados."
  },
  {
    icon: "⬡",
    title: "Governanca",
    description:
      "Controle permissoes, auditoria, privacidade e autonomia operacional."
  }
];

export default function LandingPage() {
  return (
    <div className="bh bh-landing">
      <header className="bh-header">
        <div className="bh-container bh-header-inner">
          <BrandMark />

          <nav className="bh-nav" aria-label="Navegacao principal">
            <a href="#plataforma">Plataforma</a>
            <a href="#inteligencia">Inteligencia</a>
            <a href="#operacao">Operacao</a>
          </nav>

          <a className="bh-button bh-button-ghost" href="/login">
            Acessar plataforma <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main>
        <section className="bh-hero">
          <div className="bh-container bh-hero-grid">
            <div className="bh-hero-copy">
              <span className="bh-kicker">
                <span className="bh-live-dot" />
                REVENUE INTELLIGENCE & AUTONOMOUS OPERATIONS
              </span>

              <h1>
                Inteligencia que
                <br />
                vira <span className="bh-gradient-text">execucao.</span>
              </h1>

              <p className="bh-lead">
                Uma nova forma de gerenciar o crescimento comercial.
                Dados conectados, decisoes inteligentes e operacoes
                impulsionadas por agentes de IA.
              </p>

              <div className="bh-hero-actions">
                <a className="bh-button bh-button-primary" href="/login">
                  Acessar o Birthub <span aria-hidden="true">→</span>
                </a>
                <a className="bh-button bh-button-outline" href="#plataforma">
                  Explorar a plataforma
                </a>
              </div>

              <div className="bh-hero-foot">
                <span>CRM 360°</span>
                <span>Inteligencia</span>
                <span>Automacao</span>
                <span>Governanca</span>
              </div>
            </div>

            <div
              className="bh-preview-wrap"
              aria-label="Previa ilustrativa do painel comercial"
            >
              <div className="bh-preview-glow" />
              <div className="bh-preview">
                <div className="bh-preview-top">
                  <span className="bh-preview-logo">
                    <span className="bh-live-dot" />
                    REVENUE COMMAND
                  </span>
                  <span className="bh-preview-tag">DEMONSTRACAO</span>
                </div>

                <div className="bh-preview-heading">
                  <div>
                    <span className="bh-eyebrow">CENTRO DE INTELIGENCIA</span>
                    <h2>Visao operacional</h2>
                  </div>
                  <span className="bh-mini-indicator">● Conectado</span>
                </div>

                <div className="bh-metric-grid">
                  <div className="bh-metric">
                    <span>Oportunidades</span>
                    <strong>128</strong>
                    <small>Exemplo ilustrativo</small>
                  </div>
                  <div className="bh-metric">
                    <span>Negocios ativos</span>
                    <strong>46</strong>
                    <small>Exemplo ilustrativo</small>
                  </div>
                  <div className="bh-metric">
                    <span>Alertas de risco</span>
                    <strong>08</strong>
                    <small>Exemplo ilustrativo</small>
                  </div>
                </div>

                <div className="bh-insight">
                  <div className="bh-insight-header">
                    <span className="bh-insight-icon">✧</span>
                    <strong>Inteligencia comercial</strong>
                    <span className="bh-insight-badge">SIMULACAO</span>
                  </div>
                  <p>
                    Oportunidades prioritarias foram identificadas.
                    Uma nova sequencia comercial pode ser recomendada.
                  </p>
                  <div className="bh-insight-action">
                    Analisar recomendacoes <span>→</span>
                  </div>
                </div>

                <div className="bh-bars">
                  <div className="bh-bars-title">
                    <span>Pipeline por etapa</span>
                    <small>Dados demonstrativos</small>
                  </div>
                  <div className="bh-bar">
                    <span style={{ width: "84%" }} />
                  </div>
                  <div className="bh-bar">
                    <span style={{ width: "66%" }} />
                  </div>
                  <div className="bh-bar">
                    <span style={{ width: "42%" }} />
                  </div>
                  <div className="bh-bar">
                    <span style={{ width: "24%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="plataforma" className="bh-section">
          <div className="bh-container">
            <div className="bh-section-heading">
              <span className="bh-eyebrow">PLATAFORMA UNIFICADA</span>
              <h2>Uma operacao. Todas as conexoes.</h2>
              <p>
                Do primeiro contato com um potencial cliente ate a
                inteligencia que orienta a proxima decisao.
              </p>
            </div>

            <div className="bh-features">
              {features.map((feature) => (
                <article className="bh-feature" key={feature.title}>
                  <div className="bh-feature-icon" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="inteligencia" className="bh-section bh-band">
          <div className="bh-container bh-split">
            <div>
              <span className="bh-eyebrow">AI-NATIVE OPERATIONS</span>
              <h2>Da informacao a acao.</h2>
              <p>
                O Birthub foi concebido para reunir memoria comercial,
                sinais de mercado, regras de negocio e agentes de IA
                em um fluxo continuo de trabalho.
              </p>
              <a className="bh-text-link" href="/login">
                Conhecer o ambiente <span>↗</span>
              </a>
            </div>

            <div className="bh-steps">
              {[
                ["01", "Conectar", "Unifique dados e contexto."],
                ["02", "Compreender", "Identifique sinais relevantes."],
                ["03", "Decidir", "Priorize a proxima acao."],
                ["04", "Executar", "Automatize com governanca."]
              ].map(([number, title, description]) => (
                <div className="bh-step" key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="operacao" className="bh-section bh-final-section">
          <div className="bh-container bh-final">
            <span className="bh-eyebrow">FULL OPERATION</span>
            <h2>O futuro da sua operacao comercial comeca aqui.</h2>
            <p>
              Tecnologia, inteligencia e execucao no mesmo ambiente.
            </p>
            <a className="bh-button bh-button-primary" href="/login">
              Entrar na plataforma <span>→</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="bh-footer">
        <div className="bh-container bh-footer-inner">
          <BrandMark />
          <span>© {new Date().getFullYear()} Birth Hub 360°. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}