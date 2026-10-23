import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import "./styles/landing-auth.css";

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/login") {
    return <LoginPage />;
  }

  return <LandingPage />;
}