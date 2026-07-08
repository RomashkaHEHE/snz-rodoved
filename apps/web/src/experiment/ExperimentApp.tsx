import {
  CheckCircle,
  ClipboardList,
  Database,
  Download,
  FileText,
  LockKeyhole,
  PenLine,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  createLabFakeResponse,
  createLabOnlineResponse,
  createLabResponse,
  deleteLabFakeResponses,
  deleteLabPdfFile,
  deleteLabResponse,
  getLabPdfDownloadUrl,
  getLabSession,
  listLabPdfFiles,
  listLabResponses,
  loginLabWorkspace,
  updateLabContactWorkflow,
  uploadLabPdfFile,
  updateLabResponse,
  type LabSession
} from "./labApi";
import "./experiment.css";

type RouteId = "survey" | "entry" | "data" | "pdf";
type Answer = "yes" | "no" | "unknown";
type Gender = "male" | "female";
type AgeGroup = "under_18" | "18_40" | "over_40";
type Residence = "snezhinsk" | "other";
type ResponseSource = "online" | "paper";
type ContactStatus = "new" | "in_progress" | "done" | "no_contact";
type QuestionGroup = "experience" | "interest" | "help";
type QuestionGroupFilter = "all" | QuestionGroup;
type QuestionId =
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "q9"
  | "q10"
  | "q11"
  | "q12"
  | "q13"
  | "q14"
  | "q15"
  | "q16";

type AnswerFields = Record<QuestionId, Answer>;

interface SurveyResponse extends AnswerFields {
  id: string;
  source: ResponseSource;
  surveyDate: string;
  gender: Gender;
  ageGroup: AgeGroup;
  residence: Residence;
  q11WarDetails?: string;
  researchTerritory?: string;
  researchPeriodStart?: number;
  researchPeriodEnd?: number;
  freeText?: string;
  contactName?: string;
  contactPhone?: string;
  contactStatus: ContactStatus;
  contactNote?: string;
  isFake: boolean;
  createdAt: string;
  updatedAt: string;
}

type ResponseDraft = Omit<
  SurveyResponse,
  "contactNote" | "contactStatus" | "createdAt" | "id" | "isFake" | "updatedAt"
>;

interface PdfRecord {
  id: string;
  surveyDate: string;
  displayName: string;
  originalFileName: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt?: string;
}

interface Filters {
  ageGroup: AgeGroup[];
  contactOnly: boolean;
  contactStatus: ContactStatus[];
  dateFrom: string;
  dateTo: string;
  gender: Gender[];
  source: "all" | ResponseSource;
  helpOnly: boolean;
  query: string;
  residence: Residence[];
}

const answerLabels: Record<Answer, string> = {
  yes: "Да",
  no: "Нет",
  unknown: "Нет ответа"
};

const genderLabels: Record<Gender, string> = {
  male: "М",
  female: "Ж"
};

const ageLabels: Record<AgeGroup, string> = {
  under_18: "до 18 лет",
  "18_40": "18-40 лет",
  over_40: "старше 40 лет"
};

const residenceLabels: Record<Residence, string> = {
  snezhinsk: "г. Снежинск",
  other: "другое"
};

const sourceLabels: Record<ResponseSource, string> = {
  online: "онлайн",
  paper: "бумага"
};

const contactStatusLabels: Record<ContactStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  done: "Закрыто",
  no_contact: "Не дозвонились"
};

const questions: Array<{ id: QuestionId; number: number; label: string; group: QuestionGroup }> = [
  { id: "q4", number: 4, label: "Вы рисовали в школе схему своей семьи?", group: "experience" },
  { id: "q5", number: 5, label: "Вы знаете имя своей прабабушки?", group: "experience" },
  { id: "q6", number: 6, label: "Вы можете назвать имена всех 4х прадедов?", group: "experience" },
  { id: "q7", number: 7, label: "Найти предков, живших в 20 в. (СССР)", group: "interest" },
  { id: "q8", number: 8, label: "Найти предков, живших в 20 в.", group: "interest" },
  { id: "q9", number: 9, label: "Найти предков, живших в 19 в.", group: "interest" },
  { id: "q10", number: 10, label: "Найти предков, живших в 18 в.", group: "interest" },
  {
    id: "q11",
    number: 11,
    label: "Найти документы на предка-участника военных действий",
    group: "interest"
  },
  {
    id: "q12",
    number: 12,
    label: "Найти жизненное событие предка (рождение/брак/смерть)",
    group: "interest"
  },
  { id: "q13", number: 13, label: "Найти информацию о других детях предка", group: "interest" },
  {
    id: "q14",
    number: 14,
    label: "Найти подтверждение факта раскулачивания или репрессии",
    group: "interest"
  },
  {
    id: "q15",
    number: 15,
    label: "Установить место проживания предков до 1918 г.",
    group: "interest"
  },
  { id: "q16", number: 16, label: "Нужна помощь в поисках?", group: "help" }
];

const warOptions = ["—", "Великая Отечественная война", "Первая мировая война", "Иная"];
const routeTitles: Record<RouteId, string> = {
  survey: "Опрос",
  entry: "Ввод",
  data: "Данные",
  pdf: "PDF"
};
const workspaceRoutes: RouteId[] = ["entry", "data", "pdf"];
const surveyStepCount = 5;
const surveyDraftStorageKey = "rodoved-test-online-draft-v1";

export function ExperimentApp() {
  const [route, setRoute] = useState<RouteId>(() => routeFromPath(window.location.pathname));
  const [session, setSession] = useState<LabSession | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PdfRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState("");

  useEffect(() => {
    function handlePopState() {
      setRoute(routeFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    getLabSession()
      .then((nextSession) => {
        setSession(nextSession);
        if (nextSession.authenticated) {
          void refreshWorkspaceData();
        }
      })
      .catch(() => setSession({ authenticated: false, role: null }));
  }, []);

  function navigate(nextRoute: RouteId) {
    const path = routeToPath(nextRoute);
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
    setRoute(nextRoute);
  }

  async function refreshWorkspaceData() {
    const [nextResponses, nextPdfFiles] = await Promise.all([listLabResponses(), listLabPdfFiles()]);
    setResponses(nextResponses as SurveyResponse[]);
    setPdfFiles(nextPdfFiles as PdfRecord[]);
  }

  async function handleWorkspaceLogin(password: string) {
    const nextSession = await loginLabWorkspace(password);
    setSession(nextSession);
    await refreshWorkspaceData();
  }

  async function saveDraft(draft: ResponseDraft, id?: string) {
    if (id) {
      await updateLabResponse(id, normalizeDraft(draft));
    } else if (draft.source === "online") {
      await createLabOnlineResponse(normalizeDraft(draft));
    } else {
      await createLabResponse(normalizeDraft(draft));
    }

    if (session?.authenticated) {
      await refreshWorkspaceData();
    }
    setEditingId(null);
  }

  async function saveContactWorkflow(
    id: string,
    input: { contactNote?: string; contactStatus: ContactStatus }
  ) {
    await updateLabContactWorkflow(id, input);
    await refreshWorkspaceData();
  }

  async function removeResponse(id: string) {
    await deleteLabResponse(id);
    await refreshWorkspaceData();
  }

  async function addFakeResponse() {
    await createLabFakeResponse();
    await refreshWorkspaceData();
  }

  async function removeFakeResponses() {
    const deleted = await deleteLabFakeResponses();
    await refreshWorkspaceData();
    return deleted;
  }

  function editResponse(id: string) {
    setEditingId(id);
    navigate("entry");
  }

  async function addPdf(displayName: string, file: File) {
    await uploadLabPdfFile({ displayName, file });
    await refreshWorkspaceData();
  }

  async function removePdf(id: string) {
    await deleteLabPdfFile(id);
    await refreshWorkspaceData();
  }

  const editingResponse = responses.find((response) => response.id === editingId) ?? null;
  const workspaceReady = Boolean(session?.authenticated);
  const visibleRoutes = workspaceReady ? (["survey", ...workspaceRoutes] as RouteId[]) : (["survey"] as RouteId[]);

  return (
    <main className="lab-shell">
      <header className="lab-topbar">
        <button className="brand-mark" type="button" onClick={() => navigate("survey")}>
          Родовед
        </button>
        <nav
          aria-label={workspaceReady ? "Рабочие разделы" : "Основные разделы"}
          className={workspaceReady ? "workspace-nav" : "public-nav"}
        >
          {visibleRoutes.map((item) => (
            <button
              aria-current={route === item ? "page" : undefined}
              className={route === item ? "is-active" : ""}
              key={item}
              type="button"
              onClick={() => navigate(item)}
            >
              {routeTitles[item]}
            </button>
          ))}
          {!workspaceReady ? (
            <button
              aria-current={route !== "survey" ? "page" : undefined}
              className={route !== "survey" ? "is-active" : ""}
              type="button"
              onClick={() => navigate("entry")}
            >
              <LockKeyhole aria-hidden size={16} />
              Вход
            </button>
          ) : null}
        </nav>
      </header>

      {route === "survey" ? <SurveyPage onSave={(draft) => saveDraft(draft)} /> : null}
      {route !== "survey" && !workspaceReady ? (
        <WorkspaceGate
          status={workspaceStatus}
          onLogin={async (password) => {
            setWorkspaceStatus("");
            try {
              await handleWorkspaceLogin(password);
            } catch {
              setWorkspaceStatus("Пароль не подошёл.");
            }
          }}
        />
      ) : null}
      {route === "entry" && workspaceReady ? (
        <EntryPage
          editingResponse={editingResponse}
          onCancelEdit={() => setEditingId(null)}
          onSave={saveDraft}
        />
      ) : null}
      {route === "data" && workspaceReady ? (
        <DataPage
          pdfFiles={pdfFiles}
          responses={responses}
          onCreateFake={addFakeResponse}
          onDelete={removeResponse}
          onDeleteFake={removeFakeResponses}
          onEdit={editResponse}
          onSaveContact={saveContactWorkflow}
          onSave={saveDraft}
        />
      ) : null}
      {route === "pdf" && workspaceReady ? (
        <PdfPage files={pdfFiles} onAdd={addPdf} onDelete={removePdf} />
      ) : null}
    </main>
  );
}

function WorkspaceGate({
  onLogin,
  status
}: {
  onLogin: (password: string) => Promise<void>;
  status: string;
}) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onLogin(password);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="task-page gate-task">
      <form className="task-panel gate-panel" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Доступ</p>
          <h1>Рабочая зона</h1>
        </div>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="form-actions">
          {status ? <p className="form-status error-status">{status}</p> : null}
          <button className="primary-button" disabled={saving} type="submit">
            Войти
          </button>
        </div>
      </form>
    </section>
  );
}

function SurveyPage({ onSave }: { onSave: (draft: ResponseDraft) => Promise<void> }) {
  const [restoredDraft] = useState(() => readSurveyDraftState());
  const [step, setStep] = useState(restoredDraft.step);
  const [draft, setDraft] = useState<ResponseDraft>(restoredDraft.draft);
  const [status, setStatus] = useState(restoredDraft.restored ? "Черновик восстановлен." : "");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sections = [
    {
      title: "О себе",
      render: (
        <>
          <BasicFields draft={draft} mode="survey" onChange={setDraft} />
          <SearchFields draft={draft} onChange={setDraft} />
        </>
      )
    },
    {
      title: "Опыт",
      render: (
        <QuestionStack
          draft={draft}
          questionsToShow={questions.filter((question) => question.group === "experience")}
          onChange={setDraft}
        />
      )
    },
    {
      title: "Интересы",
      render: (
        <QuestionStack
          draft={draft}
          questionsToShow={questions.filter((question) => question.group === "interest")}
          onChange={setDraft}
        />
      )
    },
    {
      title: "Помощь",
      render: (
        <QuestionStack
          draft={draft}
          questionsToShow={questions.filter((question) => question.group === "help")}
          onChange={setDraft}
        />
      )
    },
    {
      title: "Проверка",
      render: <SurveyReview draft={draft} onEdit={setStep} />
    }
  ];

  useEffect(() => {
    if (hasSurveyDraftContent(draft) || step > 0) {
      writeSurveyDraftState({ draft, step });
      return;
    }

    clearSurveyDraftState();
  }, [draft, step]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (draft.q16 === "yes" && (!draft.contactName?.trim() || !draft.contactPhone?.trim())) {
      setStatus("Укажите имя и телефон, чтобы можно было связаться по запросу.");
      return;
    }

    setSaving(true);
    try {
      await onSave(draft);
      clearSurveyDraftState();
      setDraft(createEmptyDraft("online"));
      setStep(0);
      setStatus("");
      setSubmitted(true);
    } catch {
      setStatus("Не удалось сохранить анкету.");
    } finally {
      setSaving(false);
    }
  }

  function resetSurvey() {
    clearSurveyDraftState();
    setDraft(createEmptyDraft("online"));
    setStep(0);
    setStatus("");
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <section className="task-page survey-task">
        <SurveySuccess onNewSurvey={resetSurvey} />
      </section>
    );
  }

  return (
    <section className="task-page survey-task">
      <div className="task-heading">
        <div>
          <p className="eyebrow">Онлайн</p>
          <h1>Опрос</h1>
        </div>
        <div className="survey-progress-block">
          <StepRail labels={sections.map((section) => section.title)} step={step} onChange={setStep} />
          <div className="survey-progress" aria-hidden>
            <i style={{ width: `${((step + 1) / sections.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <form className="task-panel survey-panel" onSubmit={handleSubmit}>
        <div className="section-title-row">
          <h2>{sections[step].title}</h2>
          <div className="survey-state">
            {hasSurveyDraftContent(draft) ? (
              <button className="link-button" type="button" onClick={resetSurvey}>
                Сбросить
              </button>
            ) : null}
            <span>{step + 1} / {sections.length}</span>
          </div>
        </div>

        {sections[step].render}

        <div className="form-actions">
          {status ? <p className="form-status">{status}</p> : null}
          <button
            className="ghost-button"
            disabled={step === 0}
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Назад
          </button>
          {step < sections.length - 1 ? (
            <button
              className="primary-button"
              type="button"
              onClick={() => setStep((current) => Math.min(sections.length - 1, current + 1))}
            >
              Далее
            </button>
          ) : (
            <button className="primary-button" disabled={saving} type="submit">
              <Save aria-hidden size={18} />
              {saving ? "Отправка..." : "Отправить"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function SurveyReview({ draft, onEdit }: { draft: ResponseDraft; onEdit: (step: number) => void }) {
  return (
    <div className="survey-review">
      <div className="review-block">
        <div>
          <span>О себе</span>
          <button className="link-button" type="button" onClick={() => onEdit(0)}>
            Изменить
          </button>
        </div>
        <dl className="review-list">
          <div>
            <dt>Пол</dt>
            <dd>{genderLabels[draft.gender]}</dd>
          </div>
          <div>
            <dt>Возраст</dt>
            <dd>{ageLabels[draft.ageGroup]}</dd>
          </div>
          <div>
            <dt>Проживание</dt>
            <dd>{residenceLabels[draft.residence]}</dd>
          </div>
        </dl>
      </div>

      <div className="review-block">
        <div>
          <span>Поиск</span>
          <button className="link-button" type="button" onClick={() => onEdit(0)}>
            Изменить
          </button>
        </div>
        <dl className="review-list">
          <div>
            <dt>Территория</dt>
            <dd>{draft.researchTerritory || "—"}</dd>
          </div>
          <div>
            <dt>Период</dt>
            <dd>{formatResearchPeriod(draft) || "—"}</dd>
          </div>
          <div className="review-wide">
            <dt>Свободный текст</dt>
            <dd>{draft.freeText || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="review-block">
        <div>
          <span>Опыт</span>
          <button className="link-button" type="button" onClick={() => onEdit(1)}>
            Изменить
          </button>
        </div>
        <ReviewQuestionList
          draft={draft}
          questionsToShow={questions.filter((question) => question.group === "experience")}
        />
      </div>

      <div className="review-block">
        <div>
          <span>Интересы</span>
          <button className="link-button" type="button" onClick={() => onEdit(2)}>
            Изменить
          </button>
        </div>
        <ReviewQuestionList
          draft={draft}
          questionsToShow={questions.filter((question) => question.group === "interest")}
        />
      </div>

      <div className="review-block">
        <div>
          <span>Помощь</span>
          <button className="link-button" type="button" onClick={() => onEdit(3)}>
            Изменить
          </button>
        </div>
        <dl className="review-list">
          <div>
            <dt>Нужна помощь</dt>
            <dd>{answerLabels[draft.q16]}</dd>
          </div>
          <div>
            <dt>Имя</dt>
            <dd>{draft.contactName || "—"}</dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd>{draft.contactPhone || "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ReviewQuestionList({
  draft,
  questionsToShow
}: {
  draft: ResponseDraft;
  questionsToShow: typeof questions;
}) {
  return (
    <div className="review-question-list">
      {questionsToShow.map((question) => {
        const answer = draft[question.id];

        return (
          <div className="review-question-row" key={question.id}>
            <div>
              <span>{question.number}</span>
              <p>{question.label}</p>
              {question.id === "q11" && draft.q11WarDetails && draft.q11WarDetails !== "—" ? (
                <small>{draft.q11WarDetails}</small>
              ) : null}
            </div>
            <span className={`answer-chip answer-${answer}`}>{answerLabels[answer]}</span>
          </div>
        );
      })}
    </div>
  );
}

function SurveySuccess({ onNewSurvey }: { onNewSurvey: () => void }) {
  return (
    <section className="task-panel survey-success">
      <CheckCircle aria-hidden size={42} />
      <div>
        <p className="eyebrow">Готово</p>
        <h1>Анкета отправлена</h1>
      </div>
      <p>Спасибо. Можно закрыть страницу или заполнить ещё одну анкету.</p>
      <button className="primary-button" type="button" onClick={onNewSurvey}>
        Новая анкета
      </button>
    </section>
  );
}

function EntryPage({
  editingResponse,
  onCancelEdit,
  onSave
}: {
  editingResponse: SurveyResponse | null;
  onCancelEdit: () => void;
  onSave: (draft: ResponseDraft, id?: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ResponseDraft>(() =>
    editingResponse ? responseToDraft(editingResponse) : createEmptyDraft("paper")
  );
  const [status, setStatus] = useState("");
  const answerCounts = countDraftAnswers(draft);
  const experienceQuestions = questions.filter((question) => question.group === "experience");
  const interestQuestions = questions.filter((question) => question.group === "interest");
  const helpQuestions = questions.filter((question) => question.group === "help");

  useEffect(() => {
    setDraft(editingResponse ? responseToDraft(editingResponse) : createEmptyDraft("paper"));
    setStatus("");
  }, [editingResponse]);

  function jumpToEntrySection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await onSave(draft, editingResponse?.id);
      setDraft(createEmptyDraft("paper"));
      setStatus(editingResponse ? "Изменения сохранены." : "Анкета добавлена.");
    } catch {
      setStatus("Не удалось сохранить анкету.");
    }
  }

  return (
    <section className="task-page entry-task">
      <div className="task-heading">
        <div>
          <p className="eyebrow">Оператор</p>
          <h1>{editingResponse ? "Изменение анкеты" : "Быстрый ввод"}</h1>
        </div>
        {editingResponse ? (
          <button className="ghost-button" type="button" onClick={onCancelEdit}>
            Новая анкета
          </button>
        ) : null}
      </div>

      <form className="task-panel entry-panel" onSubmit={handleSubmit}>
        <div className="entry-toolbar" aria-label="Навигация по анкете">
          <div className="entry-answer-counts" aria-label="Сводка ответов">
            <span>Да <b>{answerCounts.yes}</b></span>
            <span>Нет <b>{answerCounts.no}</b></span>
            <span>— <b>{answerCounts.unknown}</b></span>
          </div>
          <div className="entry-jump-row">
            <button type="button" onClick={() => jumpToEntrySection("entry-basic")}>
              1-3
            </button>
            <button type="button" onClick={() => jumpToEntrySection("entry-experience")}>
              Опыт
            </button>
            <button type="button" onClick={() => jumpToEntrySection("entry-interest")}>
              Интересы
            </button>
            <button type="button" onClick={() => jumpToEntrySection("entry-help")}>
              Помощь
            </button>
          </div>
        </div>

        <section className="entry-section" id="entry-basic">
          <div className="entry-section-title">
            <span>1-3</span>
            <h2>Данные анкеты</h2>
          </div>
          <BasicFields draft={draft} mode="entry" onChange={setDraft} />
        </section>

        <section className="entry-section" id="entry-experience">
          <div className="entry-section-title">
            <span>4-6</span>
            <h2>Опыт</h2>
          </div>
          <QuestionStack draft={draft} questionsToShow={experienceQuestions} onChange={setDraft} />
        </section>

        <section className="entry-section" id="entry-interest">
          <div className="entry-section-title">
            <span>7-15</span>
            <h2>Интересы</h2>
          </div>
          <QuestionStack draft={draft} questionsToShow={interestQuestions} onChange={setDraft} />
        </section>

        <section className="entry-section" id="entry-help">
          <div className="entry-section-title">
            <span>16</span>
            <h2>Помощь</h2>
          </div>
          <QuestionStack draft={draft} questionsToShow={helpQuestions} onChange={setDraft} />
        </section>

        <div className="form-actions sticky-actions">
          {status ? <p className="form-status">{status}</p> : null}
          <button className="primary-button wide-button" type="submit">
            <Plus aria-hidden size={18} />
            {editingResponse ? "Сохранить изменения" : "Добавить анкету"}
          </button>
        </div>
      </form>
    </section>
  );
}

function DataPage({
  pdfFiles,
  onCreateFake,
  responses,
  onDelete,
  onDeleteFake,
  onEdit,
  onSaveContact,
  onSave
}: {
  pdfFiles: PdfRecord[];
  onCreateFake: () => Promise<void>;
  responses: SurveyResponse[];
  onDelete: (id: string) => Promise<void>;
  onDeleteFake: () => Promise<number>;
  onEdit: (id: string) => void;
  onSaveContact: (
    id: string,
    input: { contactNote?: string; contactStatus: ContactStatus }
  ) => Promise<void>;
  onSave: (draft: ResponseDraft, id?: string) => Promise<void>;
}) {
  const [filters, setFilters] = useState<Filters>(() => createInitialFilters());
  const [dataStatus, setDataStatus] = useState("");
  const [busyAction, setBusyAction] = useState<"fake-add" | "fake-delete" | "row-delete" | "row-save" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [detailDraft, setDetailDraft] = useState<ResponseDraft | null>(null);
  const [questionGroupFilter, setQuestionGroupFilter] = useState<QuestionGroupFilter>("all");
  const filteredResponses = useMemo(
    () => responses.filter((response) => matchesFilters(response, filters)),
    [responses, filters]
  );
  const matchingPdfs = useMemo(
    () => pdfFiles.filter((file) => isDateInRange(file.surveyDate, filters.dateFrom, filters.dateTo)),
    [pdfFiles, filters.dateFrom, filters.dateTo]
  );
  const helpRequests = useMemo(
    () => filteredResponses.filter((response) => response.q16 === "yes"),
    [filteredResponses]
  );
  const summary = buildSummary(filteredResponses);
  const selectedResponse = filteredResponses.find((response) => response.id === selectedId) ?? null;
  const filtersActive = hasActiveFilters(filters);

  useEffect(() => {
    if (selectedId && !filteredResponses.some((response) => response.id === selectedId)) {
      setSelectedId(null);
      setDetailMode("view");
      setDetailDraft(null);
    }
  }, [filteredResponses, selectedId]);

  useEffect(() => {
    if (selectedResponse && detailMode === "view") {
      setDetailDraft(responseToDraft(selectedResponse));
    }
  }, [detailMode, selectedResponse]);

  function openResponse(response: SurveyResponse) {
    setSelectedId(response.id);
    setDetailMode("view");
    setDetailDraft(responseToDraft(response));
  }

  function editResponseInline(response: SurveyResponse) {
    setSelectedId(response.id);
    setDetailMode("edit");
    setDetailDraft(responseToDraft(response));
  }

  async function handleSaveSelected() {
    if (!selectedResponse || !detailDraft) {
      return;
    }

    setBusyAction("row-save");
    setDataStatus("");
    try {
      await onSave(detailDraft, selectedResponse.id);
      setDetailMode("view");
      setDataStatus("Строка обновлена.");
    } catch {
      setDataStatus("Не удалось сохранить строку.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveContactWorkflow(
    response: SurveyResponse,
    input: { contactNote?: string; contactStatus: ContactStatus }
  ) {
    setDataStatus("");
    try {
      await onSaveContact(response.id, input);
      setDataStatus("Обращение обновлено.");
    } catch {
      setDataStatus("Не удалось обновить обращение.");
      throw new Error("contact_workflow_update_failed");
    }
  }

  async function handleDeleteResponse(response: SurveyResponse) {
    const rowType = response.isFake ? "демо-строку" : "строку";
    if (!window.confirm(`Удалить ${rowType} за ${response.surveyDate}?`)) {
      return;
    }

    setBusyAction("row-delete");
    setDataStatus("");
    try {
      await onDelete(response.id);
      if (selectedId === response.id) {
        setSelectedId(null);
        setDetailMode("view");
        setDetailDraft(null);
      }
      setDataStatus("Строка удалена.");
    } catch {
      setDataStatus("Не удалось удалить строку.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateFake() {
    setBusyAction("fake-add");
    setDataStatus("");
    try {
      await onCreateFake();
      setDataStatus("Демо-анкета добавлена.");
    } catch {
      setDataStatus("Не удалось добавить демо-анкету.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteFake() {
    const fakeCount = responses.filter((response) => response.isFake).length;
    if (fakeCount === 0) {
      setDataStatus("Демо-анкет сейчас нет.");
      return;
    }

    if (!window.confirm(`Удалить ${fakeCount} демо-анкет? Реальные строки не будут затронуты.`)) {
      return;
    }

    setBusyAction("fake-delete");
    setDataStatus("");
    try {
      const deleted = await onDeleteFake();
      setDataStatus(`Удалено демо-анкет: ${deleted}.`);
    } catch {
      setDataStatus("Не удалось удалить демо-анкеты.");
    } finally {
      setBusyAction(null);
    }
  }

  function resetFilters() {
    setFilters(createInitialFilters());
  }

  return (
    <section className="task-page data-task">
      <div className="task-heading">
        <div>
          <p className="eyebrow">Работа</p>
          <h1>Данные</h1>
        </div>
        <div className="header-action-row">
          <button className="ghost-button" disabled={busyAction !== null} type="button" onClick={handleCreateFake}>
            <Plus aria-hidden size={18} />
            Добавить демо
          </button>
          <button className="ghost-button" disabled={busyAction !== null} type="button" onClick={handleDeleteFake}>
            <Trash2 aria-hidden size={18} />
            Удалить демо
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => downloadCsv(filteredResponses)}
          >
            <Download aria-hidden size={18} />
            CSV
          </button>
        </div>
      </div>
      {dataStatus ? <p className="form-status">{dataStatus}</p> : null}

      <section className="task-panel filter-panel">
        <div className="filter-title-row">
          <div>
            <span>Срез</span>
            <strong>{filteredResponses.length} из {responses.length}</strong>
          </div>
          <button className="ghost-button compact-button" disabled={!filtersActive} type="button" onClick={resetFilters}>
            Сбросить
          </button>
        </div>
        <div className="compact-grid">
          <label>
            Дата с
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
            />
          </label>
          <label>
            Дата по
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
            />
          </label>
          <label>
            Источник
            <select
              value={filters.source}
              onChange={(event) =>
                setFilters({ ...filters, source: event.target.value as Filters["source"] })
              }
            >
              <option value="all">все</option>
              <option value="online">онлайн</option>
              <option value="paper">бумага</option>
            </select>
          </label>
          <label>
            Поиск
            <input
              placeholder="территория, текст, контакт"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
          </label>
        </div>
        <div className="filter-choice-grid">
          <MultiSegmentedGroup
            label="Пол"
            options={(Object.keys(genderLabels) as Gender[]).map((value) => ({
              value,
              label: genderLabels[value]
            }))}
            values={filters.gender}
            onChange={(values) => setFilters({ ...filters, gender: values as Gender[] })}
          />
          <MultiSegmentedGroup
            label="Возраст"
            options={(Object.keys(ageLabels) as AgeGroup[]).map((value) => ({
              value,
              label: ageLabels[value]
            }))}
            values={filters.ageGroup}
            onChange={(values) => setFilters({ ...filters, ageGroup: values as AgeGroup[] })}
          />
          <MultiSegmentedGroup
            label="Проживание"
            options={(Object.keys(residenceLabels) as Residence[]).map((value) => ({
              value,
              label: residenceLabels[value]
            }))}
            values={filters.residence}
            onChange={(values) => setFilters({ ...filters, residence: values as Residence[] })}
          />
          <MultiSegmentedGroup
            label="Статус обращения"
            options={(Object.keys(contactStatusLabels) as ContactStatus[]).map((value) => ({
              value,
              label: contactStatusLabels[value]
            }))}
            values={filters.contactStatus}
            onChange={(values) => setFilters({ ...filters, contactStatus: values as ContactStatus[] })}
          />
        </div>
        <div className="filter-switches">
          <label className="switch-row">
            <input
              checked={filters.helpOnly}
              type="checkbox"
              onChange={(event) => setFilters({ ...filters, helpOnly: event.target.checked })}
            />
            Только нужна помощь
          </label>
          <label className="switch-row">
            <input
              checked={filters.contactOnly}
              type="checkbox"
              onChange={(event) => setFilters({ ...filters, contactOnly: event.target.checked })}
            />
            Есть контакт
          </label>
        </div>
      </section>

      <section className="summary-grid" aria-label="Сводка">
        <Metric icon={Database} label="Анкет" value={filteredResponses.length} />
        <Metric icon={ClipboardList} label="Онлайн" value={summary.online} />
        <Metric icon={PenLine} label="Бумага" value={summary.paper} />
        <Metric icon={Search} label="Нужна помощь" value={summary.help} />
        <Metric icon={Phone} label="Контакты" value={summary.contacts} />
        <Metric icon={Database} label="Демо" value={summary.fake} />
      </section>

      <section className="task-panel help-queue-panel">
        <div className="section-title-row">
          <h2>Обращения</h2>
          <span>{helpRequests.length}</span>
        </div>
        <HelpQueue responses={helpRequests} selectedId={selectedId} onOpen={openResponse} />
      </section>

      <section className="data-layout">
        <div className="task-panel">
          <div className="section-title-row">
            <h2>PDF за период</h2>
            <span>{matchingPdfs.length}</span>
          </div>
          <PdfMiniList files={matchingPdfs} />
        </div>

        <div className="task-panel">
          <div className="section-title-row">
            <h2>Возраст</h2>
            <span>{filteredResponses.length}</span>
          </div>
          <BarList data={summary.ageBars} />
        </div>

        <div className="task-panel">
          <div className="section-title-row">
            <h2>Проживание</h2>
            <span>{filteredResponses.length}</span>
          </div>
          <BarList data={summary.residenceBars} />
        </div>

        <div className="task-panel">
          <div className="section-title-row">
            <h2>Пол</h2>
            <span>{filteredResponses.length}</span>
          </div>
          <BarList data={summary.genderBars} />
        </div>

        <div className="task-panel">
          <div className="section-title-row">
            <h2>Источник</h2>
            <span>{filteredResponses.length}</span>
          </div>
          <BarList data={summary.sourceBars} />
        </div>
      </section>

      <details className="task-panel insight-panel">
        <summary>
          <span>Ответы по вопросам</span>
          <b>{filteredResponses.length}</b>
        </summary>
        <QuestionBreakdown
          data={summary.questionBars}
          groupFilter={questionGroupFilter}
          onGroupChange={setQuestionGroupFilter}
        />
      </details>

      <section className="task-panel">
        <div className="section-title-row">
          <h2>Строки</h2>
          <span>{filteredResponses.length}</span>
        </div>
        <div className="row-workbench">
          <ResponseRows
            responses={filteredResponses}
            selectedId={selectedId}
            onDelete={handleDeleteResponse}
            onEdit={editResponseInline}
            onOpen={openResponse}
          />
          <ResponseInspector
            busy={busyAction === "row-save"}
            draft={detailDraft}
            mode={detailMode}
            response={selectedResponse}
            onCancel={() => {
              if (selectedResponse) {
                setDetailDraft(responseToDraft(selectedResponse));
              }
              setDetailMode("view");
            }}
            onChange={setDetailDraft}
            onClose={() => {
              setSelectedId(null);
              setDetailMode("view");
              setDetailDraft(null);
            }}
            onDelete={handleDeleteResponse}
            onEdit={editResponseInline}
            onOpenEntry={onEdit}
            onSaveContact={handleSaveContactWorkflow}
            onSave={handleSaveSelected}
          />
        </div>
      </section>
    </section>
  );
}

function PdfPage({
  files,
  onAdd,
  onDelete
}: {
  files: PdfRecord[];
  onAdd: (displayName: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [surveyDate, setSurveyDate] = useState(todayString());
  const [status, setStatus] = useState("");
  const displayName = `${surveyDate.replaceAll("-", "")}_анкеты.pdf`;
  const existingFile = files.find((file) => file.displayName === displayName);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setStatus("Выберите PDF-файл.");
      return;
    }

    if (existingFile) {
      setStatus(`${displayName} уже есть в архиве. Сначала удалите старый файл или выберите другую дату.`);
      event.target.value = "";
      return;
    }

    try {
      await onAdd(displayName, file);
      setStatus(`${displayName} добавлен.`);
      event.target.value = "";
    } catch (error) {
      if (error instanceof Error && error.message.includes("409")) {
        setStatus(`${displayName} уже есть в архиве. Сначала удалите старый файл или выберите другую дату.`);
      } else {
        setStatus("Не удалось сохранить PDF.");
      }
    }
  }

  return (
    <section className="task-page pdf-task">
      <div className="task-heading">
        <div>
          <p className="eyebrow">Архив</p>
          <h1>PDF</h1>
        </div>
      </div>

      <section className="task-panel upload-panel">
        <div className="compact-grid">
          <label>
            Дата опроса
            <input type="date" value={surveyDate} onChange={(event) => setSurveyDate(event.target.value)} />
          </label>
          <div className="file-name-preview">
            Название
            <strong>{displayName}</strong>
            {existingFile ? <span>Файл за эту дату уже загружен.</span> : null}
          </div>
          <label className="file-drop">
            <Upload aria-hidden size={22} />
            Загрузить PDF
            <input accept="application/pdf" type="file" onChange={handleFile} />
          </label>
        </div>
        {status ? <p className="form-status">{status}</p> : null}
      </section>

      <section className="task-panel">
        <div className="section-title-row">
          <h2>Файлы</h2>
          <span>{files.length}</span>
        </div>
        <PdfRows files={files} onDelete={onDelete} />
      </section>
    </section>
  );
}

function BasicFields({
  draft,
  mode,
  onChange
}: {
  draft: ResponseDraft;
  mode: "survey" | "entry";
  onChange: (draft: ResponseDraft) => void;
}) {
  return (
    <div className="basic-grid">
      {mode === "entry" ? (
        <label>
          Дата
          <input
            required
            type="date"
            value={draft.surveyDate}
            onChange={(event) => onChange({ ...draft, surveyDate: event.target.value })}
          />
        </label>
      ) : null}
      <SegmentedGroup
        label="Пол"
        options={[
          { value: "female", label: genderLabels.female },
          { value: "male", label: genderLabels.male }
        ]}
        value={draft.gender}
        onChange={(value) => onChange({ ...draft, gender: value as Gender })}
      />
      <SegmentedGroup
        label="Возраст"
        options={[
          { value: "under_18", label: ageLabels.under_18 },
          { value: "18_40", label: ageLabels["18_40"] },
          { value: "over_40", label: ageLabels.over_40 }
        ]}
        value={draft.ageGroup}
        onChange={(value) => onChange({ ...draft, ageGroup: value as AgeGroup })}
      />
      <SegmentedGroup
        label="Место проживания"
        options={[
          { value: "snezhinsk", label: residenceLabels.snezhinsk },
          { value: "other", label: residenceLabels.other }
        ]}
        value={draft.residence}
        onChange={(value) => onChange({ ...draft, residence: value as Residence })}
      />
    </div>
  );
}

function SearchFields({
  draft,
  onChange
}: {
  draft: ResponseDraft;
  onChange: (draft: ResponseDraft) => void;
}) {
  return (
    <div className="search-grid">
      <label>
        Территория поиска
        <input
          placeholder="Снежинск, Челябинская область"
          value={draft.researchTerritory ?? ""}
          onChange={(event) => onChange({ ...draft, researchTerritory: event.target.value || undefined })}
        />
      </label>
      <div className="period-pair">
        <label>
          Период с
          <input
            inputMode="numeric"
            max={2100}
            min={1500}
            placeholder="1850"
            type="number"
            value={draft.researchPeriodStart ?? ""}
            onChange={(event) =>
              onChange({ ...draft, researchPeriodStart: parseOptionalNumber(event.target.value) })
            }
          />
        </label>
        <label>
          по
          <input
            inputMode="numeric"
            max={2100}
            min={1500}
            placeholder="1945"
            type="number"
            value={draft.researchPeriodEnd ?? ""}
            onChange={(event) =>
              onChange({ ...draft, researchPeriodEnd: parseOptionalNumber(event.target.value) })
            }
          />
        </label>
      </div>
      <label className="full-field">
        Свободный текст
        <textarea
          placeholder="Фамилии, населённые пункты, уточнения"
          rows={4}
          value={draft.freeText ?? ""}
          onChange={(event) => onChange({ ...draft, freeText: event.target.value || undefined })}
        />
      </label>
    </div>
  );
}

function QuestionStack({
  draft,
  questionsToShow,
  onChange
}: {
  draft: ResponseDraft;
  questionsToShow: typeof questions;
  onChange: (draft: ResponseDraft) => void;
}) {
  return (
    <div className="question-stack">
      {questionsToShow.map((question) => (
        <div className="question-card" key={question.id}>
          <div>
            <span>{question.number}</span>
            <p>{question.label}</p>
          </div>
          <SegmentedGroup
            compact
            label=""
            options={[
              { value: "yes", label: "Да" },
              { value: "no", label: "Нет" },
              { value: "unknown", label: "—" }
            ]}
            value={draft[question.id]}
            onChange={(value) =>
              onChange({
                ...draft,
                [question.id]: value as Answer,
                ...(question.id === "q16" && value !== "yes"
                  ? { contactName: undefined, contactPhone: undefined }
                  : {})
              })
            }
          />
          {question.id === "q11" ? (
            <label className="war-select">
              Какая война
              <select
                value={draft.q11WarDetails ?? "—"}
                onChange={(event) => onChange({ ...draft, q11WarDetails: event.target.value })}
              >
                {warOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {question.id === "q16" && draft.q16 === "yes" ? (
            <div className="contact-grid">
              <label>
                Имя
                <input
                  autoComplete="name"
                  required
                  value={draft.contactName ?? ""}
                  onChange={(event) => onChange({ ...draft, contactName: event.target.value || undefined })}
                />
              </label>
              <label>
                Номер телефона
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  type="tel"
                  value={draft.contactPhone ?? ""}
                  onChange={(event) => onChange({ ...draft, contactPhone: event.target.value || undefined })}
                />
              </label>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SegmentedGroup({
  compact,
  label,
  onChange,
  options,
  value
}: {
  compact?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <fieldset className={compact ? "segmented compact" : "segmented"}>
      {label ? <legend>{label}</legend> : null}
      <div>
        {options.map((option) => (
          <button
            className={value === option.value ? "is-selected" : ""}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MultiSegmentedGroup({
  label,
  onChange,
  options,
  values
}: {
  label: string;
  onChange: (values: string[]) => void;
  options: Array<{ value: string; label: string }>;
  values: string[];
}) {
  function toggleValue(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <fieldset className="segmented multi-segmented">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            aria-pressed={values.includes(option.value)}
            className={values.includes(option.value) ? "is-selected" : ""}
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StepRail({
  labels,
  onChange,
  step
}: {
  labels: string[];
  onChange: (step: number) => void;
  step: number;
}) {
  return (
    <div className="step-rail">
      {labels.map((label, index) => (
        <button
          className={index === step ? "is-active" : ""}
          key={label}
          type="button"
          onClick={() => onChange(index)}
        >
          <span>{index + 1}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Database;
  label: string;
  value: number;
}) {
  return (
    <article className="metric-card">
      <Icon aria-hidden size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function BarList({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="bar-list">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );
}

function QuestionBreakdown({
  data,
  groupFilter,
  onGroupChange
}: {
  data: Array<{
    group: QuestionGroup;
    label: string;
    no: number;
    number: number;
    unknown: number;
    yes: number;
  }>;
  groupFilter: QuestionGroupFilter;
  onGroupChange: (group: QuestionGroupFilter) => void;
}) {
  const visibleData =
    groupFilter === "all" ? data : data.filter((item) => item.group === groupFilter);

  return (
    <div className="question-breakdown">
      <SegmentedGroup
        compact
        label="Группа"
        options={[
          { value: "all", label: "Все" },
          { value: "experience", label: "Опыт" },
          { value: "interest", label: "Интересы" },
          { value: "help", label: "Помощь" }
        ]}
        value={groupFilter}
        onChange={(value) => onGroupChange(value as QuestionGroupFilter)}
      />
      {visibleData.map((item) => {
        const total = Math.max(1, item.yes + item.no + item.unknown);

        return (
          <article className="question-breakdown-row" key={item.number}>
            <div>
              <b>{item.number}</b>
              <span>{item.label}</span>
            </div>
            <div className="stacked-bar" aria-label={`Вопрос ${item.number}`}>
              <i className="bar-yes" style={{ width: `${(item.yes / total) * 100}%` }} />
              <i className="bar-no" style={{ width: `${(item.no / total) * 100}%` }} />
              <i className="bar-unknown" style={{ width: `${(item.unknown / total) * 100}%` }} />
            </div>
            <p>
              Да {item.yes} · Нет {item.no} · — {item.unknown}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function HelpQueue({
  onOpen,
  responses,
  selectedId
}: {
  onOpen: (response: SurveyResponse) => void;
  responses: SurveyResponse[];
  selectedId: string | null;
}) {
  if (responses.length === 0) {
    return <p className="empty-state">Обращений в текущем срезе нет.</p>;
  }

  return (
    <div className="help-queue">
      {responses.map((response) => (
        <article
          className={["help-card", selectedId === response.id ? "is-selected" : ""]
            .filter(Boolean)
            .join(" ")}
          key={response.id}
        >
          <div>
            <span className={`source-pill source-${response.source}`}>{sourceLabels[response.source]}</span>
            {response.isFake ? <span className="demo-badge">демо</span> : null}
            <span className={`workflow-badge workflow-${response.contactStatus}`}>
              {contactStatusLabels[response.contactStatus]}
            </span>
            <strong>{response.contactName?.trim() || "Без имени"}</strong>
            <p>
              {response.surveyDate} · {ageLabels[response.ageGroup]} · {residenceLabels[response.residence]}
            </p>
            {response.researchTerritory ? <small>{response.researchTerritory}</small> : null}
            {response.freeText ? <small>{response.freeText}</small> : null}
          </div>
          <div className="help-actions">
            {response.contactPhone ? (
              <a href={`tel:${normalizePhone(response.contactPhone)}`}>
                <Phone aria-hidden size={17} />
                {response.contactPhone}
              </a>
            ) : (
              <span>Нет телефона</span>
            )}
            <button type="button" onClick={() => onOpen(response)}>
              <ClipboardList aria-hidden size={17} />
              Открыть
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ResponseRows({
  onDelete,
  onEdit,
  onOpen,
  selectedId,
  responses
}: {
  onDelete: (response: SurveyResponse) => Promise<void>;
  onEdit: (response: SurveyResponse) => void;
  onOpen: (response: SurveyResponse) => void;
  selectedId: string | null;
  responses: SurveyResponse[];
}) {
  if (responses.length === 0) {
    return <p className="empty-state">Анкет по текущим условиям нет.</p>;
  }

  return (
    <div className="row-list">
      {responses.map((response) => (
        <article
          className={[
            "response-row",
            response.isFake ? "is-demo" : "",
            selectedId === response.id ? "is-selected" : ""
          ].filter(Boolean).join(" ")}
          key={response.id}
        >
          <div>
            <span className={`source-pill source-${response.source}`}>{sourceLabels[response.source]}</span>
            {response.isFake ? <span className="demo-badge">демо</span> : null}
            <strong>{response.surveyDate}</strong>
            <p>
              {genderLabels[response.gender]} · {ageLabels[response.ageGroup]} ·{" "}
              {residenceLabels[response.residence]}
            </p>
          </div>
          <div className="row-meta">
            <span>Q16: {answerLabels[response.q16]}</span>
            {response.contactPhone ? <a href={`tel:${normalizePhone(response.contactPhone)}`}>{response.contactPhone}</a> : null}
            {response.researchTerritory ? <span>{response.researchTerritory}</span> : null}
          </div>
          <div className="row-actions">
            <button type="button" onClick={() => onOpen(response)}>
              <ClipboardList aria-hidden size={17} />
              Открыть
            </button>
            <button type="button" onClick={() => onEdit(response)}>
              <PenLine aria-hidden size={17} />
              Изменить
            </button>
            <button type="button" onClick={() => onDelete(response)}>
              <Trash2 aria-hidden size={17} />
              Удалить
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ResponseInspector({
  busy,
  draft,
  mode,
  onCancel,
  onChange,
  onClose,
  onDelete,
  onEdit,
  onOpenEntry,
  onSaveContact,
  onSave,
  response
}: {
  busy: boolean;
  draft: ResponseDraft | null;
  mode: "view" | "edit";
  onCancel: () => void;
  onChange: (draft: ResponseDraft) => void;
  onClose: () => void;
  onDelete: (response: SurveyResponse) => Promise<void>;
  onEdit: (response: SurveyResponse) => void;
  onOpenEntry: (id: string) => void;
  onSaveContact: (
    response: SurveyResponse,
    input: { contactNote?: string; contactStatus: ContactStatus }
  ) => Promise<void>;
  onSave: () => Promise<void>;
  response: SurveyResponse | null;
}) {
  if (!response) {
    return (
      <aside className="row-inspector empty-inspector">
        <ClipboardList aria-hidden size={28} />
        <strong>Выберите строку</strong>
        <p>Здесь откроются контакты, заметки и ответы выбранной анкеты.</p>
      </aside>
    );
  }

  if (mode === "edit" && draft) {
    return (
      <aside className="row-inspector">
        <div className="inspector-heading">
          <div>
            <span className={`source-pill source-${response.source}`}>{sourceLabels[response.source]}</span>
            {response.isFake ? <span className="demo-badge">демо</span> : null}
            <h3>{response.surveyDate}</h3>
          </div>
          <button className="ghost-button compact-button" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <form
          className="inline-editor"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <BasicFields draft={draft} mode="entry" onChange={onChange} />
          <SearchFields draft={draft} onChange={onChange} />
          <QuestionStack draft={draft} questionsToShow={questions} onChange={onChange} />
          <div className="form-actions">
            <button className="primary-button" disabled={busy} type="submit">
              <Save aria-hidden size={18} />
              {busy ? "Сохранение..." : "Сохранить"}
            </button>
            <button className="ghost-button" disabled={busy} type="button" onClick={onCancel}>
              Отмена
            </button>
          </div>
        </form>
      </aside>
    );
  }

  return (
    <aside className="row-inspector">
      <div className="inspector-heading">
        <div>
          <span className={`source-pill source-${response.source}`}>{sourceLabels[response.source]}</span>
          {response.isFake ? <span className="demo-badge">демо</span> : null}
          <h3>{response.surveyDate}</h3>
        </div>
        <button className="ghost-button compact-button" type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>

      <div className="detail-grid">
        <Detail label="Пол" value={genderLabels[response.gender]} />
        <Detail label="Возраст" value={ageLabels[response.ageGroup]} />
        <Detail label="Проживание" value={residenceLabels[response.residence]} />
        <Detail label="Помощь" value={answerLabels[response.q16]} />
        <Detail label="Имя" value={response.contactName} />
        <Detail label="Телефон" value={response.contactPhone} phone />
        <Detail label="Статус" value={contactStatusLabels[response.contactStatus]} />
        <Detail label="Территория" value={response.researchTerritory} />
        <Detail label="Период" value={formatResearchPeriod(response)} />
        <Detail label="Война" value={response.q11WarDetails} />
        <Detail label="Комментарий" value={response.freeText} wide />
        <Detail label="Заметка по обращению" value={response.contactNote} wide />
      </div>

      {response.q16 === "yes" ? (
        <ContactWorkflowPanel response={response} onSave={onSaveContact} />
      ) : null}

      <div className="yes-list">
        <strong>Ответы «Да»</strong>
        <p>{formatYesAnswers(response)}</p>
      </div>

      <div className="form-actions">
        <button className="primary-button" type="button" onClick={() => onEdit(response)}>
          <PenLine aria-hidden size={17} />
          Изменить здесь
        </button>
        <button className="ghost-button" type="button" onClick={() => onOpenEntry(response.id)}>
          Открыть во вводе
        </button>
        <button className="ghost-button" type="button" onClick={() => onDelete(response)}>
          <Trash2 aria-hidden size={17} />
          Удалить
        </button>
      </div>
    </aside>
  );
}

function ContactWorkflowPanel({
  onSave,
  response
}: {
  onSave: (
    response: SurveyResponse,
    input: { contactNote?: string; contactStatus: ContactStatus }
  ) => Promise<void>;
  response: SurveyResponse;
}) {
  const [contactStatus, setContactStatus] = useState<ContactStatus>(response.contactStatus);
  const [contactNote, setContactNote] = useState(response.contactNote ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setContactStatus(response.contactStatus);
    setContactNote(response.contactNote ?? "");
    setStatus("");
  }, [response.contactNote, response.contactStatus, response.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await onSave(response, {
        contactNote: cleanOptional(contactNote),
        contactStatus
      });
      setStatus("Сохранено.");
    } catch {
      setStatus("Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="contact-workflow" onSubmit={handleSubmit}>
      <div className="section-title-row">
        <h3>Обращение</h3>
        <span>{contactStatusLabels[contactStatus]}</span>
      </div>
      <SegmentedGroup
        label="Статус"
        options={(Object.keys(contactStatusLabels) as ContactStatus[]).map((value) => ({
          value,
          label: contactStatusLabels[value]
        }))}
        value={contactStatus}
        onChange={(value) => setContactStatus(value as ContactStatus)}
      />
      <label>
        Заметка
        <textarea
          rows={3}
          value={contactNote}
          onChange={(event) => setContactNote(event.target.value)}
        />
      </label>
      <div className="form-actions">
        {status ? <p className="form-status">{status}</p> : null}
        <button className="primary-button" disabled={saving} type="submit">
          <Save aria-hidden size={18} />
          {saving ? "Сохранение..." : "Сохранить обращение"}
        </button>
      </div>
    </form>
  );
}

function Detail({
  label,
  phone,
  value,
  wide
}: {
  label: string;
  phone?: boolean;
  value: string | undefined;
  wide?: boolean;
}) {
  const rendered = value?.trim() || "—";

  return (
    <div className={wide ? "detail-item wide-detail" : "detail-item"}>
      <span>{label}</span>
      {phone && value ? <a href={`tel:${normalizePhone(value)}`}>{value}</a> : <b>{rendered}</b>}
    </div>
  );
}

function PdfMiniList({ files }: { files: PdfRecord[] }) {
  if (files.length === 0) {
    return <p className="empty-state">PDF за выбранный период не добавлены.</p>;
  }

  return (
    <div className="mini-list">
      {files.slice(0, 5).map((file) => (
        <a href={getLabPdfDownloadUrl(file.id)} key={file.id}>
          <FileText aria-hidden size={18} />
          <span>{file.displayName}</span>
          <b>{file.surveyDate}</b>
        </a>
      ))}
    </div>
  );
}

function PdfRows({ files, onDelete }: { files: PdfRecord[]; onDelete: (id: string) => void }) {
  if (files.length === 0) {
    return <p className="empty-state">Файлы ещё не добавлены.</p>;
  }

  return (
    <div className="row-list">
      {files.map((file) => (
        <article className="pdf-row" key={file.id}>
          <FileText aria-hidden size={24} />
          <div>
            <strong>{file.displayName}</strong>
            <p>
              {file.surveyDate} · {formatFileSize(file.sizeBytes)}
            </p>
          </div>
          <div className="row-actions">
            <a href={getLabPdfDownloadUrl(file.id)}>
              <Download aria-hidden size={17} />
              Скачать
            </a>
            <button type="button" onClick={() => onDelete(file.id)}>
              <Trash2 aria-hidden size={17} />
              Удалить
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function createEmptyDraft(source: ResponseSource): ResponseDraft {
  return {
    surveyDate: todayString(),
    source,
    gender: "female",
    ageGroup: "over_40",
    residence: "snezhinsk",
    q4: "unknown",
    q5: "unknown",
    q6: "unknown",
    q7: "unknown",
    q8: "unknown",
    q9: "unknown",
    q10: "unknown",
    q11: "unknown",
    q11WarDetails: "—",
    q12: "unknown",
    q13: "unknown",
    q14: "unknown",
    q15: "unknown",
    q16: "unknown"
  };
}

function readSurveyDraftState(): { draft: ResponseDraft; restored: boolean; step: number } {
  const fallback = { draft: createEmptyDraft("online"), restored: false, step: 0 };

  try {
    const raw = window.localStorage.getItem(surveyDraftStorageKey);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as { draft?: unknown; step?: unknown };
    const draft = coerceStoredOnlineDraft(parsed.draft);
    const step = clampSurveyStep(parsed.step);

    if (!hasSurveyDraftContent(draft) && step === 0) {
      return fallback;
    }

    return { draft, restored: true, step };
  } catch {
    return fallback;
  }
}

function writeSurveyDraftState(input: { draft: ResponseDraft; step: number }): void {
  try {
    window.localStorage.setItem(
      surveyDraftStorageKey,
      JSON.stringify({ draft: input.draft, savedAt: new Date().toISOString(), step: input.step })
    );
  } catch {
    // Local draft persistence is a convenience; survey submission must keep working without it.
  }
}

function clearSurveyDraftState(): void {
  try {
    window.localStorage.removeItem(surveyDraftStorageKey);
  } catch {
    // Ignore storage failures.
  }
}

function hasSurveyDraftContent(draft: ResponseDraft): boolean {
  const defaults = createEmptyDraft("online");

  return (
    draft.gender !== defaults.gender ||
    draft.ageGroup !== defaults.ageGroup ||
    draft.residence !== defaults.residence ||
    questions.some((question) => draft[question.id] !== "unknown") ||
    Boolean(cleanOptional(draft.q11WarDetails) && draft.q11WarDetails !== "—") ||
    Boolean(cleanOptional(draft.researchTerritory)) ||
    Boolean(draft.researchPeriodStart) ||
    Boolean(draft.researchPeriodEnd) ||
    Boolean(cleanOptional(draft.freeText)) ||
    Boolean(cleanOptional(draft.contactName)) ||
    Boolean(cleanOptional(draft.contactPhone))
  );
}

function coerceStoredOnlineDraft(value: unknown): ResponseDraft {
  const fallback = createEmptyDraft("online");
  if (!isRecord(value)) {
    return fallback;
  }

  const draft: ResponseDraft = {
    ...fallback,
    ageGroup: isAgeGroup(value.ageGroup) ? value.ageGroup : fallback.ageGroup,
    contactName: optionalStoredString(value.contactName),
    contactPhone: optionalStoredString(value.contactPhone),
    freeText: optionalStoredString(value.freeText),
    gender: isGender(value.gender) ? value.gender : fallback.gender,
    q11WarDetails: optionalStoredString(value.q11WarDetails) ?? fallback.q11WarDetails,
    researchPeriodEnd: optionalStoredNumber(value.researchPeriodEnd),
    researchPeriodStart: optionalStoredNumber(value.researchPeriodStart),
    researchTerritory: optionalStoredString(value.researchTerritory),
    residence: isResidence(value.residence) ? value.residence : fallback.residence,
    source: "online",
    surveyDate: isIsoDate(value.surveyDate) ? value.surveyDate : fallback.surveyDate
  };

  for (const question of questions) {
    const storedAnswer = value[question.id];
    draft[question.id] = isAnswer(storedAnswer) ? storedAnswer : fallback[question.id];
  }

  if (draft.q16 !== "yes") {
    draft.contactName = undefined;
    draft.contactPhone = undefined;
  }

  return draft;
}

function responseToDraft(response: SurveyResponse): ResponseDraft {
  return {
    ageGroup: response.ageGroup,
    contactName: response.contactName,
    contactPhone: response.contactPhone,
    freeText: response.freeText,
    gender: response.gender,
    q4: response.q4,
    q5: response.q5,
    q6: response.q6,
    q7: response.q7,
    q8: response.q8,
    q9: response.q9,
    q10: response.q10,
    q11: response.q11,
    q11WarDetails: response.q11WarDetails,
    q12: response.q12,
    q13: response.q13,
    q14: response.q14,
    q15: response.q15,
    q16: response.q16,
    researchPeriodEnd: response.researchPeriodEnd,
    researchPeriodStart: response.researchPeriodStart,
    researchTerritory: response.researchTerritory,
    residence: response.residence,
    source: response.source,
    surveyDate: response.surveyDate
  };
}

function normalizeDraft(draft: ResponseDraft): ResponseDraft {
  return {
    ...draft,
    contactName: draft.q16 === "yes" ? cleanOptional(draft.contactName) : undefined,
    contactPhone: draft.q16 === "yes" ? cleanOptional(draft.contactPhone) : undefined,
    freeText: cleanOptional(draft.freeText),
    q11WarDetails: cleanOptional(draft.q11WarDetails) ?? "—",
    researchTerritory: cleanOptional(draft.researchTerritory)
  };
}

function createInitialFilters(): Filters {
  return {
    ageGroup: [],
    contactOnly: false,
    contactStatus: [],
    dateFrom: "",
    dateTo: "",
    gender: [],
    helpOnly: false,
    query: "",
    residence: [],
    source: "all"
  };
}

function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.ageGroup.length > 0 ||
    filters.contactOnly ||
    filters.contactStatus.length > 0 ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    filters.gender.length > 0 ||
    filters.helpOnly ||
    Boolean(filters.query.trim()) ||
    filters.residence.length > 0 ||
    filters.source !== "all"
  );
}

function matchesFilters(response: SurveyResponse, filters: Filters): boolean {
  if (!isDateInRange(response.surveyDate, filters.dateFrom, filters.dateTo)) {
    return false;
  }

  if (filters.source !== "all" && response.source !== filters.source) {
    return false;
  }

  if (filters.gender.length > 0 && !filters.gender.includes(response.gender)) {
    return false;
  }

  if (filters.ageGroup.length > 0 && !filters.ageGroup.includes(response.ageGroup)) {
    return false;
  }

  if (filters.residence.length > 0 && !filters.residence.includes(response.residence)) {
    return false;
  }

  if (filters.helpOnly && response.q16 !== "yes") {
    return false;
  }

  if (filters.contactOnly && !hasContact(response)) {
    return false;
  }

  if (
    filters.contactStatus.length > 0 &&
    (response.q16 !== "yes" || !filters.contactStatus.includes(response.contactStatus))
  ) {
    return false;
  }

  const query = filters.query.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [
    response.researchTerritory,
    response.freeText,
    response.contactName,
    response.contactPhone,
    response.q11WarDetails
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(query));
}

function buildSummary(responses: SurveyResponse[]) {
  return {
    contacts: responses.filter(hasContact).length,
    fake: responses.filter((response) => response.isFake).length,
    help: responses.filter((response) => response.q16 === "yes").length,
    online: responses.filter((response) => response.source === "online").length,
    paper: responses.filter((response) => response.source === "paper").length,
    genderBars: (Object.keys(genderLabels) as Gender[]).map((gender) => ({
      label: genderLabels[gender],
      value: responses.filter((response) => response.gender === gender).length
    })),
    ageBars: (Object.keys(ageLabels) as AgeGroup[]).map((ageGroup) => ({
      label: ageLabels[ageGroup],
      value: responses.filter((response) => response.ageGroup === ageGroup).length
    })),
    residenceBars: (Object.keys(residenceLabels) as Residence[]).map((residence) => ({
      label: residenceLabels[residence],
      value: responses.filter((response) => response.residence === residence).length
    })),
    sourceBars: (Object.keys(sourceLabels) as ResponseSource[]).map((source) => ({
      label: sourceLabels[source],
      value: responses.filter((response) => response.source === source).length
    })),
    questionBars: questions.map((question) => ({
      group: question.group,
      label: question.label,
      no: responses.filter((response) => response[question.id] === "no").length,
      number: question.number,
      unknown: responses.filter((response) => response[question.id] === "unknown").length,
      yes: responses.filter((response) => response[question.id] === "yes").length
    }))
  };
}

function hasContact(response: Pick<SurveyResponse, "contactName" | "contactPhone">): boolean {
  return Boolean(response.contactName?.trim() || response.contactPhone?.trim());
}

function countDraftAnswers(draft: AnswerFields): Record<Answer, number> {
  return questions.reduce<Record<Answer, number>>(
    (counts, question) => {
      counts[draft[question.id]] += 1;
      return counts;
    },
    { no: 0, unknown: 0, yes: 0 }
  );
}

function formatYesAnswers(response: SurveyResponse): string {
  const yesQuestions = questions
    .filter((question) => response[question.id] === "yes")
    .map((question) => `Q${question.number}`);

  return yesQuestions.length > 0 ? yesQuestions.join(", ") : "Нет ответов «Да».";
}

function downloadCsv(responses: SurveyResponse[]) {
  const headers = [
    "Дата",
    "Источник",
    "Пол",
    "Возраст",
    "Проживание",
    "Территория",
    "Период",
    "Свободный текст",
    "Нужна помощь",
    "Имя",
    "Телефон",
    "Статус обращения",
    "Заметка по обращению"
  ];
  const rows = responses.map((response) => [
    response.surveyDate,
    sourceLabels[response.source],
    genderLabels[response.gender],
    ageLabels[response.ageGroup],
    residenceLabels[response.residence],
    response.researchTerritory ?? "",
    formatResearchPeriod(response),
    response.freeText ?? "",
    answerLabels[response.q16],
    response.contactName ?? "",
    response.contactPhone ?? "",
    contactStatusLabels[response.contactStatus],
    response.contactNote ?? ""
  ]);
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\r\n")}\r\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "rodoved-test.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function routeFromPath(pathname: string): RouteId {
  if (pathname.startsWith("/entry")) {
    return "entry";
  }
  if (pathname.startsWith("/data")) {
    return "data";
  }
  if (pathname.startsWith("/pdf")) {
    return "pdf";
  }
  return "survey";
}

function routeToPath(route: RouteId): string {
  return route === "survey" ? "/" : `/${route}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalStoredNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalStoredString(value: unknown): string | undefined {
  return typeof value === "string" ? cleanOptional(value) : undefined;
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function clampSurveyStep(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return 0;
  }

  return Math.min(surveyStepCount - 1, Math.max(0, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAnswer(value: unknown): value is Answer {
  return value === "yes" || value === "no" || value === "unknown";
}

function isGender(value: unknown): value is Gender {
  return value === "male" || value === "female";
}

function isAgeGroup(value: unknown): value is AgeGroup {
  return value === "under_18" || value === "18_40" || value === "over_40";
}

function isResidence(value: unknown): value is Residence {
  return value === "snezhinsk" || value === "other";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isDateInRange(date: string, dateFrom: string, dateTo: string): boolean {
  return (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
}

function formatResearchPeriod(response: Pick<SurveyResponse, "researchPeriodEnd" | "researchPeriodStart">) {
  if (response.researchPeriodStart && response.researchPeriodEnd) {
    return `${response.researchPeriodStart}-${response.researchPeriodEnd}`;
  }

  return String(response.researchPeriodStart ?? response.researchPeriodEnd ?? "");
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} КБ`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

function escapeCsv(value: string): string {
  const normalized = value.replace(/\r?\n/g, " ");
  return /[;"\n\r]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}
