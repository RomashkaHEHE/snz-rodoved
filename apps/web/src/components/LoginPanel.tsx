import { LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { login, workspaceLogin } from "../api/client";

interface WorkspaceLoginPanelProps {
  onLogin: () => void;
}

export function WorkspaceLoginPanel({ onLogin }: WorkspaceLoginPanelProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await workspaceLogin(password);
      onLogin();
    } catch {
      setError("Не удалось войти. Проверьте пароль.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <h1>Вход</h1>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          <LogIn aria-hidden size={20} />
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}

interface AdminLoginPanelProps {
  onLogin: () => void;
}

export function AdminLoginPanel({ onLogin }: AdminLoginPanelProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      onLogin();
    } catch {
      setError("Не удалось войти. Проверьте логин и пароль.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <h1>Админка</h1>
        <label>
          Логин
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          <LogIn aria-hidden size={20} />
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
