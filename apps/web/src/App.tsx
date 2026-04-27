import { Download, LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AnalyticsSummary, SurveyFilters, SurveyResponse } from "@snz-rodoved/shared";
import {
  exportResponsesCsv,
  getAnalyticsSummary,
  getSession,
  listResponses,
  logout
} from "./api/client";
import { Dashboard } from "./components/Dashboard";
import { FilterPanel } from "./components/FilterPanel";
import { LoginPanel } from "./components/LoginPanel";
import { ResponseForm } from "./components/ResponseForm";
import { ResponsesTable } from "./components/ResponsesTable";
import "./styles.css";

type AppRoute = "/" | "/login" | "/editor" | "/data";

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

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
    if (window.location.pathname.startsWith("/admin")) {
      navigate("/editor", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    getSession()
      .then((session) => setAuthenticated(session.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
    navigate("/");
  }

  if (route === "/login") {
    if (authenticated) {
      return <Redirect to="/editor" navigate={navigate} />;
    }

    return (
      <LoginPanel
        onLogin={() => {
          setAuthenticated(true);
          navigate("/editor", { replace: true });
        }}
      />
    );
  }

  if (route === "/editor") {
    return (
      <ProtectedPage authenticated={authenticated} navigate={navigate}>
        <EditorPage onLogout={handleLogout} navigate={navigate} />
      </ProtectedPage>
    );
  }

  if (route === "/data") {
    return (
      <ProtectedPage authenticated={authenticated} navigate={navigate}>
        <DataPage onLogout={handleLogout} navigate={navigate} />
      </ProtectedPage>
    );
  }

  return <PublicPage authenticated={authenticated === true} navigate={navigate} />;
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
          <p>Здесь будет описание проекта.</p>
          {authenticated ? (
            <button className="primary-button" type="button" onClick={() => navigate("/editor")}>
              Перейти в рабочую зону
            </button>
          ) : null}
        </div>
      </section>

      <section className="public-template">
        <p className="eyebrow">Информация</p>
        <h2>Здесь будет основной текст публичной страницы.</h2>
        <p>Блок оставлен как шаблон до согласования описания проекта.</p>
      </section>

      <section className="public-contacts">
        <div>
          <p className="eyebrow">Контакты</p>
          <h2>Связаться с проектом</h2>
        </div>
        <dl className="contact-list">
          <div>
            <dt>Телефон</dt>
            <dd>+7 (___) ___-__-__</dd>
          </div>
          <div>
            <dt>Telegram</dt>
            <dd>@username</dd>
          </div>
          <div>
            <dt>Почта</dt>
            <dd>mail@example.ru</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

function EditorPage({
  onLogout,
  navigate
}: {
  onLogout: () => void;
  navigate: (route: AppRoute) => void;
}) {
  const [savedCount, setSavedCount] = useState(0);

  return (
    <main className="workspace-shell editor-shell">
      <WorkspaceHeader activeRoute="/editor" navigate={navigate} onLogout={onLogout} />
      <section className="editor-intro">
        <p className="eyebrow">Ввод</p>
        <h1>Новая анкета</h1>
        <p>Страница только для быстрого переноса бумажной анкеты в базу.</p>
      </section>
      <ResponseForm
        editing={null}
        onCancelEdit={() => undefined}
        onSaved={() => setSavedCount((count) => count + 1)}
      />
      {savedCount > 0 ? <p className="save-counter">Сохранено за сессию: {savedCount}</p> : null}
    </main>
  );
}

function DataPage({
  onLogout,
  navigate
}: {
  onLogout: () => void;
  navigate: (route: AppRoute) => void;
}) {
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
      <WorkspaceHeader activeRoute="/data" navigate={navigate} onLogout={onLogout} />
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
  navigate,
  onLogout
}: {
  activeRoute: AppRoute;
  navigate: (route: AppRoute) => void;
  onLogout: () => void;
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
      <button className="ghost-button" onClick={onLogout} type="button">
        <LogOut aria-hidden size={18} />
        Выйти
      </button>
    </header>
  );
}

function ProtectedPage({
  authenticated,
  navigate,
  children
}: {
  authenticated: boolean | null;
  navigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  children: ReactNode;
}) {
  if (authenticated === null) {
    return <main className="loading-page">Загрузка...</main>;
  }

  if (!authenticated) {
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
  if (pathname.startsWith("/admin")) {
    return "/editor";
  }

  if (pathname === "/login" || pathname === "/editor" || pathname === "/data") {
    return pathname;
  }

  return "/";
}
