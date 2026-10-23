import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import WorkspacePage from "./pages/WorkspacePage";
import "@birthub/design-system/styles.css";
import "./styles/landing-auth.css";
import "./styles/workspace.css";

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/workspace" || path === "/app") {
    return <WorkspacePage />;
  }

  return <LandingPage />;
}
