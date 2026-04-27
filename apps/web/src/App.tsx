import { Download, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { AnalyticsSummary, SurveyFilters, SurveyResponse } from "@snz-rodoved/shared";
import {
  exportResponsesCsv,
  createFakeResponse,
  deleteFakeResponses,
  getAnalyticsSummary,
  getSession,
  listResponses,
  updatePasswords
} from "./api/client";
import { Dashboard } from "./components/Dashboard";
import { FilterPanel } from "./components/FilterPanel";
import { AdminLoginPanel, WorkspaceLoginPanel } from "./components/LoginPanel";
import { ResponseForm } from "./components/ResponseForm";
import { ResponsesTable } from "./components/ResponsesTable";
import "./styles.css";

type AppRoute = "/" | "/login" | "/editor" | "/data" | "/admin";
type SessionRole = "workspace" | "admin" | null;

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));
  const [sessionRole, setSessionRole] = useState<SessionRole | undefined>(undefined);

  const navigate = useCallback((nextRoute: AppRoute, options: { replace?: boolean } = {}) => {
    if (window.location.pathname !== nextRoute) {
      if (options.replace) {
        window.history.replaceState(null, "", nextRoute);
      } else {
        window.history.pushState(null, "", nextRoute);
      }
    }
    setRoute(nextRoute);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setRoute(normalizeRoute(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    getSession()
      .then((session) => setSessionRole(session.role))
      .catch(() => setSessionRole(null));
  }, []);

  if (route === "/login") {
    if (sessionRole) {
      return <Redirect to="/editor" navigate={navigate} />;
    }

    return (
      <WorkspaceLoginPanel
        onLogin={() => {
          setSessionRole("workspace");
          navigate("/editor", { replace: true });
        }}
      />
    );
  }

  if (route === "/admin") {
    if (sessionRole === "admin") {
      return <AdminPage navigate={navigate} />;
    }

    return (
      <AdminLoginPanel
        onLogin={() => {
          setSessionRole("admin");
          navigate("/admin", { replace: true });
        }}
      />
    );
  }

  if (route === "/editor") {
    return (
      <ProtectedPage sessionRole={sessionRole} navigate={navigate}>
        <EditorPage navigate={navigate} />
      </ProtectedPage>
    );
  }

  if (route === "/data") {
    return (
      <ProtectedPage sessionRole={sessionRole} navigate={navigate}>
        <DataPage navigate={navigate} />
      </ProtectedPage>
    );
  }

  return <PublicPage authenticated={sessionRole !== null && sessionRole !== undefined} navigate={navigate} />;
}

function PublicPage({
  authenticated,
  navigate
}: {
  authenticated: boolean;
  navigate: (route: AppRoute) => void;
}) {
  return (
    <main className="public-page">
      <section className="public-hero">
        <img alt="" className="public-hero-bg" src="/images/brand/header.jpg" />
        <div className="public-hero-content">
          <h1>Родовед</h1>
          <p>{"<описание>"}</p>
          {authenticated ? (
            <button className="primary-button" type="button" onClick={() => navigate("/editor")}>
              Перейти в рабочую зону
            </button>
          ) : null}
        </div>
      </section>

      <section className="public-contacts" aria-label="Контакты">
        <p className="eyebrow">Контакты</p>
        <dl className="contact-list">
          <div>
            <dt>Телефон</dt>
            <dd>+7 (000) 000-00-00</dd>
          </div>
          <div>
            <dt>Telegram</dt>
            <dd>@rodoved_example</dd>
          </div>
          <div>
            <dt>Почта</dt>
            <dd>info@example.ru</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

function EditorPage({ navigate }: { navigate: (route: AppRoute) => void }) {
  const [savedCount, setSavedCount] = useState(0);

  return (
    <main className="workspace-shell editor-shell">
      <WorkspaceHeader activeRoute="/editor" navigate={navigate} />
      <ResponseForm
        editing={null}
        onCancelEdit={() => undefined}
        onSaved={() => setSavedCount((count) => count + 1)}
      />
      {savedCount > 0 ? <p className="save-counter">Сохранено за сессию: {savedCount}</p> : null}
    </main>
  );
}

function DataPage({ navigate }: { navigate: (route: AppRoute) => void }) {
  const [filters, setFilters] = useState<SurveyFilters>({});
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [editing, setEditing] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fakeBusy, setFakeBusy] = useState(false);
  const [fakeActionStatus, setFakeActionStatus] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextResponses, nextSummary] = await Promise.all([
        listResponses(filters),
        getAnalyticsSummary(filters)
      ]);
      setResponses(nextResponses);
      setSummary(nextSummary);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    function handleFocus() {
      void refreshData();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        void refreshData();
      }
    }

    void refreshData();
    const intervalId = window.setInterval(() => void refreshData(), 30_000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshData]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportResponsesCsv(filters);
    } finally {
      setExporting(false);
    }
  }

  async function handleCreateFake() {
    setFakeBusy(true);
    setFakeActionStatus(null);
    try {
      await createFakeResponse();
      setFakeActionStatus("Фейковая анкета добавлена.");
      await refreshData();
    } catch {
      setFakeActionStatus("Не удалось добавить фейковую анкету.");
    } finally {
      setFakeBusy(false);
    }
  }

  async function handleDeleteFake() {
    const confirmed = window.confirm(
      "Удалить все фейковые анкеты? Будут удалены только строки с признаком «Фейковая». Настоящие анкеты не затрагиваются."
    );

    if (!confirmed) {
      return;
    }

    setFakeBusy(true);
    setFakeActionStatus(null);
    try {
      const deleted = await deleteFakeResponses();
      setFakeActionStatus(`Удалено фейковых анкет: ${deleted}.`);
      await refreshData();
    } catch {
      setFakeActionStatus("Не удалось удалить фейковые анкеты.");
    } finally {
      setFakeBusy(false);
    }
  }

  return (
    <main className="workspace-shell data-shell" aria-busy={loading}>
      <WorkspaceHeader activeRoute="/data" navigate={navigate} />
      <section className="data-toolbar">
        <div>
          <p className="eyebrow">Данные</p>
          <h1>Аналитика и анкеты</h1>
        </div>
        <div className="header-actions">
          <button className="ghost-button" onClick={() => navigate("/editor")} type="button">
            <Plus aria-hidden size={18} />
            Новая анкета
          </button>
          <button className="ghost-button" disabled={fakeBusy} onClick={handleCreateFake} type="button">
            <Plus aria-hidden size={18} />
            Фейковая анкета
          </button>
          <button className="ghost-button danger-button" disabled={fakeBusy} onClick={handleDeleteFake} type="button">
            <Trash2 aria-hidden size={18} />
            Удалить фейковые
          </button>
          <button className="primary-button" disabled={exporting} onClick={handleExport} type="button">
            <Download aria-hidden size={18} />
            {exporting ? "Экспорт..." : "CSV"}
          </button>
        </div>
      </section>
      {fakeActionStatus ? <p className="data-status">{fakeActionStatus}</p> : null}

      <FilterPanel filters={filters} onChange={setFilters} />
      <Dashboard summary={summary} />
      {editing ? (
        <ResponseForm
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refreshData();
          }}
        />
      ) : null}
      <ResponsesTable responses={responses} onDeleted={refreshData} onEdit={setEditing} />
    </main>
  );
}

function WorkspaceHeader({
  activeRoute,
  navigate
}: {
  activeRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}) {
  return (
    <header className="workspace-header">
      <button className="brand-link" type="button" onClick={() => navigate("/")}>
        Родовед
      </button>
      <nav aria-label="Рабочие разделы">
        <button
          className={activeRoute === "/editor" ? "is-active" : ""}
          onClick={() => navigate("/editor")}
          type="button"
        >
          Ввод
        </button>
        <button
          className={activeRoute === "/data" ? "is-active" : ""}
          onClick={() => navigate("/data")}
          type="button"
        >
          Данные
        </button>
      </nav>
    </header>
  );
}

function ProtectedPage({
  sessionRole,
  navigate,
  children
}: {
  sessionRole: SessionRole | undefined;
  navigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  children: ReactNode;
}) {
  if (sessionRole === undefined) {
    return <main className="loading-page">Загрузка...</main>;
  }

  if (sessionRole === null) {
    return <Redirect to="/login" navigate={navigate} />;
  }

  return children;
}

function Redirect({
  to,
  navigate
}: {
  to: AppRoute;
  navigate: (route: AppRoute, options?: { replace?: boolean }) => void;
}) {
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return <main className="loading-page">Переход...</main>;
}

function normalizeRoute(pathname: string): AppRoute {
  if (pathname === "/login" || pathname === "/editor" || pathname === "/data" || pathname === "/admin") {
    return pathname;
  }

  return "/";
}

function AdminPage({ navigate }: { navigate: (route: AppRoute) => void }) {
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirm, setAdminConfirm] = useState("");
  const [workspacePassword, setWorkspacePassword] = useState("");
  const [workspaceConfirm, setWorkspaceConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!adminPassword && !workspacePassword) {
      setStatus("Укажите хотя бы один новый пароль.");
      return;
    }

    if (adminPassword && adminPassword.length < 8) {
      setStatus("Пароль админки должен быть не короче 8 символов.");
      return;
    }

    if (workspacePassword && workspacePassword.length < 8) {
      setStatus("Пароль рабочей зоны должен быть не короче 8 символов.");
      return;
    }

    if (adminPassword !== adminConfirm) {
      setStatus("Пароль админки и подтверждение не совпадают.");
      return;
    }

    if (workspacePassword !== workspaceConfirm) {
      setStatus("Пароль рабочей зоны и подтверждение не совпадают.");
      return;
    }

    setSaving(true);
    try {
      const result = await updatePasswords({
        adminPassword: adminPassword || undefined,
        workspacePassword: workspacePassword || undefined
      });

      setAdminPassword("");
      setAdminConfirm("");
      setWorkspacePassword("");
      setWorkspaceConfirm("");
      setStatus(result.persisted ? "Пароли обновлены." : "Пароли обновлены до перезапуска.");
    } catch {
      setStatus("Не удалось обновить пароли.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="workspace-shell admin-shell">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Админка</p>
            <h1>Пароли доступа</h1>
          </div>
          <div className="header-actions">
            <button className="ghost-button" onClick={() => navigate("/editor")} type="button">
              Ввод
            </button>
            <button className="ghost-button" onClick={() => navigate("/data")} type="button">
              Данные
            </button>
          </div>
        </div>
        <form className="admin-password-form" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Админка</legend>
            <label>
              Новый пароль
              <input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
              />
            </label>
            <label>
              Повторите пароль
              <input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={adminConfirm}
                onChange={(event) => setAdminConfirm(event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Рабочая зона</legend>
            <label>
              Новый пароль
              <input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={workspacePassword}
                onChange={(event) => setWorkspacePassword(event.target.value)}
              />
            </label>
            <label>
              Повторите пароль
              <input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={workspaceConfirm}
                onChange={(event) => setWorkspaceConfirm(event.target.value)}
              />
            </label>
          </fieldset>

          {status ? <p className="form-status">{status}</p> : null}
          <button className="primary-button" disabled={saving} type="submit">
            <Save aria-hidden size={18} />
            {saving ? "Сохранение..." : "Сохранить пароли"}
          </button>
        </form>
      </section>
    </main>
  );
}
