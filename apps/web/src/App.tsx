import { Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AnalyticsSummary, SurveyFilters, SurveyResponse } from "@snz-rodoved/shared";
import {
  exportResponsesCsv,
  getAnalyticsSummary,
  getSession,
  listResponses
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
          <p>{"<описание проекта>"}</p>
          {authenticated ? (
            <button className="primary-button" type="button" onClick={() => navigate("/editor")}>
              Перейти в рабочую зону
            </button>
          ) : null}
        </div>
      </section>

      <section className="public-contacts">
        <div>
          <p className="eyebrow">Контакты</p>
        </div>
        <dl className="contact-list">
          <div>
            <dt>Телефон</dt>
            <dd>{"<телефон>"}</dd>
          </div>
          <div>
            <dt>Telegram</dt>
            <dd>{"<telegram>"}</dd>
          </div>
          <div>
            <dt>Почта</dt>
            <dd>{"<почта>"}</dd>
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
    void refreshData();
  }, [refreshData]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportResponsesCsv(filters);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="workspace-shell data-shell">
      <WorkspaceHeader activeRoute="/data" navigate={navigate} />
      <section className="data-toolbar">
        <div>
          <p className="eyebrow">Данные</p>
          <h1>Аналитика и анкеты</h1>
        </div>
        <div className="header-actions">
          <button className="ghost-button" disabled={loading} onClick={refreshData} type="button">
            <RefreshCw aria-hidden size={18} />
            Обновить
          </button>
          <button className="primary-button" disabled={exporting} onClick={handleExport} type="button">
            <Download aria-hidden size={18} />
            {exporting ? "Экспорт..." : "CSV"}
          </button>
        </div>
      </section>

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
  return (
    <main className="workspace-shell editor-shell">
      <section className="admin-placeholder">
        <p className="eyebrow">Админка</p>
        <h1>Вход выполнен</h1>
        <div className="header-actions">
          <button className="ghost-button" onClick={() => navigate("/editor")} type="button">
            Ввод
          </button>
          <button className="ghost-button" onClick={() => navigate("/data")} type="button">
            Данные
          </button>
        </div>
      </section>
    </main>
  );
}
