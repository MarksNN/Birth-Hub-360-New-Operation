import { useState, type FormEvent } from "react";
import BrandMark from "../components/BrandMark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Autenticacao real sera implementada com API, cookies seguros,
    // sessoes e controle de acesso. Nunca simular login autorizado.
    setNotice(true);
  }

  return (
    <div className="bh bh-login-page">
      <div className="bh-login-aside">
        <div className="bh-login-aside-top">
          <BrandMark />
        </div>

        <div className="bh-login-aside-content">
          <span className="bh-eyebrow">FULL OPERATION</span>
          <h1>
            Sua operacao.
            <br />
            Mais <span className="bh-gradient-text">inteligente.</span>
          </h1>
          <p>
            Uma experiencia comercial conectada, orientada
            por dados e potencializada por inteligencia artificial.
          </p>

          <div className="bh-login-highlights">
            <span>✧ Inteligencia comercial</span>
            <span>◎ CRM 360°</span>
            <span>◇ Agentes de IA</span>
          </div>
        </div>

        <span className="bh-login-aside-bottom">
          BIRTH HUB 360° · REVENUE INTELLIGENCE
        </span>
      </div>

      <main className="bh-login-main">
        <div className="bh-login-top">
          <a href="/">← Voltar ao inicio</a>
        </div>

        <div className="bh-login-card">
          <div className="bh-login-mobile-brand">
            <BrandMark />
          </div>

          <span className="bh-eyebrow">ACESSO A PLATAFORMA</span>
          <h2>Bem-vindo de volta.</h2>
          <p className="bh-login-subtitle">
            Entre com suas credenciais corporativas.
          </p>

          <div className="bh-login-preview-note" role="note">
            Ambiente em construcao: autenticacao ainda nao habilitada.
            Nao utilize sua senha real nesta demonstracao.
          </div>

          <form className="bh-form" onSubmit={handleSubmit}>
            <div className="bh-field">
              <label htmlFor="email">E-mail corporativo</label>
              <input
                id="email"
                type="email"
                placeholder="voce@empresa.com.br"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="bh-field">
              <label htmlFor="password">Senha</label>
              <div className="bh-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="bh-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button className="bh-button bh-button-primary bh-login-submit" type="submit">
              Continuar <span aria-hidden="true">→</span>
            </button>

            {notice && (
              <div className="bh-notice" role="status">
                Interface validada. Nenhuma credencial foi enviada.
                O servico de autenticacao sera integrado na proxima etapa.
              </div>
            )}
          </form>

          <div className="bh-login-help">
            O acesso seguro e a recuperacao de senha serao
            disponibilizados com o modulo de identidade.
          </div>
        </div>

        <div className="bh-login-bottom">
          <span>© {new Date().getFullYear()} Birth Hub 360°</span>
          <span>Ambiente de desenvolvimento</span>
        </div>
      </main>
    </div>
  );
}