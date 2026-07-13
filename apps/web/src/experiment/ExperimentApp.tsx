import {
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  Download,
  Ellipsis,
  FileText,
  LockKeyhole,
  PenLine,
  Phone,
  Plus,
  Save,
  Trash2,
  Upload,
  X
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode
} from "react";
import {
  exportLabResponsesCsv,
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
import {
  advanceEntryBatch,
  changeEntryBatchDate,
  parseEntryBatchState,
  type EntryBatchState
} from "./entryBatch";
import {
  createPaperEntryDraftState,
  parsePaperEntryDraftState,
  type PaperEntryDraftState
} from "./entryDraft";
import { shouldAutoAdvanceEntryQuestion } from "./entryFlow";
import {
  hasMissingRequiredResponseContacts,
  requiresResponseContacts,
  shouldShowResponseSearchFields
} from "./responseEditor";
import {
  advanceVisibleCount,
  dataPageSize,
  readDataMode,
  setDataModeSearchParam,
  type DataMode
} from "./dataWorkspace";
import {
  areBasicSelectionsComplete,
  clearSurveyHelpDetails,
  coerceBasicSelections,
  coerceSurveyDraftStep,
  createEmptyBasicSelections,
  getSurveyContactValidationIssue,
  hasAnyBasicSelection,
  isSurveyDraftFresh,
  markBasicSelection,
  redactSurveyDraftContacts,
  resolveSurveyDraftStep,
  shouldAutoAdvanceSurveyQuestion,
  surveyFlowVersion,
  surveyHelpStep,
  surveyReviewStep,
  surveyStepCount,
  type SurveyBasicField,
  type SurveyBasicSelections,
  type SurveyContactValidationIssue
} from "./surveyDraft";
import { buildPdfArchiveName, getPdfSelectionIssue } from "./pdfArchive";
import type { SurveyFilters } from "@snz-rodoved/shared";
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
type ContactQueueStatus = ContactStatus | "all";
type ContactPlanFilter = "all" | "due" | "today" | "future" | "missing";
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
  consentToDataProcessing?: boolean;
  consentToEvents?: boolean;
  contactStatus: ContactStatus;
  contactNote?: string;
  contactNextDate?: string;
  isFake: boolean;
  createdAt: string;
  updatedAt: string;
}

type ResponseDraft = Omit<
  SurveyResponse,
  "contactNote" | "contactStatus" | "createdAt" | "id" | "isFake" | "updatedAt"
>;

const responseDraftKeys: Array<keyof ResponseDraft> = [
  "source",
  "surveyDate",
  "gender",
  "ageGroup",
  "residence",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q11WarDetails",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
  "researchTerritory",
  "researchPeriodStart",
  "researchPeriodEnd",
  "freeText",
  "contactName",
  "contactPhone",
  "consentToDataProcessing",
  "consentToEvents"
];

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
  contactNextFrom: string;
  contactNextMissing: boolean;
  contactNextTo: string;
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

interface FilterChip {
  key: string;
  label: string;
}

interface SurveyDraftState {
  basicSelections: SurveyBasicSelections;
  draft: ResponseDraft;
  restored: boolean;
  step: number;
}

interface FilterPreset {
  createdAt: string;
  filters: Filters;
  id: string;
  name: string;
}

interface PdfCoverage {
  coveredDates: string[];
  missingPdfDates: string[];
  paperDates: string[];
  pdfDates: string[];
  pdfWithoutPaperDates: string[];
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
const routeIcons: Record<RouteId, typeof Database> = {
  survey: ClipboardList,
  entry: PenLine,
  data: Database,
  pdf: FileText
};
const workspaceRoutes: RouteId[] = ["entry", "data", "pdf"];
const surveyDraftStorageKey = "rodoved-test-online-draft-v1";
const entryBatchStorageKey = "rodoved-test-entry-batch-v1";
const entryDraftStorageKey = "rodoved-test-paper-draft-v1";
const dataFilterPresetsStorageKey = "rodoved-test-data-filter-presets-v1";
const dataFilterPanelStorageKey = "rodoved-test-data-filter-panel-open-v2";
const contactPrivacyStorageKey = "rodoved-test-hide-contacts-v1";
const researchYearMin = 1500;
const researchYearMax = 2100;
const periodPresets = [
  { label: "1700-е", start: 1700, end: 1799 },
  { label: "1800-е", start: 1800, end: 1899 },
  { label: "1900-е", start: 1900, end: 1999 },
  { label: "1941-1945", start: 1941, end: 1945 }
];

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
    input: { contactNextDate?: string; contactNote?: string; contactStatus: ContactStatus }
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

  if (route === "survey") {
    return (
      <main className="survey-shell">
        <header className="survey-wordmark">Родовед</header>
        <SurveyPage onSave={(draft) => saveDraft(draft)} />
      </main>
    );
  }

  return (
    <main className="lab-shell workspace-shell">
      <header className="lab-topbar">
        <div className="workspace-brand">
          {workspaceReady ? (
            <button className="brand-mark" type="button" onClick={() => navigate("entry")}>
              Родовед
            </button>
          ) : (
            <span className="brand-mark">Родовед</span>
          )}
          <span>Рабочая зона</span>
        </div>
        {workspaceReady ? (
          <nav aria-label="Рабочие разделы" className="workspace-nav">
            {workspaceRoutes.map((item) => {
              const Icon = routeIcons[item];

              return (
                <button
                  aria-current={route === item ? "page" : undefined}
                  className={route === item ? "is-active" : ""}
                  key={item}
                  type="button"
                  onClick={() => navigate(item)}
                >
                  <Icon aria-hidden size={18} />
                  <span>{routeTitles[item]}</span>
                </button>
              );
            })}
          </nav>
        ) : null}
      </header>

      {!workspaceReady ? (
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
          onOpenPdfArchive={() => navigate("pdf")}
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
  const [basicSelections, setBasicSelections] = useState(restoredDraft.basicSelections);
  const [basicValidationAttempted, setBasicValidationAttempted] = useState(false);
  const [status, setStatus] = useState(restoredDraft.restored ? "Черновик восстановлен." : "");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const surveyHeadingRef = useRef<HTMLHeadingElement>(null);
  const basicsComplete = areBasicSelectionsComplete(basicSelections);
  const currentQuestion = getSurveyQuestionForStep(step);
  const isReviewStep = step === surveyReviewStep;
  const stepTitle = getSurveyStepTitle(currentQuestion, isReviewStep);
  const progressLabel = getSurveyProgressLabel(currentQuestion, isReviewStep);
  const progressPercent = getSurveyProgressPercent(currentQuestion, isReviewStep);

  useEffect(() => {
    if (hasSurveyDraftContent(draft) || hasAnyBasicSelection(basicSelections) || step > 0) {
      writeSurveyDraftState({ basicSelections, draft, step });
      return;
    }

    clearSurveyDraftState();
  }, [basicSelections, draft, step]);

  useEffect(() => {
    surveyHeadingRef.current?.focus({ preventScroll: false });
  }, [step]);

  function handleBasicSelection(field: SurveyBasicField) {
    setBasicSelections((current) => markBasicSelection(current, field));
    setStatus("");
  }

  function focusFirstMissingBasic() {
    const firstMissing = (["gender", "ageGroup", "residence"] as SurveyBasicField[]).find(
      (field) => !basicSelections[field]
    );

    if (!firstMissing) {
      return;
    }

    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-basic-field="${firstMissing}"] button`)
        ?.focus({ preventScroll: false });
    });
  }

  function focusContactIssue(issue: SurveyContactValidationIssue) {
    window.requestAnimationFrame(() => {
      const autocomplete = issue === "name" ? "name" : "tel";
      document
        .querySelector<HTMLInputElement>(`.contact-grid input[autocomplete="${autocomplete}"]`)
        ?.focus({ preventScroll: false });
    });
  }

  function validateHelpContacts(): boolean {
    const issue = getSurveyContactValidationIssue(draft);
    if (!issue) {
      return true;
    }

    setStatus(
      issue === "name"
        ? "Укажите имя."
        : issue === "phone_missing"
          ? "Укажите номер телефона."
          : "Проверьте номер телефона: нужно от 10 до 15 цифр."
    );
    focusContactIssue(issue);
    return false;
  }

  function navigateSurveyStep(nextStep: number) {
    if (nextStep > 0 && !basicsComplete) {
      setBasicValidationAttempted(true);
      setStatus("Выберите пол, возраст и место проживания.");
      setStep(0);
      focusFirstMissingBasic();
      return;
    }

    if (nextStep > step && step === surveyHelpStep && !validateHelpContacts()) {
      return;
    }

    setStatus("");
    setStep(Math.min(surveyStepCount - 1, Math.max(0, nextStep)));
  }

  function handleSurveyAnswer(questionId: QuestionId, answer: Answer) {
    setStatus("");
    if (
      currentQuestion?.id !== questionId ||
      !shouldAutoAdvanceSurveyQuestion(questionId, answer)
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      setStep(Math.min(surveyStepCount - 1, step + 1));
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (step !== surveyReviewStep) {
      navigateSurveyStep(step + 1);
      return;
    }

    if (!basicsComplete) {
      navigateSurveyStep(1);
      return;
    }

    if (!validateHelpContacts()) {
      setStep(surveyHelpStep);
      return;
    }

    if (draft.consentToDataProcessing !== true) {
      setStatus("Подтвердите согласие на обработку ответов.");
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>('input[name="consentToDataProcessing"]')
          ?.focus({ preventScroll: false });
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(draft);
      clearSurveyDraftState();
      setDraft(createEmptyDraft("online"));
      setBasicSelections(createEmptyBasicSelections());
      setBasicValidationAttempted(false);
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
    setBasicSelections(createEmptyBasicSelections());
    setBasicValidationAttempted(false);
    setStep(0);
    setStatus("");
    setSubmitted(false);
  }

  function confirmSurveyReset() {
    if (window.confirm("Очистить все ответы анкеты?")) {
      resetSurvey();
    }
  }

  if (submitted) {
    return (
      <section className="survey-page">
        <SurveySuccess onNewSurvey={resetSurvey} />
      </section>
    );
  }

  function renderCurrentStep() {
    if (step === 0) {
      return (
        <BasicFields
          draft={draft}
          selectedBasics={basicSelections}
          showDate={false}
          showMissing={basicValidationAttempted}
          onChange={setDraft}
          onSelection={handleBasicSelection}
        />
      );
    }

    if (currentQuestion) {
      return (
        <div className="survey-question-stage">
          <QuestionStack
            draft={draft}
            requireContactDetails={currentQuestion.id === "q16"}
            showOnlineHelpFields={currentQuestion.id === "q16"}
            showUnknownOption={false}
            questionsToShow={[currentQuestion]}
            onAnswer={handleSurveyAnswer}
            onChange={setDraft}
          />
        </div>
      );
    }

    return (
      <SurveyReview
        draft={draft}
        onEdit={navigateSurveyStep}
        onChange={(nextDraft) => {
          setStatus("");
          setDraft(nextDraft);
        }}
      />
    );
  }

  return (
    <section className="survey-page">
      <header className="survey-heading">
        <div>
          <p className="eyebrow">Онлайн-опрос</p>
          <h1 ref={surveyHeadingRef} tabIndex={-1}>{stepTitle}</h1>
        </div>
        <div className="survey-progress-block">
          <div className="survey-progress-meta">
            <span aria-live="polite">{progressLabel}</span>
            {hasSurveyDraftContent(draft) || hasAnyBasicSelection(basicSelections) ? (
              <button className="link-button" type="button" onClick={confirmSurveyReset}>
                Очистить ответы
              </button>
            ) : null}
          </div>
          <div className="survey-progress" aria-hidden>
            <i style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      <form className="survey-panel" onSubmit={handleSubmit}>
        {renderCurrentStep()}

        <footer className="survey-footer">
          {status ? <p className="form-status">{status}</p> : null}
          <div className="survey-footer-actions">
            {step > 0 ? (
              <button className="ghost-button" type="button" onClick={() => navigateSurveyStep(step - 1)}>
                Назад
              </button>
            ) : null}
            {!isReviewStep ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => navigateSurveyStep(step + 1)}
              >
                {getSurveyForwardLabel(currentQuestion, draft)}
              </button>
            ) : (
              <button className="primary-button" disabled={saving} type="submit">
                <Save aria-hidden size={18} />
                {saving ? "Отправка..." : "Отправить"}
              </button>
            )}
          </div>
        </footer>
      </form>
    </section>
  );
}

function getSurveyQuestionForStep(step: number): (typeof questions)[number] | null {
  return step >= 1 && step <= questions.length ? questions[step - 1] : null;
}

function getSurveyQuestionStep(questionId: QuestionId): number {
  const index = questions.findIndex((question) => question.id === questionId);
  return index < 0 ? 0 : index + 1;
}

function getSurveyStepTitle(
  question: (typeof questions)[number] | null,
  isReviewStep: boolean
): string {
  if (isReviewStep) {
    return "Проверка";
  }
  if (!question) {
    return "О себе";
  }
  if (question.group === "experience") {
    return "О семье";
  }
  if (question.group === "interest") {
    return "Что вас интересует";
  }
  return "Помощь";
}

function getSurveyProgressLabel(
  question: (typeof questions)[number] | null,
  isReviewStep: boolean
): string {
  if (isReviewStep) {
    return "Проверка ответов";
  }

  return question ? `Вопрос ${question.number} из 16` : "Вопросы 1-3 из 16";
}

function getSurveyProgressPercent(
  question: (typeof questions)[number] | null,
  isReviewStep: boolean
): number {
  if (isReviewStep) {
    return 100;
  }

  return ((question?.number ?? 3) / 16) * 100;
}

function getSurveyForwardLabel(
  question: (typeof questions)[number] | null,
  draft: ResponseDraft
): string {
  if (!question) {
    return "Далее";
  }
  if (draft[question.id] === "unknown") {
    return "Пропустить";
  }
  if (question.id === "q16") {
    return "Проверить ответы";
  }
  return "Далее";
}

function SurveyReview({
  draft,
  onChange,
  onEdit
}: {
  draft: ResponseDraft;
  onChange: (draft: ResponseDraft) => void;
  onEdit: (step: number) => void;
}) {
  const experienceQuestions = questions.filter((question) => question.group === "experience");
  const interestQuestions = questions.filter((question) => question.group === "interest");

  return (
    <div className="survey-review">
      <ReviewDisclosure
        summary={`${genderLabels[draft.gender]} · ${ageLabels[draft.ageGroup]} · ${residenceLabels[draft.residence]}`}
        title="О себе"
      >
        <div className="review-edit-row">
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
      </ReviewDisclosure>

      <ReviewDisclosure summary={getQuestionGroupSummary(draft, experienceQuestions)} title="Опыт">
        <div className="review-edit-row">
          <button className="link-button" type="button" onClick={() => onEdit(getSurveyQuestionStep("q4"))}>
            Изменить
          </button>
        </div>
        <ReviewQuestionList draft={draft} questionsToShow={experienceQuestions} />
      </ReviewDisclosure>

      <ReviewDisclosure summary={getQuestionGroupSummary(draft, interestQuestions)} title="Интересы">
        <div className="review-edit-row">
          <button className="link-button" type="button" onClick={() => onEdit(getSurveyQuestionStep("q7"))}>
            Изменить
          </button>
        </div>
        <ReviewQuestionList draft={draft} questionsToShow={interestQuestions} />
      </ReviewDisclosure>

      <ReviewDisclosure summary={getHelpReviewSummary(draft)} title="Помощь">
        <div className="review-edit-row">
          <button className="link-button" type="button" onClick={() => onEdit(getSurveyQuestionStep("q16"))}>
            Изменить
          </button>
        </div>
        <dl className="review-list">
          <div>
            <dt>Нужна помощь</dt>
            <dd>{answerLabels[draft.q16]}</dd>
          </div>
          {draft.q16 === "yes" ? (
            <>
              <div>
                <dt>Имя</dt>
                <dd>{draft.contactName || "—"}</dd>
              </div>
              <div>
                <dt>Телефон</dt>
                <dd>{draft.contactPhone || "—"}</dd>
              </div>
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
            </>
          ) : null}
        </dl>
      </ReviewDisclosure>

      <section className="survey-consent" aria-labelledby="survey-consent-title">
        <h2 id="survey-consent-title">Согласие</h2>
        <label className="consent-check">
          <input
            aria-required="true"
            checked={draft.consentToDataProcessing === true}
            name="consentToDataProcessing"
            type="checkbox"
            onChange={(event) =>
              onChange({ ...draft, consentToDataProcessing: event.currentTarget.checked })
            }
          />
          <span>Я согласен(-на) на обработку моих ответов.</span>
        </label>
        {draft.q16 === "yes" ? (
          <label className="consent-check">
            <input
              checked={draft.consentToEvents === true}
              name="consentToEvents"
              type="checkbox"
              onChange={(event) => onChange({ ...draft, consentToEvents: event.currentTarget.checked })}
            />
            <span>Я согласен(-на) получать приглашения на мероприятия проекта.</span>
          </label>
        ) : null}
      </section>
    </div>
  );
}

function ReviewDisclosure({
  children,
  summary,
  title
}: {
  children: ReactNode;
  summary: string;
  title: string;
}) {
  return (
    <details className="review-block">
      <summary className="review-block-summary">
        <span>{title}</span>
        <small>{summary}</small>
        <ChevronDown aria-hidden size={20} />
      </summary>
      <div className="review-block-content">{children}</div>
    </details>
  );
}

function getQuestionGroupSummary(draft: ResponseDraft, questionsToShow: typeof questions): string {
  const counts = { no: 0, unknown: 0, yes: 0 };
  for (const question of questionsToShow) {
    counts[draft[question.id]] += 1;
  }

  return `Да ${counts.yes} · Нет ${counts.no} · Без ответа ${counts.unknown}`;
}

function getHelpReviewSummary(draft: ResponseDraft): string {
  if (draft.q16 !== "yes") {
    return answerLabels[draft.q16];
  }

  return draft.contactName ? `Да · ${draft.contactName}` : "Да";
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
    <section className="survey-success">
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
  const [initialEntryState] = useState(() => readInitialPaperEntryState());
  const initialStoredDraft = editingResponse ? null : initialEntryState.storedDraft;
  const [batchState, setBatchState] = useState<EntryBatchState>(initialEntryState.batchState);
  const batchStateRef = useRef(batchState);
  const [draft, setDraft] = useState<ResponseDraft>(() =>
    editingResponse
      ? responseToDraft(editingResponse)
      : initialStoredDraft?.draft ?? createPaperDraftForDate(initialEntryState.batchState.surveyDate)
  );
  const [status, setStatus] = useState(() =>
    initialStoredDraft ? getPaperDraftRestoredStatus(initialStoredDraft) : ""
  );
  const [saving, setSaving] = useState(false);
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<QuestionId | null>(null);
  const [unknownJumpIndex, setUnknownJumpIndex] = useState(0);
  const [mobileEntryStep, setMobileEntryStep] = useState(initialStoredDraft?.mobileEntryStep ?? 0);
  const initialEditingEffectRef = useRef(true);
  const isMobileEntry = useMediaQuery("(max-width: 720px)");
  const unknownQuestions = questions.filter((question) => draft[question.id] === "unknown");
  const experienceQuestions = questions.filter((question) => question.group === "experience");
  const interestQuestions = questions.filter((question) => question.group === "interest");
  const helpQuestions = questions.filter((question) => question.group === "help");
  const mobileEntryStepCount = questions.length + 1;
  const activeMobileQuestion = mobileEntryStep > 0 ? questions[mobileEntryStep - 1] : null;
  const mobileEntrySectionLabel = activeMobileQuestion
    ? activeMobileQuestion.group === "experience"
      ? "Опыт"
      : activeMobileQuestion.group === "interest"
        ? "Интересы"
        : "Помощь"
    : "Данные анкеты";
  const showEditingSearchFields = Boolean(
    editingResponse && shouldShowResponseSearchFields(editingResponse.source, draft)
  );
  const requireEditingContacts = editingResponse ? requiresResponseContacts(editingResponse.source) : false;

  useEffect(() => {
    batchStateRef.current = batchState;
    writeEntryBatchState(batchState);
  }, [batchState]);

  useEffect(() => {
    if (initialEditingEffectRef.current) {
      initialEditingEffectRef.current = false;
      return;
    }

    const storedDraft = editingResponse ? null : readPaperEntryDraftState();
    setDraft(
      editingResponse
        ? responseToDraft(editingResponse)
        : storedDraft?.draft ?? createPaperDraftForDate(batchStateRef.current.surveyDate)
    );
    setStatus(storedDraft ? getPaperDraftRestoredStatus(storedDraft) : "");
    setHighlightedQuestionId(null);
    setUnknownJumpIndex(0);
    setMobileEntryStep(storedDraft?.mobileEntryStep ?? 0);
  }, [editingResponse]);

  useEffect(() => {
    if (editingResponse) {
      return;
    }

    if (isPaperDraftTouched(draft)) {
      writePaperEntryDraftState(draft, mobileEntryStep);
      return;
    }

    clearPaperEntryDraftState();
  }, [draft, editingResponse, mobileEntryStep]);

  useEffect(() => {
    if (!highlightedQuestionId) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setHighlightedQuestionId(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [highlightedQuestionId]);

  function jumpToEntrySection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function moveMobileEntry(nextStep: number) {
    setMobileEntryStep(Math.min(mobileEntryStepCount - 1, Math.max(0, nextStep)));
    window.requestAnimationFrame(() => {
      document
        .getElementById("mobile-entry-stage")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleMobileQuestionChange(nextDraft: ResponseDraft) {
    setDraft(nextDraft);
    if (!activeMobileQuestion) {
      return;
    }

    const answer = nextDraft[activeMobileQuestion.id];
    if (
      shouldAutoAdvanceEntryQuestion(
        activeMobileQuestion.id,
        answer,
        mobileEntryStep >= mobileEntryStepCount - 1
      )
    ) {
      moveMobileEntry(mobileEntryStep + 1);
    }
  }

  function jumpToNextUnknown() {
    if (unknownQuestions.length === 0) {
      setStatus("Ответов «Нет ответа» сейчас нет.");
      return;
    }

    const nextQuestion = unknownQuestions[unknownJumpIndex % unknownQuestions.length];
    setHighlightedQuestionId(nextQuestion.id);
    setUnknownJumpIndex((current) => (current + 1) % unknownQuestions.length);
    if (isMobileEntry) {
      moveMobileEntry(questions.findIndex((question) => question.id === nextQuestion.id) + 1);
      return;
    }
    document
      .getElementById(`entry-question-${nextQuestion.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function jumpToEntryStart() {
    setMobileEntryStep(0);
    window.requestAnimationFrame(() => {
      document.getElementById("entry-batch")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document
        .querySelector<HTMLButtonElement>(
          isMobileEntry
            ? "#mobile-entry-stage .segmented button"
            : "#entry-basic .segmented button"
        )
        ?.focus({ preventScroll: true });
    });
  }

  function handleBatchDateChange(surveyDate: string) {
    if (!surveyDate || surveyDate === batchState.surveyDate) {
      return;
    }

    if (
      batchState.count > 0 &&
      !window.confirm("Начать новую серию за выбранную дату? Счётчик текущей серии будет сброшен.")
    ) {
      return;
    }

    const nextBatchState = changeEntryBatchDate(batchState, surveyDate);
    batchStateRef.current = nextBatchState;
    setBatchState(nextBatchState);
    setDraft((current) => ({ ...current, surveyDate }));
    setStatus("");
  }

  function finishBatch() {
    if (isPaperDraftTouched(draft) && !window.confirm("Очистить несохранённые ответы и завершить серию?")) {
      return;
    }

    const nextBatchState = { count: 0, surveyDate: todayString() };
    clearPaperEntryDraftState();
    batchStateRef.current = nextBatchState;
    setBatchState(nextBatchState);
    setDraft(createPaperDraftForDate(nextBatchState.surveyDate));
    setMobileEntryStep(0);
    setStatus("Серия завершена.");
    jumpToEntryStart();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(draft, editingResponse?.id);

      if (editingResponse) {
        setDraft(createPaperDraftForDate(batchStateRef.current.surveyDate));
        setMobileEntryStep(0);
        setStatus("Изменения сохранены.");
        return;
      }

      clearPaperEntryDraftState();
      const nextBatchState = advanceEntryBatch(
        changeEntryBatchDate(batchStateRef.current, draft.surveyDate)
      );
      batchStateRef.current = nextBatchState;
      setBatchState(nextBatchState);
      setDraft(createPaperDraftForDate(nextBatchState.surveyDate));
      setMobileEntryStep(0);
      setStatus(`Анкета добавлена. В серии: ${nextBatchState.count}.`);
      jumpToEntryStart();
    } catch {
      setStatus("Не удалось сохранить анкету.");
    } finally {
      setSaving(false);
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
        {!editingResponse ? (
          <section className="entry-batch" id="entry-batch" aria-label="Текущая серия бумажных анкет">
            <div className="entry-batch-title">
              <CalendarDays aria-hidden size={22} />
              <div>
                <span>Текущая серия</span>
                <strong>Бумажные анкеты</strong>
              </div>
            </div>
            <label className="entry-batch-date">
              Дата опроса
              <input
                required
                type="date"
                value={draft.surveyDate}
                onInput={(event) => handleBatchDateChange(event.currentTarget.value)}
              />
            </label>
            <div className="entry-batch-count" aria-label={`Добавлено в серии: ${batchState.count}`}>
              <span>Добавлено</span>
              <strong>{batchState.count}</strong>
            </div>
            <button
              aria-label="Завершить серию"
              className="ghost-button entry-batch-end"
              title="Завершить серию"
              type="button"
              onClick={finishBatch}
            >
              <CheckCircle aria-hidden size={17} />
              <span>Завершить</span>
            </button>
            {status ? <p className="form-status entry-batch-status" role="status">{status}</p> : null}
          </section>
        ) : null}

        {isMobileEntry ? (
          <div className="mobile-entry-flow">
            <div
              aria-label={`Шаг ${mobileEntryStep + 1} из ${mobileEntryStepCount}`}
              className="mobile-entry-progress"
            >
              <div>
                <span>{activeMobileQuestion ? `Вопрос ${activeMobileQuestion.number}` : "Вопросы 1-3"}</span>
                <strong>{mobileEntrySectionLabel}</strong>
              </div>
              <b>{mobileEntryStep + 1} / {mobileEntryStepCount}</b>
              <i aria-hidden>
                <span style={{ width: `${((mobileEntryStep + 1) / mobileEntryStepCount) * 100}%` }} />
              </i>
            </div>

            <section className="mobile-entry-stage" id="mobile-entry-stage">
              {activeMobileQuestion ? (
                <QuestionStack
                  draft={draft}
                  highlightedQuestionId={highlightedQuestionId}
                  idPrefix="mobile-entry"
                  requireContactDetails={requireEditingContacts}
                  showConsentChoices={draft.source === "paper"}
                  showOnlineHelpFields={showEditingSearchFields}
                  questionsToShow={[activeMobileQuestion]}
                  onChange={handleMobileQuestionChange}
                />
              ) : (
                <BasicFields
                  draft={draft}
                  showDate={Boolean(editingResponse)}
                  onChange={setDraft}
                />
              )}
            </section>

            {mobileEntryStep === mobileEntryStepCount - 1 && unknownQuestions.length > 0 ? (
              <div className="mobile-entry-missing">
                <span>Нет ответа: {unknownQuestions.length}</span>
                <button className="ghost-button" type="button" onClick={jumpToNextUnknown}>Проверить</button>
              </div>
            ) : null}

            {editingResponse && status ? (
              <p className="form-status mobile-entry-status" role="status">{status}</p>
            ) : null}

            <div className={mobileEntryStep === 0 ? "mobile-entry-actions is-first" : "mobile-entry-actions"}>
              {mobileEntryStep > 0 ? (
                <button className="ghost-button" type="button" onClick={() => moveMobileEntry(mobileEntryStep - 1)}>
                  <ChevronLeft aria-hidden size={19} />
                  Назад
                </button>
              ) : null}
              {mobileEntryStep < mobileEntryStepCount - 1 ? (
                <button className="primary-button" type="button" onClick={() => moveMobileEntry(mobileEntryStep + 1)}>
                  Далее
                  <ChevronRight aria-hidden size={19} />
                </button>
              ) : (
                <button className="primary-button" disabled={saving} type="submit">
                  {editingResponse ? <Save aria-hidden size={18} /> : <Plus aria-hidden size={18} />}
                  {saving ? "Сохраняем..." : editingResponse ? "Сохранить" : "Добавить анкету"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="entry-toolbar" aria-label="Навигация по анкете">
              <div className="entry-progress" aria-label={`Заполнено ${questions.length - unknownQuestions.length} из ${questions.length}`}>
                <div>
                  <strong>Заполнено {questions.length - unknownQuestions.length} из {questions.length}</strong>
                  <span>{unknownQuestions.length > 0 ? `Осталось: ${unknownQuestions.length}` : "Все ответы отмечены"}</span>
                </div>
                <i aria-hidden>
                  <b style={{ width: `${((questions.length - unknownQuestions.length) / questions.length) * 100}%` }} />
                </i>
              </div>
              <div className="entry-jump-row">
                <button
                  className="entry-next-unknown"
                  disabled={unknownQuestions.length === 0}
                  type="button"
                  onClick={jumpToNextUnknown}
                >
                  Найти пропуск
                </button>
                <label className="entry-section-select">
                  <span>Раздел</span>
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      if (event.currentTarget.value) {
                        jumpToEntrySection(event.currentTarget.value);
                        event.currentTarget.value = "";
                      }
                    }}
                  >
                    <option disabled value="">Перейти к...</option>
                    <option value="entry-basic">1-3 · Данные</option>
                    <option value="entry-experience">4-6 · Опыт</option>
                    <option value="entry-interest">7-15 · Интересы</option>
                    <option value="entry-help">16 · Помощь</option>
                  </select>
                </label>
              </div>
            </div>

            <section className="entry-section" id="entry-basic">
              <div className="entry-section-title">
                <span>1-3</span>
                <h2>Данные анкеты</h2>
              </div>
              <BasicFields draft={draft} showDate={Boolean(editingResponse)} onChange={setDraft} />
            </section>

            <section className="entry-section" id="entry-experience">
              <div className="entry-section-title">
                <span>4-6</span>
                <h2>Опыт</h2>
              </div>
              <QuestionStack
                draft={draft}
                highlightedQuestionId={highlightedQuestionId}
                idPrefix="entry"
                questionsToShow={experienceQuestions}
                onChange={setDraft}
              />
            </section>

            <section className="entry-section" id="entry-interest">
              <div className="entry-section-title">
                <span>7-15</span>
                <h2>Интересы</h2>
              </div>
              <QuestionStack
                draft={draft}
                highlightedQuestionId={highlightedQuestionId}
                idPrefix="entry"
                questionsToShow={interestQuestions}
                onChange={setDraft}
              />
            </section>

            <section className="entry-section" id="entry-help">
              <div className="entry-section-title">
                <span>16</span>
                <h2>Помощь</h2>
              </div>
              <QuestionStack
                draft={draft}
                highlightedQuestionId={highlightedQuestionId}
                idPrefix="entry"
                requireContactDetails={requireEditingContacts}
                showConsentChoices={draft.source === "paper"}
                showOnlineHelpFields={showEditingSearchFields}
                questionsToShow={helpQuestions}
                onChange={setDraft}
              />
            </section>

            <div className="form-actions sticky-actions">
              {editingResponse && status ? <p className="form-status" role="status">{status}</p> : null}
              <button className="primary-button wide-button" disabled={saving} type="submit">
                {editingResponse ? <Save aria-hidden size={18} /> : <Plus aria-hidden size={18} />}
                {saving ? "Сохраняем..." : editingResponse ? "Сохранить изменения" : "Добавить и продолжить"}
              </button>
            </div>
          </>
        )}
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
  onOpenPdfArchive,
  onSaveContact,
  onSave
}: {
  pdfFiles: PdfRecord[];
  onCreateFake: () => Promise<void>;
  responses: SurveyResponse[];
  onDelete: (id: string) => Promise<void>;
  onDeleteFake: () => Promise<number>;
  onEdit: (id: string) => void;
  onOpenPdfArchive: () => void;
  onSaveContact: (
    id: string,
    input: { contactNextDate?: string; contactNote?: string; contactStatus: ContactStatus }
  ) => Promise<void>;
  onSave: (draft: ResponseDraft, id?: string) => Promise<void>;
}) {
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch(window.location.search));
  const [dataStatus, setDataStatus] = useState("");
  const [busyAction, setBusyAction] = useState<"csv" | "fake-add" | "fake-delete" | "row-delete" | "row-save" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [detailDraft, setDetailDraft] = useState<ResponseDraft | null>(null);
  const [questionGroupFilter, setQuestionGroupFilter] = useState<QuestionGroupFilter>("all");
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(() => readDataFilterPresets());
  const [filtersOpen, setFiltersOpen] = useState(() => readDataFilterPanelOpen());
  const [presetName, setPresetName] = useState("");
  const [dataMode, setDataMode] = useState<DataMode>(() => readDataMode(window.location.search));
  const [visibleHelpCount, setVisibleHelpCount] = useState(dataPageSize);
  const [visibleRowCount, setVisibleRowCount] = useState(dataPageSize);
  const [hideContacts, setHideContacts] = useState(() => readContactPrivacyMode());
  const isMobileData = useMediaQuery("(max-width: 720px)");
  const mobileDetailRef = useRef<HTMLDivElement>(null);
  const filteredResponses = useMemo(
    () => responses.filter((response) => matchesFilters(response, filters)),
    [responses, filters]
  );
  const matchingPdfs = useMemo(
    () => pdfFiles.filter((file) => isDateInRange(file.surveyDate, filters.dateFrom, filters.dateTo)),
    [pdfFiles, filters.dateFrom, filters.dateTo]
  );
  const pdfCoverage = useMemo(
    () => buildPdfCoverage(filteredResponses, matchingPdfs),
    [filteredResponses, matchingPdfs]
  );
  const helpRequests = useMemo(
    () => filteredResponses.filter((response) => response.q16 === "yes"),
    [filteredResponses]
  );
  const contactQueueBase = useMemo(
    () =>
      responses.filter(
        (response) =>
          response.q16 === "yes" &&
          matchesFilters(response, {
            ...filters,
            contactStatus: [],
            helpOnly: false
          })
      ),
    [filters, responses]
  );
  const contactPlanBase = useMemo(
    () =>
      responses.filter(
        (response) =>
          response.q16 === "yes" &&
          matchesFilters(response, {
            ...filters,
            contactNextFrom: "",
            contactNextMissing: false,
            contactNextTo: "",
            helpOnly: false
          })
      ),
    [filters, responses]
  );
  const contactQueueCounts = useMemo(() => buildContactQueueCounts(contactQueueBase), [contactQueueBase]);
  const contactPlanCounts = useMemo(() => buildContactPlanCounts(contactPlanBase), [contactPlanBase]);
  const activeContactPlan = getContactPlanFilter(filters);
  const sortedHelpRequests = useMemo(() => [...helpRequests].sort(compareContactQueue), [helpRequests]);
  const selectedHelpIndex = sortedHelpRequests.findIndex((response) => response.id === selectedId);
  const selectedRowIndex = filteredResponses.findIndex((response) => response.id === selectedId);
  const effectiveHelpCount = Math.max(visibleHelpCount, selectedHelpIndex + 1);
  const effectiveRowCount = Math.max(visibleRowCount, selectedRowIndex + 1);
  const visibleHelpRequests = sortedHelpRequests.slice(0, effectiveHelpCount);
  const visibleResponses = filteredResponses.slice(0, effectiveRowCount);
  const summary = buildSummary(filteredResponses);
  const selectedResponse = filteredResponses.find((response) => response.id === selectedId) ?? null;
  const selectedDraftDirty = Boolean(
    selectedResponse && detailDraft && !areResponseDraftsEqual(detailDraft, responseToDraft(selectedResponse))
  );
  const filtersActive = hasActiveFilters(filters);
  const activeFilterChips = useMemo(() => buildFilterChips(filters), [filters]);
  const dataModeItems: Array<{ count: number; icon: typeof Database; id: DataMode; label: string }> = [
    { count: helpRequests.length, icon: Phone, id: "contacts", label: "Обращения" },
    { count: filteredResponses.length, icon: Database, id: "rows", label: "Анкеты" },
    { count: matchingPdfs.length, icon: FileText, id: "pdf", label: "PDF" },
    { count: filteredResponses.length, icon: BarChart3, id: "charts", label: "Графики" }
  ];

  useEffect(() => {
    function handlePopState() {
      setFilters(filtersFromSearch(window.location.search));
      setDataMode(readDataMode(window.location.search));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const nextSearch = filtersToSearch(filters, dataMode);
    if (window.location.pathname === "/data" && window.location.search !== nextSearch) {
      window.history.replaceState(null, "", `${routeToPath("data")}${nextSearch}`);
    }
  }, [dataMode, filters]);

  useEffect(() => {
    setVisibleHelpCount(dataPageSize);
    setVisibleRowCount(dataPageSize);
  }, [filters]);

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

  useEffect(() => {
    writeContactPrivacyMode(hideContacts);
  }, [hideContacts]);

  useEffect(() => {
    writeDataFilterPanelOpen(filtersOpen);
  }, [filtersOpen]);

  useEffect(() => {
    if (!isMobileData || !selectedResponse) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    mobileDetailRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileData, selectedResponse]);

  useEffect(() => {
    if (!isMobileData || !selectedResponse) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (detailMode === "edit" && !confirmDiscardResponseChanges(selectedDraftDirty)) {
        return;
      }
      setSelectedId(null);
      setDetailMode("view");
      setDetailDraft(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailMode, isMobileData, selectedDraftDirty, selectedResponse]);

  function closeResponse() {
    if (detailMode === "edit" && !confirmDiscardResponseChanges(selectedDraftDirty)) {
      return;
    }
    setDataStatus("");
    setSelectedId(null);
    setDetailMode("view");
    setDetailDraft(null);
  }

  function openResponse(response: SurveyResponse) {
    setDataStatus("");
    setSelectedId(response.id);
    setDetailMode("view");
    setDetailDraft(responseToDraft(response));
  }

  function editResponseInline(response: SurveyResponse) {
    setDataStatus("");
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
    input: { contactNextDate?: string; contactNote?: string; contactStatus: ContactStatus }
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

  async function handleExportCsv() {
    setBusyAction("csv");
    setDataStatus("");
    try {
      await exportLabResponsesCsv(toSurveyFilters(filters));
      setDataStatus("CSV сформирован по текущему срезу.");
    } catch {
      setDataStatus("Не удалось выгрузить CSV.");
    } finally {
      setBusyAction(null);
    }
  }

  function resetFilters() {
    setFilters(createInitialFilters());
  }

  function focusPaperDate(date: string) {
    setFilters({ ...filters, dateFrom: date, dateTo: date, source: "paper" });
  }

  function applyContactQueue(status: ContactQueueStatus) {
    setFilters({
      ...filters,
      contactStatus: status === "all" ? [] : [status],
      helpOnly: true
    });
    setDataMode("contacts");
  }

  function applyContactPlan(plan: ContactPlanFilter) {
    const nextFilters: Filters = {
      ...filters,
      contactNextFrom: "",
      contactNextMissing: false,
      contactNextTo: "",
      helpOnly: true
    };
    const today = todayString();

    if (plan === "due") {
      nextFilters.contactNextTo = addDaysString(-1);
    } else if (plan === "today") {
      nextFilters.contactNextFrom = today;
      nextFilters.contactNextTo = today;
    } else if (plan === "future") {
      nextFilters.contactNextFrom = addDaysString(1);
    } else if (plan === "missing") {
      nextFilters.contactNextMissing = true;
    }

    setFilters(nextFilters);
    setDataMode("contacts");
  }

  function saveFilterPreset() {
    if (!filtersActive) {
      setDataStatus("Сначала выберите фильтры для среза.");
      return;
    }

    const nextPreset: FilterPreset = {
      createdAt: new Date().toISOString(),
      filters: cloneFilters(filters),
      id: createClientId(),
      name: cleanOptional(presetName) ?? createFilterPresetName(filters)
    };
    const nextPresets = [
      nextPreset,
      ...filterPresets.filter((preset) => preset.name !== nextPreset.name)
    ].slice(0, 12);

    setFilterPresets(nextPresets);
    writeDataFilterPresets(nextPresets);
    setPresetName("");
    setDataStatus("Срез сохранён.");
  }

  function applyFilterPreset(preset: FilterPreset) {
    setFilters(cloneFilters(preset.filters));
    setDataStatus(`Срез «${preset.name}» применён.`);
  }

  function deleteFilterPreset(id: string) {
    const nextPresets = filterPresets.filter((preset) => preset.id !== id);
    setFilterPresets(nextPresets);
    writeDataFilterPresets(nextPresets);
  }

  function changeDataMode(nextMode: DataMode) {
    if (nextMode === "contacts" && selectedResponse?.q16 !== "yes") {
      setSelectedId(null);
      setDetailMode("view");
      setDetailDraft(null);
    }

    setDataMode(nextMode);
  }

  const responseInspector = (
    <ResponseInspector
      busy={busyAction === "row-save"}
      draft={detailDraft}
      hideContacts={hideContacts}
      mobile={isMobileData}
      mode={detailMode}
      response={selectedResponse}
      status={dataStatus}
      onCancel={() => {
        if (selectedResponse) {
          setDetailDraft(responseToDraft(selectedResponse));
        }
        setDataStatus("");
        setDetailMode("view");
      }}
      onChange={setDetailDraft}
      onClose={closeResponse}
      onDelete={handleDeleteResponse}
      onEdit={editResponseInline}
      onOpenEntry={onEdit}
      onSaveContact={handleSaveContactWorkflow}
      onSave={handleSaveSelected}
      onToggleContacts={() => setHideContacts((current) => !current)}
    />
  );

  return (
    <section className="task-page data-task">
      <div className="task-heading">
        <div>
          <p className="eyebrow">Работа</p>
          <h1>Данные</h1>
        </div>
        <div className="header-action-row">
          <button
            aria-label={busyAction === "csv" ? "Формируется CSV" : "Скачать CSV по текущему срезу"}
            className="primary-button"
            disabled={busyAction !== null}
            title="Скачать CSV по текущему срезу"
            type="button"
            onClick={handleExportCsv}
          >
            <Download aria-hidden size={18} />
            <span className="data-action-label">{busyAction === "csv" ? "CSV..." : "CSV"}</span>
          </button>
          <details className="action-menu">
            <summary aria-label="Другие действия" className="ghost-button" title="Другие действия">
              <Ellipsis aria-hidden size={19} />
              <span className="data-action-label">Ещё</span>
            </summary>
            <div className="action-menu-popover">
              <button
                aria-pressed={hideContacts}
                className={hideContacts ? "privacy-button is-active" : "privacy-button"}
                type="button"
                onClick={(event) => {
                  setHideContacts((current) => !current);
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}
              >
                <LockKeyhole aria-hidden size={18} />
                {hideContacts ? "Показать контакты" : "Скрыть контакты"}
              </button>
              <button
                disabled={busyAction !== null}
                type="button"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  void handleCreateFake();
                }}
              >
                <Plus aria-hidden size={18} />
                Добавить демо-анкету
              </button>
              <button
                className="danger-menu-action"
                disabled={busyAction !== null}
                type="button"
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  void handleDeleteFake();
                }}
              >
                <Trash2 aria-hidden size={18} />
                Удалить все демо
              </button>
            </div>
          </details>
        </div>
      </div>
      {dataStatus ? <p className="form-status">{dataStatus}</p> : null}

      <label className="data-mode-select">
        <span>Раздел данных</span>
        <select
          aria-label="Раздел данных"
          value={dataMode}
          onChange={(event) => changeDataMode(event.target.value as DataMode)}
        >
          {dataModeItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} · {item.count}
            </option>
          ))}
        </select>
      </label>

      <div className="data-mode-tabs" aria-label="Раздел данных">
        {dataModeItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              aria-pressed={dataMode === item.id}
              className={dataMode === item.id ? "is-active" : ""}
              key={item.id}
              type="button"
              onClick={() => changeDataMode(item.id)}
            >
              <Icon aria-hidden size={18} />
              <span>{item.label}</span>
              <b>{item.count}</b>
            </button>
          );
        })}
      </div>

      <section className={filtersOpen ? "task-panel filter-panel" : "task-panel filter-panel is-collapsed"}>
        <div className="filter-title-row">
          <div>
            <span>Срез</span>
            <strong>{filteredResponses.length} из {responses.length}</strong>
          </div>
          <div className="filter-title-actions">
            <button
              aria-expanded={filtersOpen}
              className="ghost-button compact-button"
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              {filtersOpen ? "Свернуть" : "Фильтры"}
            </button>
            {filtersActive ? (
              <button className="link-button" type="button" onClick={resetFilters}>
                Очистить
              </button>
            ) : null}
          </div>
        </div>
        {activeFilterChips.length > 0 ? (
          <div className="active-filter-chips" aria-label="Активные фильтры">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilters((current) => clearFilterChip(current, chip.key))}
              >
                {chip.label}
                <span aria-hidden>x</span>
              </button>
            ))}
          </div>
        ) : null}
        {filtersOpen ? (
          <div className="filter-body">
            <div className="filter-presets">
              <div className="preset-save-row">
                <label>
                  Сохранить срез
                  <input
                    placeholder="например: помощь за месяц"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                  />
                </label>
                <button className="ghost-button compact-button" disabled={!filtersActive} type="button" onClick={saveFilterPreset}>
                  <Save aria-hidden size={16} />
                  Сохранить
                </button>
              </div>
              {filterPresets.length > 0 ? (
                <div className="preset-list" aria-label="Сохранённые срезы">
                  {filterPresets.map((preset) => (
                    <div className="preset-row" key={preset.id}>
                      <button type="button" onClick={() => applyFilterPreset(preset)}>
                        {preset.name}
                      </button>
                      <button aria-label={`Удалить срез ${preset.name}`} type="button" onClick={() => deleteFilterPreset(preset.id)}>
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
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
          </div>
        ) : null}
      </section>

      {dataMode === "contacts" ? (
        <section className="data-mode-panel contact-mode-panel">
          <div className="task-panel help-queue-panel">
            <div className="section-title-row">
              <h2>Обращения</h2>
              <span>{helpRequests.length}</span>
            </div>
            <div className="contact-filter-row">
              <ContactQueueControls
                activeStatuses={filters.contactStatus}
                counts={contactQueueCounts}
                onSelect={applyContactQueue}
              />
              <ContactPlanControls
                activePlan={activeContactPlan}
                counts={contactPlanCounts}
                onSelect={applyContactPlan}
              />
            </div>
            <HelpQueue
              hideContacts={hideContacts}
              responses={visibleHelpRequests}
              selectedId={selectedId}
              onOpen={openResponse}
            />
            <ListContinuation
              shown={visibleHelpRequests.length}
              total={sortedHelpRequests.length}
              onMore={() =>
                setVisibleHelpCount((current) => advanceVisibleCount(current, sortedHelpRequests.length))
              }
            />
          </div>
          {!isMobileData ? responseInspector : null}
        </section>
      ) : null}

      {dataMode === "rows" ? (
        <section className="task-panel rows-mode-panel">
          <div className="section-title-row">
            <h2>Анкеты</h2>
            <span>{filteredResponses.length}</span>
          </div>
          <div className="row-workbench">
            <div className="row-list-column">
              <ResponseRows
                hideContacts={hideContacts}
                responses={visibleResponses}
                selectedId={selectedId}
                onOpen={openResponse}
              />
              <ListContinuation
                shown={visibleResponses.length}
                total={filteredResponses.length}
                onMore={() =>
                  setVisibleRowCount((current) => advanceVisibleCount(current, filteredResponses.length))
                }
              />
            </div>
            {!isMobileData ? responseInspector : null}
          </div>
        </section>
      ) : null}

      {dataMode === "pdf" ? (
        <section className="task-panel pdf-slice-panel">
          <div className="section-title-row">
            <h2>PDF за период</h2>
            <span>{matchingPdfs.length}</span>
          </div>
          <PdfCoveragePanel coverage={pdfCoverage} onFocusDate={focusPaperDate} />
          <PdfMiniList files={matchingPdfs} />
          <div className="form-actions">
            <button className="ghost-button" type="button" onClick={onOpenPdfArchive}>
              <FileText aria-hidden size={17} />
              Открыть архив
            </button>
          </div>
        </section>
      ) : null}

      {dataMode === "charts" ? (
        <>
          <section className="summary-grid" aria-label="Сводка">
            <Metric icon={Database} label="Анкет" value={filteredResponses.length} />
            <Metric icon={ClipboardList} label="Онлайн" value={summary.online} />
            <Metric icon={PenLine} label="Бумага" value={summary.paper} />
            <Metric icon={Phone} label="Обращения" value={summary.help} />
          </section>
          <section className="data-layout data-charts-grid">
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
        </>
      ) : null}

      {isMobileData && selectedResponse ? (
        <div
          aria-label={`Анкета за ${selectedResponse.surveyDate}`}
          aria-modal="true"
          className="mobile-data-detail-layer"
          ref={mobileDetailRef}
          role="dialog"
          tabIndex={-1}
        >
          {responseInspector}
        </div>
      ) : null}
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = buildPdfArchiveName(surveyDate);
  const existingFile = files.find((file) => file.surveyDate === surveyDate);

  function clearSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const issue = getPdfSelectionIssue(file);
    if (issue) {
      setStatus(
        issue === "too_large"
          ? "PDF должен быть не больше 100 МБ."
          : issue === "empty"
            ? "Выбранный PDF пустой."
            : "Выберите PDF-файл."
      );
      clearSelectedFile();
      return;
    }

    setSelectedFile(file);
    setStatus("");
  }

  async function handleUpload() {
    if (!surveyDate || !selectedFile || existingFile || uploading) {
      return;
    }

    setUploading(true);
    try {
      await onAdd(displayName, selectedFile);
      setStatus(`${displayName} добавлен.`);
      clearSelectedFile();
    } catch (error) {
      if (error instanceof Error && error.message.includes("409")) {
        setStatus(`${displayName} уже есть в архиве.`);
      } else if (error instanceof Error && error.message.includes("413")) {
        setStatus("PDF должен быть не больше 100 МБ.");
      } else {
        setStatus("Не удалось сохранить PDF.");
      }
    } finally {
      setUploading(false);
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
        <div className="section-title-row">
          <h2>Добавить скан</h2>
        </div>

        <div className="pdf-upload-grid">
          <label>
            Дата опроса
            <input
              required
              type="date"
              value={surveyDate}
              onChange={(event) => {
                setSurveyDate(event.target.value);
                setStatus("");
              }}
            />
          </label>
          <div className="pdf-archive-name">
            <span>Название в архиве</span>
            <strong>{surveyDate ? displayName : "Выберите дату"}</strong>
          </div>
        </div>

        {existingFile ? (
          <div className="pdf-existing-notice" role="status">
            <FileText aria-hidden size={22} />
            <div>
              <strong>PDF за эту дату уже есть</strong>
              <span>{existingFile.displayName} · {formatFileSize(existingFile.sizeBytes)}</span>
            </div>
            <a href={getLabPdfDownloadUrl(existingFile.id)}>
              <Download aria-hidden size={17} />
              Скачать
            </a>
          </div>
        ) : null}

        <div className="pdf-file-picker">
          <label className="file-drop">
            <Upload aria-hidden size={20} />
            {selectedFile ? "Выбрать другой PDF" : "Выбрать PDF"}
            <input
              accept="application/pdf,.pdf"
              ref={fileInputRef}
              type="file"
              onChange={handleFile}
            />
          </label>

          {selectedFile ? (
            <div className="pdf-selected-file">
              <FileText aria-hidden size={24} />
              <div>
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
              <button aria-label="Убрать выбранный файл" type="button" onClick={clearSelectedFile}>
                <X aria-hidden size={18} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="pdf-upload-actions">
          <button
            className="primary-button"
            disabled={!surveyDate || !selectedFile || Boolean(existingFile) || uploading}
            type="button"
            onClick={handleUpload}
          >
            <Upload aria-hidden size={18} />
            {uploading ? "Добавление..." : "Добавить в архив"}
          </button>
        </div>
        {status ? <p aria-live="polite" className="form-status">{status}</p> : null}
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
  selectedBasics,
  showDate,
  showMissing,
  onChange,
  onSelection
}: {
  draft: ResponseDraft;
  selectedBasics?: SurveyBasicSelections;
  showDate: boolean;
  showMissing?: boolean;
  onChange: (draft: ResponseDraft) => void;
  onSelection?: (field: SurveyBasicField) => void;
}) {
  return (
    <div className="basic-grid">
      {showDate ? (
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
        dataField={selectedBasics ? "gender" : undefined}
        invalid={Boolean(showMissing && selectedBasics && !selectedBasics.gender)}
        label="Пол"
        options={[
          { value: "female", label: genderLabels.female },
          { value: "male", label: genderLabels.male }
        ]}
        required={Boolean(selectedBasics)}
        value={!selectedBasics || selectedBasics.gender ? draft.gender : undefined}
        onChange={(value) => {
          onChange({ ...draft, gender: value as Gender });
          onSelection?.("gender");
        }}
      />
      <SegmentedGroup
        dataField={selectedBasics ? "ageGroup" : undefined}
        invalid={Boolean(showMissing && selectedBasics && !selectedBasics.ageGroup)}
        label="Возраст"
        options={[
          { value: "under_18", label: ageLabels.under_18 },
          { value: "18_40", label: ageLabels["18_40"] },
          { value: "over_40", label: ageLabels.over_40 }
        ]}
        required={Boolean(selectedBasics)}
        value={!selectedBasics || selectedBasics.ageGroup ? draft.ageGroup : undefined}
        onChange={(value) => {
          onChange({ ...draft, ageGroup: value as AgeGroup });
          onSelection?.("ageGroup");
        }}
      />
      <SegmentedGroup
        dataField={selectedBasics ? "residence" : undefined}
        invalid={Boolean(showMissing && selectedBasics && !selectedBasics.residence)}
        label="Место проживания"
        options={[
          { value: "snezhinsk", label: residenceLabels.snezhinsk },
          { value: "other", label: residenceLabels.other }
        ]}
        required={Boolean(selectedBasics)}
        value={!selectedBasics || selectedBasics.residence ? draft.residence : undefined}
        onChange={(value) => {
          onChange({ ...draft, residence: value as Residence });
          onSelection?.("residence");
        }}
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
      <PeriodControl draft={draft} onChange={onChange} />
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

function PeriodControl({
  draft,
  onChange
}: {
  draft: ResponseDraft;
  onChange: (draft: ResponseDraft) => void;
}) {
  const hasPeriod = Boolean(draft.researchPeriodStart || draft.researchPeriodEnd);
  const start = draft.researchPeriodStart ?? researchYearMin;
  const end = draft.researchPeriodEnd ?? researchYearMax;

  function setPeriod(nextStart: number | undefined, nextEnd: number | undefined) {
    if (nextStart === undefined && nextEnd === undefined) {
      onChange({ ...draft, researchPeriodStart: undefined, researchPeriodEnd: undefined });
      return;
    }

    const safeStart = nextStart === undefined ? undefined : clampResearchYear(nextStart);
    const safeEnd = nextEnd === undefined ? undefined : clampResearchYear(nextEnd);
    const hasBothYears = safeStart !== undefined && safeEnd !== undefined;
    const orderedStart = hasBothYears ? Math.min(safeStart, safeEnd) : safeStart;
    const orderedEnd = hasBothYears ? Math.max(safeStart, safeEnd) : safeEnd;

    onChange({ ...draft, researchPeriodStart: orderedStart, researchPeriodEnd: orderedEnd });
  }

  return (
    <details className="period-control">
      <summary className="period-summary">
        <div>
          <span>Период поиска</span>
          <strong>{formatDraftResearchPeriod(draft)}</strong>
        </div>
        <span className="period-summary-action">
          {hasPeriod ? "Изменить" : "Указать"}
          <ChevronDown aria-hidden size={18} />
        </span>
      </summary>

      <div className="period-content">
        <div className="period-presets" aria-label="Быстрый выбор периода">
          {periodPresets.map((preset) => (
            <button
              className={draft.researchPeriodStart === preset.start && draft.researchPeriodEnd === preset.end ? "is-active" : ""}
              key={preset.label}
              type="button"
              onClick={() => setPeriod(preset.start, preset.end)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="period-sliders">
          <label>
            С
            <input
              max={researchYearMax}
              min={researchYearMin}
              type="range"
              value={start}
              onChange={(event) => setPeriod(Number(event.target.value), end)}
            />
          </label>
          <label>
            По
            <input
              max={researchYearMax}
              min={researchYearMin}
              type="range"
              value={end}
              onChange={(event) => setPeriod(start, Number(event.target.value))}
            />
          </label>
        </div>

        <div className="period-pair">
          <label>
            с
            <input
              inputMode="numeric"
              max={researchYearMax}
              min={researchYearMin}
              placeholder="1850"
              type="number"
              value={draft.researchPeriodStart ?? ""}
              onChange={(event) => setPeriod(parseOptionalNumber(event.target.value), draft.researchPeriodEnd)}
            />
          </label>
          <label>
            по
            <input
              inputMode="numeric"
              max={researchYearMax}
              min={researchYearMin}
              placeholder="1945"
              type="number"
              value={draft.researchPeriodEnd ?? ""}
              onChange={(event) => setPeriod(draft.researchPeriodStart, parseOptionalNumber(event.target.value))}
            />
          </label>
        </div>

        {hasPeriod ? (
          <button className="link-button period-reset" type="button" onClick={() => setPeriod(undefined, undefined)}>
            Не ограничивать период
          </button>
        ) : null}
      </div>
    </details>
  );
}

function QuestionStack({
  draft,
  highlightedQuestionId,
  idPrefix,
  requireContactDetails = false,
  showConsentChoices = false,
  showOnlineHelpFields = false,
  showUnknownOption = true,
  questionsToShow,
  onAnswer,
  onChange
}: {
  draft: ResponseDraft;
  highlightedQuestionId?: QuestionId | null;
  idPrefix?: string;
  requireContactDetails?: boolean;
  showConsentChoices?: boolean;
  showOnlineHelpFields?: boolean;
  showUnknownOption?: boolean;
  questionsToShow: typeof questions;
  onAnswer?: (questionId: QuestionId, answer: Answer) => void;
  onChange: (draft: ResponseDraft) => void;
}) {
  return (
    <div className="question-stack">
      {questionsToShow.map((question) => (
        <div
          className={highlightedQuestionId === question.id ? "question-card is-highlighted" : "question-card"}
          id={idPrefix ? `${idPrefix}-question-${question.id}` : undefined}
          key={question.id}
        >
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
              ...(showUnknownOption ? [{ value: "unknown", label: "—" }] : [])
            ]}
            value={draft[question.id]}
            onChange={(value) => {
              const answer = value as Answer;
              const nextDraft = {
                ...draft,
                [question.id]: answer,
                ...(question.id === "q11" && value !== "yes" ? { q11WarDetails: "—" } : {})
              };
              const resolvedDraft =
                question.id === "q16" && value !== "yes"
                  ? clearSurveyHelpDetails(nextDraft)
                  : nextDraft;
              onChange(resolvedDraft);
              onAnswer?.(question.id, answer);
            }}
          />
          {question.id === "q11" && draft.q11 === "yes" ? (
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
                  required={requireContactDetails}
                  value={draft.contactName ?? ""}
                  onChange={(event) => onChange({ ...draft, contactName: event.target.value || undefined })}
                />
              </label>
              <label>
                Номер телефона
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+7 900 000-00-00"
                  required={requireContactDetails}
                  type="tel"
                  value={draft.contactPhone ?? ""}
                  onChange={(event) => onChange({ ...draft, contactPhone: event.target.value || undefined })}
                />
              </label>
            </div>
          ) : null}
          {question.id === "q16" && draft.q16 === "yes" && showOnlineHelpFields ? (
            <div className="online-help-fields">
              <div className="online-help-fields-title">
                <strong>Детали поиска</strong>
                <span>необязательно</span>
              </div>
              <SearchFields draft={draft} onChange={onChange} />
            </div>
          ) : null}
          {question.id === "q16" && showConsentChoices ? (
            <ConsentChoiceFields draft={draft} onChange={onChange} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ConsentChoiceFields({
  draft,
  onChange
}: {
  draft: ResponseDraft;
  onChange: (draft: ResponseDraft) => void;
}) {
  const options = [
    { value: "yes", label: "Да" },
    { value: "no", label: "Нет" },
    { value: "unknown", label: "—" }
  ];
  const toChoice = (value: boolean | undefined) =>
    value === true ? "yes" : value === false ? "no" : "unknown";
  const fromChoice = (value: string) =>
    value === "yes" ? true : value === "no" ? false : undefined;

  return (
    <div className="consent-choice-grid">
      <SegmentedGroup
        compact
        label="Согласие на обработку ответов"
        options={options}
        value={toChoice(draft.consentToDataProcessing)}
        onChange={(value) =>
          onChange({ ...draft, consentToDataProcessing: fromChoice(value) })
        }
      />
      {draft.q16 === "yes" ? (
        <SegmentedGroup
          compact
          label="Согласие на приглашения"
          options={options}
          value={toChoice(draft.consentToEvents)}
          onChange={(value) => onChange({ ...draft, consentToEvents: fromChoice(value) })}
        />
      ) : null}
    </div>
  );
}

function SegmentedGroup({
  compact,
  dataField,
  invalid,
  label,
  onChange,
  options,
  required,
  value
}: {
  compact?: boolean;
  dataField?: SurveyBasicField;
  invalid?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  value?: string;
}) {
  const className = [
    "segmented",
    `option-count-${options.length}`,
    compact ? "compact" : "",
    invalid ? "is-invalid" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <fieldset
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      className={className}
      data-basic-field={dataField}
    >
      {label ? <legend>{label}</legend> : null}
      <div>
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
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

function ListContinuation({
  onMore,
  shown,
  total
}: {
  onMore: () => void;
  shown: number;
  total: number;
}) {
  if (shown >= total) {
    return null;
  }

  return (
    <div className="list-continuation">
      <span>Показано {shown} из {total}</span>
      <button className="ghost-button compact-button" type="button" onClick={onMore}>
        Показать ещё
      </button>
    </div>
  );
}

function HelpQueue({
  hideContacts,
  onOpen,
  responses,
  selectedId
}: {
  hideContacts: boolean;
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
            <strong>{renderContactName(response.contactName, hideContacts)}</strong>
            <p>
              {response.surveyDate} · {ageLabels[response.ageGroup]} · {residenceLabels[response.residence]}
            </p>
            {response.researchTerritory ? <small>{response.researchTerritory}</small> : null}
            {response.contactNextDate ? <small>Следующий контакт: {response.contactNextDate}</small> : null}
            {response.freeText ? <small>{response.freeText}</small> : null}
          </div>
          <div className="help-actions">
            {response.contactPhone && !hideContacts ? (
              <a href={`tel:${normalizePhone(response.contactPhone)}`}>
                <Phone aria-hidden size={17} />
                {response.contactPhone}
              </a>
            ) : response.contactPhone ? (
              <span className="masked-contact">Телефон скрыт</span>
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

function ContactQueueControls({
  activeStatuses,
  counts,
  onSelect
}: {
  activeStatuses: ContactStatus[];
  counts: Record<ContactQueueStatus, number>;
  onSelect: (status: ContactQueueStatus) => void;
}) {
  const items: Array<{ id: ContactQueueStatus; label: string }> = [
    { id: "all", label: "Все" },
    { id: "new", label: contactStatusLabels.new },
    { id: "in_progress", label: contactStatusLabels.in_progress },
    { id: "done", label: contactStatusLabels.done },
    { id: "no_contact", label: contactStatusLabels.no_contact }
  ];

  const activeStatus = activeStatuses.length === 1 ? activeStatuses[0] : "all";

  return (
    <label className="contact-filter-select">
      Статус
      <select value={activeStatus} onChange={(event) => onSelect(event.target.value as ContactQueueStatus)}>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label} · {counts[item.id]}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContactPlanControls({
  activePlan,
  counts,
  onSelect
}: {
  activePlan: ContactPlanFilter;
  counts: Record<ContactPlanFilter, number>;
  onSelect: (plan: ContactPlanFilter) => void;
}) {
  const items: Array<{ id: ContactPlanFilter; label: string }> = [
    { id: "all", label: "Весь план" },
    { id: "due", label: "Просрочено" },
    { id: "today", label: "Сегодня" },
    { id: "future", label: "Дальше" },
    { id: "missing", label: "Без даты" }
  ];

  return (
    <label className="contact-filter-select">
      Следующий контакт
      <select value={activePlan} onChange={(event) => onSelect(event.target.value as ContactPlanFilter)}>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label} · {counts[item.id]}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResponseRows({
  hideContacts,
  onOpen,
  selectedId,
  responses
}: {
  hideContacts: boolean;
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
            {response.contactPhone && !hideContacts ? (
              <a href={`tel:${normalizePhone(response.contactPhone)}`}>{response.contactPhone}</a>
            ) : response.contactPhone ? (
              <span className="masked-contact">Телефон скрыт</span>
            ) : null}
            {response.researchTerritory ? <span>{response.researchTerritory}</span> : null}
          </div>
          <div className="row-actions">
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

function MobileResponseEditor({
  busy,
  draft,
  onCancel,
  onChange,
  onSave,
  response,
  status
}: {
  busy: boolean;
  draft: ResponseDraft;
  onCancel: () => void;
  onChange: (draft: ResponseDraft) => void;
  onSave: () => Promise<void>;
  response: SurveyResponse;
  status: string;
}) {
  const [step, setStep] = useState(0);
  const [validationStatus, setValidationStatus] = useState("");
  const stepCount = questions.length + 1;
  const activeQuestion = step > 0 ? questions[step - 1] : null;
  const sectionLabel = activeQuestion
    ? activeQuestion.group === "experience"
      ? "Опыт"
      : activeQuestion.group === "interest"
        ? "Интересы"
        : "Помощь"
    : "Данные анкеты";
  const requireContactDetails = requiresResponseContacts(response.source);
  const showOnlineHelpFields = shouldShowResponseSearchFields(response.source, draft);

  function moveToStep(nextStep: number) {
    setStep(Math.min(stepCount - 1, Math.max(0, nextStep)));
    setValidationStatus("");
    window.requestAnimationFrame(() => {
      document.getElementById("mobile-row-editor-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleChange(nextDraft: ResponseDraft) {
    setValidationStatus("");
    onChange(nextDraft);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (hasMissingRequiredResponseContacts(response.source, draft)) {
      const contactIssue = getSurveyContactValidationIssue(draft);
      setStep(stepCount - 1);
      setValidationStatus(
        contactIssue === "name"
          ? "Укажите имя."
          : contactIssue === "phone_invalid"
            ? "Проверьте номер телефона: нужно от 10 до 15 цифр."
            : "Укажите номер телефона."
      );
      window.requestAnimationFrame(() => {
        const selector = contactIssue === "name"
          ? '#mobile-row-editor-stage input[autocomplete="name"]'
          : '#mobile-row-editor-stage input[autocomplete="tel"]';
        document.querySelector<HTMLInputElement>(selector)?.focus();
      });
      return;
    }

    setValidationStatus("");
    await onSave();
  }

  return (
    <form className="mobile-row-editor" onSubmit={(event) => void handleSubmit(event)}>
      <div aria-label={`Шаг ${step + 1} из ${stepCount}`} className="mobile-entry-progress">
        <div>
          <span>{activeQuestion ? `Вопрос ${activeQuestion.number}` : "Вопросы 1-3"}</span>
          <strong>{sectionLabel}</strong>
        </div>
        <b>{step + 1} / {stepCount}</b>
        <i aria-hidden>
          <span style={{ width: `${((step + 1) / stepCount) * 100}%` }} />
        </i>
      </div>

      <label className="mobile-row-editor-jump">
        <span>Перейти к</span>
        <select aria-label="Перейти к вопросу" value={step} onChange={(event) => moveToStep(Number(event.target.value))}>
          <option value={0}>1-3. Данные анкеты</option>
          {questions.map((question, index) => (
            <option key={question.id} value={index + 1}>
              {question.number}. {question.label}
            </option>
          ))}
        </select>
      </label>

      <section className="mobile-entry-stage" id="mobile-row-editor-stage">
        {activeQuestion ? (
          <QuestionStack
            draft={draft}
            idPrefix="mobile-row-editor"
            requireContactDetails={requireContactDetails}
            showConsentChoices={response.source === "paper"}
            showOnlineHelpFields={showOnlineHelpFields}
            questionsToShow={[activeQuestion]}
            onChange={handleChange}
          />
        ) : (
          <BasicFields draft={draft} showDate onChange={handleChange} />
        )}
      </section>

      {validationStatus || status ? (
        <p className="form-status mobile-row-editor-status" role="status">
          {validationStatus || status}
        </p>
      ) : null}

      <button className="link-button mobile-row-editor-cancel" disabled={busy} type="button" onClick={onCancel}>
        Отменить изменения
      </button>

      <div className="mobile-row-editor-actions">
        <button
          aria-label="Предыдущий шаг"
          className="ghost-button"
          disabled={busy || step === 0}
          title="Предыдущий шаг"
          type="button"
          onClick={() => moveToStep(step - 1)}
        >
          <ChevronLeft aria-hidden size={21} />
        </button>
        <button className="primary-button" disabled={busy} type="submit">
          <Save aria-hidden size={18} />
          {busy ? "Сохраняем..." : "Сохранить"}
        </button>
        <button
          aria-label="Следующий шаг"
          className="ghost-button"
          disabled={busy || step === stepCount - 1}
          title="Следующий шаг"
          type="button"
          onClick={() => moveToStep(step + 1)}
        >
          <ChevronRight aria-hidden size={21} />
        </button>
      </div>
    </form>
  );
}

function ResponseInspector({
  busy,
  draft,
  hideContacts,
  mobile,
  mode,
  onCancel,
  onChange,
  onClose,
  onDelete,
  onEdit,
  onOpenEntry,
  onSaveContact,
  onSave,
  onToggleContacts,
  response,
  status
}: {
  busy: boolean;
  draft: ResponseDraft | null;
  hideContacts: boolean;
  mobile: boolean;
  mode: "view" | "edit";
  onCancel: () => void;
  onChange: (draft: ResponseDraft) => void;
  onClose: () => void;
  onDelete: (response: SurveyResponse) => Promise<void>;
  onEdit: (response: SurveyResponse) => void;
  onOpenEntry: (id: string) => void;
  onSaveContact: (
    response: SurveyResponse,
    input: { contactNextDate?: string; contactNote?: string; contactStatus: ContactStatus }
  ) => Promise<void>;
  onSave: () => Promise<void>;
  onToggleContacts: () => void;
  response: SurveyResponse | null;
  status: string;
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
        {mobile ? (
          <MobileResponseEditor
            busy={busy}
            draft={draft}
            response={response}
            status={status}
            onCancel={onCancel}
            onChange={onChange}
            onSave={onSave}
          />
        ) : (
          <form
            className="inline-editor"
            onSubmit={(event) => {
              event.preventDefault();
              void onSave();
            }}
          >
            <BasicFields draft={draft} showDate onChange={onChange} />
            <QuestionStack
              draft={draft}
              requireContactDetails={requiresResponseContacts(response.source)}
              showConsentChoices={response.source === "paper"}
              showOnlineHelpFields={shouldShowResponseSearchFields(response.source, draft)}
              questionsToShow={questions}
              onChange={onChange}
            />
            {status ? <p className="form-status" role="status">{status}</p> : null}
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
        )}
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
        <Detail
          label="Обработка ответов"
          value={formatConsent(response.consentToDataProcessing)}
        />
        <Detail label="Приглашения" value={formatConsent(response.consentToEvents)} />
      </div>

      {response.q16 === "yes" ? (
        <>
          <section className="inspector-section contact-summary-section">
            <div className="section-title-row">
              <h3>Запрос на помощь</h3>
              {response.contactName || response.contactPhone ? (
                <button
                  aria-label={hideContacts ? "Показать контакты" : "Скрыть контакты"}
                  aria-pressed={!hideContacts}
                  className="ghost-button compact-button mobile-contact-privacy-button"
                  type="button"
                  onClick={onToggleContacts}
                >
                  <LockKeyhole aria-hidden size={16} />
                  {hideContacts ? "Показать" : "Скрыть"}
                </button>
              ) : null}
            </div>
            <div className="detail-grid">
              <Detail label="Имя" masked={hideContacts && Boolean(response.contactName)} value={response.contactName} />
              <Detail
                label="Телефон"
                masked={hideContacts && Boolean(response.contactPhone)}
                phone
                value={response.contactPhone}
              />
              {response.researchTerritory ? <Detail label="Территория" value={response.researchTerritory} /> : null}
              {response.researchPeriodStart || response.researchPeriodEnd ? (
                <Detail label="Период" value={formatResearchPeriod(response)} />
              ) : null}
              {response.freeText ? <Detail label="Комментарий" value={response.freeText} wide /> : null}
            </div>
          </section>
          <ContactWorkflowPanel mobile={mobile} response={response} onSave={onSaveContact} />
        </>
      ) : null}

      {mobile ? (
        <details className="mobile-answer-review">
          <summary>
            <span>Ответы на вопросы 4-16</span>
            <ChevronDown aria-hidden size={18} />
          </summary>
          <ResponseAnswerReview hideHeading response={response} />
        </details>
      ) : (
        <ResponseAnswerReview response={response} />
      )}

      <div className="form-actions inspector-actions">
        <button className="primary-button" type="button" onClick={() => onEdit(response)}>
          <PenLine aria-hidden size={17} />
          Изменить здесь
        </button>
        {!mobile ? (
          <button className="ghost-button" type="button" onClick={() => onOpenEntry(response.id)}>
            Открыть во вводе
          </button>
        ) : null}
        <button className="ghost-button" type="button" onClick={() => onDelete(response)}>
          <Trash2 aria-hidden size={17} />
          Удалить
        </button>
      </div>
    </aside>
  );
}

function ResponseAnswerReview({ hideHeading = false, response }: { hideHeading?: boolean; response: SurveyResponse }) {
  return (
    <section className="answer-review-grid" aria-label="Ответы анкеты">
      {!hideHeading ? (
        <div className="section-title-row">
          <h3>Ответы</h3>
          <span>Q4-Q16</span>
        </div>
      ) : null}
      <div className="answer-review-list">
        {questions.map((question) => {
          const answer = response[question.id];

          return (
            <div className="answer-review-row" key={question.id}>
              <div>
                <b>{question.number}</b>
                <span>{question.label}</span>
                {question.id === "q11" && response.q11WarDetails && response.q11WarDetails !== "—" ? (
                  <small>{response.q11WarDetails}</small>
                ) : null}
              </div>
              <span className={`answer-chip answer-${answer}`}>{answerLabels[answer]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ContactWorkflowPanel({
  mobile,
  onSave,
  response
}: {
  mobile: boolean;
  onSave: (
    response: SurveyResponse,
    input: { contactNextDate?: string; contactNote?: string; contactStatus: ContactStatus }
  ) => Promise<void>;
  response: SurveyResponse;
}) {
  const [contactStatus, setContactStatus] = useState<ContactStatus>(response.contactStatus);
  const [contactNextDate, setContactNextDate] = useState(response.contactNextDate ?? "");
  const [contactNote, setContactNote] = useState(response.contactNote ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setContactStatus(response.contactStatus);
    setContactNextDate(response.contactNextDate ?? "");
    setContactNote(response.contactNote ?? "");
    setStatus("");
  }, [response.contactNextDate, response.contactNote, response.contactStatus, response.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await onSave(response, {
        contactNextDate: cleanOptional(contactNextDate),
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
      {mobile ? (
        <label>
          Статус
          <select value={contactStatus} onChange={(event) => setContactStatus(event.target.value as ContactStatus)}>
            {(Object.keys(contactStatusLabels) as ContactStatus[]).map((value) => (
              <option key={value} value={value}>
                {contactStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <SegmentedGroup
          label="Статус"
          options={(Object.keys(contactStatusLabels) as ContactStatus[]).map((value) => ({
            value,
            label: contactStatusLabels[value]
          }))}
          value={contactStatus}
          onChange={(value) => setContactStatus(value as ContactStatus)}
        />
      )}
      <label>
        Следующий контакт
        <input
          type="date"
          value={contactNextDate}
          onChange={(event) => setContactNextDate(event.target.value)}
        />
      </label>
      <div className="quick-date-row" aria-label="Быстрые даты следующего контакта">
        <button type="button" onClick={() => setContactNextDate(todayString())}>
          Сегодня
        </button>
        <button type="button" onClick={() => setContactNextDate(addDaysString(1))}>
          Завтра
        </button>
        <button type="button" onClick={() => setContactNextDate(addDaysString(7))}>
          +7 дней
        </button>
        <button type="button" onClick={() => setContactNextDate("")}>
          Снять
        </button>
      </div>
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
  masked,
  phone,
  value,
  wide
}: {
  label: string;
  masked?: boolean;
  phone?: boolean;
  value: string | undefined;
  wide?: boolean;
}) {
  const rendered = value?.trim() || "—";

  return (
    <div className={wide ? "detail-item wide-detail" : "detail-item"}>
      <span>{label}</span>
      {masked ? (
        <b className="masked-contact">{phone ? "Телефон скрыт" : "Имя скрыто"}</b>
      ) : phone && value ? (
        <a href={`tel:${normalizePhone(value)}`}>{value}</a>
      ) : (
        <b>{rendered}</b>
      )}
    </div>
  );
}

function PdfCoveragePanel({
  coverage,
  onFocusDate
}: {
  coverage: PdfCoverage;
  onFocusDate: (date: string) => void;
}) {
  const hasWarnings = coverage.missingPdfDates.length > 0 || coverage.pdfWithoutPaperDates.length > 0;
  let statusText = "Бумажные даты закрыты PDF.";
  if (coverage.paperDates.length === 0) {
    statusText = "Бумажных строк в текущем срезе нет.";
  } else if (hasWarnings) {
    statusText = "Есть даты, которые стоит проверить.";
  }

  return (
    <div className="pdf-coverage">
      <div className="pdf-coverage-heading">
        <span>Сверка</span>
        <strong>{statusText}</strong>
      </div>
      <div className="pdf-coverage-stats" aria-label="Состояние PDF-архива">
        <PdfCoverageStat label="Бумажные даты" value={coverage.paperDates.length} />
        <PdfCoverageStat label="С PDF" value={coverage.coveredDates.length} />
        <PdfCoverageStat label="Без PDF" value={coverage.missingPdfDates.length} danger={coverage.missingPdfDates.length > 0} />
        <PdfCoverageStat label="PDF без строк" value={coverage.pdfWithoutPaperDates.length} danger={coverage.pdfWithoutPaperDates.length > 0} />
      </div>
      {coverage.missingPdfDates.length > 0 ? (
        <PdfDateChecklist
          dates={coverage.missingPdfDates}
          title="Бумажные строки без PDF"
          onFocusDate={onFocusDate}
        />
      ) : null}
      {coverage.pdfWithoutPaperDates.length > 0 ? (
        <PdfDateChecklist
          dates={coverage.pdfWithoutPaperDates}
          title="PDF без бумажных строк"
          onFocusDate={onFocusDate}
        />
      ) : null}
    </div>
  );
}

function PdfCoverageStat({
  danger,
  label,
  value
}: {
  danger?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className={danger ? "pdf-coverage-stat is-danger" : "pdf-coverage-stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PdfDateChecklist({
  dates,
  onFocusDate,
  title
}: {
  dates: string[];
  onFocusDate: (date: string) => void;
  title: string;
}) {
  return (
    <div className="pdf-date-checklist">
      <strong>{title}</strong>
      <div>
        {dates.map((date) => (
          <button key={date} type="button" onClick={() => onFocusDate(date)}>
            {date}
          </button>
        ))}
      </div>
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

function PdfRows({ files, onDelete }: { files: PdfRecord[]; onDelete: (id: string) => Promise<void> }) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);

  if (files.length === 0) {
    return <p className="empty-state">Файлы ещё не добавлены.</p>;
  }

  async function confirmDelete(file: PdfRecord) {
    setDeletingId(file.id);
    setDeleteErrorId(null);
    try {
      await onDelete(file.id);
      setPendingDeleteId(null);
    } catch {
      setDeleteErrorId(file.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="row-list">
      {files.map((file) => {
        const confirmingDelete = pendingDeleteId === file.id;

        return (
          <article className={confirmingDelete ? "pdf-row is-confirming-delete" : "pdf-row"} key={file.id}>
            <FileText aria-hidden size={24} />
            <div>
              <strong>{file.displayName}</strong>
              <p>
                {file.surveyDate} · {formatFileSize(file.sizeBytes)}
              </p>
            </div>
            {!confirmingDelete ? (
              <div className="row-actions">
                <a href={getLabPdfDownloadUrl(file.id)}>
                  <Download aria-hidden size={17} />
                  Скачать
                </a>
                <button
                  aria-label={`Удалить ${file.displayName}`}
                  type="button"
                  onClick={() => {
                    setDeleteErrorId(null);
                    setPendingDeleteId(file.id);
                  }}
                >
                  <Trash2 aria-hidden size={17} />
                  Удалить
                </button>
              </div>
            ) : null}

            {confirmingDelete ? (
              <div className="pdf-delete-confirm" role="alert">
                <div>
                  <strong>Удалить PDF без возможности восстановления?</strong>
                  <span>Строки анкет в базе останутся.</span>
                  {deleteErrorId === file.id ? (
                    <span className="error-status">Не удалось удалить файл.</span>
                  ) : null}
                </div>
                <div className="row-actions">
                  <button
                    disabled={deletingId === file.id}
                    type="button"
                    onClick={() => setPendingDeleteId(null)}
                  >
                    Отмена
                  </button>
                  <button
                    className="danger-button"
                    disabled={deletingId === file.id}
                    type="button"
                    onClick={() => void confirmDelete(file)}
                  >
                    <Trash2 aria-hidden size={17} />
                    {deletingId === file.id ? "Удаление..." : "Удалить PDF"}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
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

function createPaperDraftForDate(surveyDate: string): ResponseDraft {
  return { ...createEmptyDraft("paper"), surveyDate };
}

function isPaperDraftTouched(draft: ResponseDraft): boolean {
  const empty = createPaperDraftForDate(draft.surveyDate);

  return (
    draft.gender !== empty.gender ||
    draft.ageGroup !== empty.ageGroup ||
    draft.residence !== empty.residence ||
    questions.some((question) => draft[question.id] !== "unknown") ||
    Boolean(draft.q11WarDetails && draft.q11WarDetails !== "—") ||
    draft.consentToDataProcessing !== undefined ||
    draft.consentToEvents !== undefined
  );
}

function readEntryBatchState(): EntryBatchState {
  const fallbackSurveyDate = todayString();

  try {
    const raw = window.sessionStorage.getItem(entryBatchStorageKey);
    return parseEntryBatchState(raw ? JSON.parse(raw) : null, fallbackSurveyDate);
  } catch {
    return { count: 0, surveyDate: fallbackSurveyDate };
  }
}

function readInitialPaperEntryState(): {
  batchState: EntryBatchState;
  storedDraft: PaperEntryDraftState | null;
} {
  const batchState = readEntryBatchState();
  const storedDraft = readPaperEntryDraftState();

  return {
    batchState: storedDraft
      ? changeEntryBatchDate(batchState, storedDraft.draft.surveyDate)
      : batchState,
    storedDraft
  };
}

function readPaperEntryDraftState(): PaperEntryDraftState | null {
  try {
    const raw = window.sessionStorage.getItem(entryDraftStorageKey);
    return parsePaperEntryDraftState(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

function writePaperEntryDraftState(draft: ResponseDraft, mobileEntryStep: number): void {
  if (draft.source !== "paper") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      entryDraftStorageKey,
      JSON.stringify(createPaperEntryDraftState({ ...draft, source: "paper" }, mobileEntryStep))
    );
  } catch {
    // Draft recovery is optional; data entry must still work if browser storage is unavailable.
  }
}

function clearPaperEntryDraftState(): void {
  try {
    window.sessionStorage.removeItem(entryDraftStorageKey);
  } catch {
    // Ignore unavailable browser storage.
  }
}

function getPaperDraftRestoredStatus(state: PaperEntryDraftState): string {
  return state.draft.q16 === "yes"
    ? "Черновик восстановлен. Имя и телефон нужно ввести снова."
    : "Черновик восстановлен.";
}

function writeEntryBatchState(state: EntryBatchState): void {
  try {
    window.sessionStorage.setItem(entryBatchStorageKey, JSON.stringify(state));
  } catch {
    // Batch continuity is a convenience; paper entry must work without browser storage.
  }
}

function readSurveyDraftState(): SurveyDraftState {
  const fallback = {
    basicSelections: createEmptyBasicSelections(),
    draft: createEmptyDraft("online"),
    restored: false,
    step: 0
  };

  try {
    const raw = window.localStorage.getItem(surveyDraftStorageKey);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as {
      basicSelections?: unknown;
      draft?: unknown;
      flowVersion?: unknown;
      savedAt?: unknown;
      step?: unknown;
    };
    if (!isSurveyDraftFresh(parsed.savedAt, Date.now())) {
      clearSurveyDraftState();
      return fallback;
    }

    const basicSelections = coerceBasicSelections(parsed.basicSelections);
    const draft = coerceStoredOnlineDraft(parsed.draft);
    const requestedStep = coerceSurveyDraftStep(parsed.step, parsed.flowVersion);
    const step = resolveSurveyDraftStep(requestedStep, basicSelections, draft.q16 === "yes");

    if (!hasSurveyDraftContent(draft) && !hasAnyBasicSelection(basicSelections) && step === 0) {
      clearSurveyDraftState();
      return fallback;
    }

    writeSurveyDraftState({ basicSelections, draft, step }, parsed.savedAt);
    return { basicSelections, draft, restored: true, step };
  } catch {
    return fallback;
  }
}

function writeSurveyDraftState(
  input: {
    basicSelections: SurveyBasicSelections;
    draft: ResponseDraft;
    step: number;
  },
  savedAt = new Date().toISOString()
): void {
  try {
    window.localStorage.setItem(
      surveyDraftStorageKey,
      JSON.stringify({
        basicSelections: input.basicSelections,
        draft: redactSurveyDraftContacts(input.draft),
        flowVersion: surveyFlowVersion,
        savedAt,
        step: input.step
      })
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

function readDataFilterPresets(): FilterPreset[] {
  try {
    const raw = window.localStorage.getItem(dataFilterPresetsStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(coerceStoredFilterPreset)
      .filter((preset): preset is FilterPreset => preset !== null)
      .slice(0, 12);
  } catch {
    return [];
  }
}

function writeDataFilterPresets(presets: FilterPreset[]): void {
  try {
    window.localStorage.setItem(dataFilterPresetsStorageKey, JSON.stringify(presets));
  } catch {
    // Saved slices are optional; data work must continue without localStorage.
  }
}

function readDataFilterPanelOpen(): boolean {
  try {
    const raw = window.localStorage.getItem(dataFilterPanelStorageKey);
    return raw === "true";
  } catch {
    return false;
  }
}

function writeDataFilterPanelOpen(value: boolean): void {
  try {
    window.localStorage.setItem(dataFilterPanelStorageKey, String(value));
  } catch {
    // Filter panel state is a display preference; filtering itself must keep working.
  }
}

function readContactPrivacyMode(): boolean {
  try {
    const raw = window.localStorage.getItem(contactPrivacyStorageKey);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function writeContactPrivacyMode(value: boolean): void {
  try {
    window.localStorage.setItem(contactPrivacyStorageKey, String(value));
  } catch {
    // Privacy mode is a UI preference; contact data stays protected by auth either way.
  }
}

function renderContactName(value: string | undefined, hidden: boolean): string {
  if (!value?.trim()) {
    return "Без имени";
  }

  return hidden ? "Имя скрыто" : value;
}

function coerceStoredFilterPreset(value: unknown): FilterPreset | null {
  if (!isRecord(value) || !isRecord(value.filters)) {
    return null;
  }

  return {
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    filters: coerceStoredFilters(value.filters),
    id: typeof value.id === "string" && value.id ? value.id : createClientId(),
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : "Срез"
  };
}

function coerceStoredFilters(value: Record<string, unknown>): Filters {
  return {
    ageGroup: readStoredList(value.ageGroup, isAgeGroup),
    contactNextFrom: isIsoDate(value.contactNextFrom) ? value.contactNextFrom : "",
    contactNextMissing: value.contactNextMissing === true,
    contactNextTo: isIsoDate(value.contactNextTo) ? value.contactNextTo : "",
    contactOnly: value.contactOnly === true,
    contactStatus: readStoredList(value.contactStatus, isContactStatus),
    dateFrom: isIsoDate(value.dateFrom) ? value.dateFrom : "",
    dateTo: isIsoDate(value.dateTo) ? value.dateTo : "",
    gender: readStoredList(value.gender, isGender),
    helpOnly: value.helpOnly === true,
    query: typeof value.query === "string" ? value.query.trim() : "",
    residence: readStoredList(value.residence, isResidence),
    source: value.source === "paper" || value.source === "online" ? value.source : "all"
  };
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
    draft.consentToDataProcessing !== undefined ||
    draft.consentToEvents !== undefined
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
    consentToDataProcessing: optionalStoredBoolean(value.consentToDataProcessing),
    consentToEvents: optionalStoredBoolean(value.consentToEvents),
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

  draft.contactName = undefined;
  draft.contactPhone = undefined;

  return draft.q16 === "yes" ? draft : clearSurveyHelpDetails(draft);
}

function responseToDraft(response: SurveyResponse): ResponseDraft {
  return {
    ageGroup: response.ageGroup,
    contactName: response.contactName,
    contactPhone: response.contactPhone,
    contactNextDate: response.contactNextDate,
    consentToDataProcessing: response.consentToDataProcessing,
    consentToEvents: response.consentToEvents,
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
  const normalized = {
    ...draft,
    contactName: draft.q16 === "yes" ? cleanOptional(draft.contactName) : undefined,
    contactNextDate: draft.q16 === "yes" ? cleanOptional(draft.contactNextDate) : undefined,
    contactPhone: draft.q16 === "yes" ? cleanOptional(draft.contactPhone) : undefined,
    consentToDataProcessing: draft.consentToDataProcessing,
    consentToEvents: draft.q16 === "yes" ? draft.consentToEvents : undefined,
    freeText: cleanOptional(draft.freeText),
    q11WarDetails: cleanOptional(draft.q11WarDetails) ?? "—",
    researchTerritory: cleanOptional(draft.researchTerritory)
  };

  return draft.q16 === "yes" ? normalized : clearSurveyHelpDetails(normalized);
}

function createInitialFilters(): Filters {
  return {
    ageGroup: [],
    contactNextFrom: "",
    contactNextMissing: false,
    contactNextTo: "",
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

function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const source = params.get("source");

  return {
    ageGroup: readFilterList(params, "ageGroup", isAgeGroup),
    contactNextFrom: readFilterDate(params, "contactNextFrom"),
    contactNextMissing: readFilterBoolean(params, "contactNextMissing"),
    contactNextTo: readFilterDate(params, "contactNextTo"),
    contactOnly: readFilterBoolean(params, "contactOnly"),
    contactStatus: readFilterList(params, "contactStatus", isContactStatus),
    dateFrom: readFilterDate(params, "dateFrom"),
    dateTo: readFilterDate(params, "dateTo"),
    gender: readFilterList(params, "gender", isGender),
    helpOnly: readFilterBoolean(params, "helpOnly"),
    query: params.get("query")?.trim() ?? "",
    residence: readFilterList(params, "residence", isResidence),
    source: source === "paper" || source === "online" ? source : "all"
  };
}

function filtersToSearch(filters: Filters, dataMode: DataMode): string {
  const params = new URLSearchParams();

  setSearchParam(params, "dateFrom", filters.dateFrom);
  setSearchParam(params, "dateTo", filters.dateTo);
  if (filters.source !== "all") {
    params.set("source", filters.source);
  }
  setSearchList(params, "gender", filters.gender);
  setSearchList(params, "ageGroup", filters.ageGroup);
  setSearchList(params, "residence", filters.residence);
  setSearchList(params, "contactStatus", filters.contactStatus);
  setSearchParam(params, "contactNextFrom", filters.contactNextFrom);
  setSearchParam(params, "contactNextTo", filters.contactNextTo);
  setSearchBoolean(params, "contactNextMissing", filters.contactNextMissing);
  setSearchBoolean(params, "helpOnly", filters.helpOnly);
  setSearchBoolean(params, "contactOnly", filters.contactOnly);
  setSearchParam(params, "query", filters.query.trim());
  setDataModeSearchParam(params, dataMode);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function toSurveyFilters(filters: Filters): SurveyFilters {
  return {
    ageGroup: filters.ageGroup.length > 0 ? filters.ageGroup : undefined,
    contactNextFrom: filters.contactNextFrom || undefined,
    contactNextMissing: filters.contactNextMissing || undefined,
    contactNextTo: filters.contactNextTo || undefined,
    contactOnly: filters.contactOnly || undefined,
    contactStatus: filters.contactStatus.length > 0 ? filters.contactStatus : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    gender: filters.gender.length > 0 ? filters.gender : undefined,
    helpOnly: filters.helpOnly || undefined,
    query: cleanOptional(filters.query),
    residence: filters.residence.length > 0 ? filters.residence : undefined,
    source: filters.source === "all" ? undefined : [filters.source]
  };
}

function cloneFilters(filters: Filters): Filters {
  return {
    ...filters,
    ageGroup: [...filters.ageGroup],
    contactStatus: [...filters.contactStatus],
    gender: [...filters.gender],
    residence: [...filters.residence]
  };
}

function createFilterPresetName(filters: Filters): string {
  const labels = buildFilterChips(filters).map((chip) => chip.label);
  if (labels.length === 0) {
    return "Срез";
  }

  return labels.length > 3 ? `${labels.slice(0, 3).join(", ")} +${labels.length - 3}` : labels.join(", ");
}

function buildFilterChips(filters: Filters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.dateFrom) {
    chips.push({ key: "dateFrom", label: `Дата с ${filters.dateFrom}` });
  }

  if (filters.dateTo) {
    chips.push({ key: "dateTo", label: `Дата по ${filters.dateTo}` });
  }

  if (filters.source !== "all") {
    chips.push({ key: "source", label: `Источник: ${sourceLabels[filters.source]}` });
  }

  for (const gender of filters.gender) {
    chips.push({ key: `gender:${gender}`, label: `Пол: ${genderLabels[gender]}` });
  }

  for (const ageGroup of filters.ageGroup) {
    chips.push({ key: `ageGroup:${ageGroup}`, label: `Возраст: ${ageLabels[ageGroup]}` });
  }

  for (const residence of filters.residence) {
    chips.push({ key: `residence:${residence}`, label: `Проживание: ${residenceLabels[residence]}` });
  }

  for (const contactStatus of filters.contactStatus) {
    chips.push({
      key: `contactStatus:${contactStatus}`,
      label: `Статус: ${contactStatusLabels[contactStatus]}`
    });
  }

  if (filters.contactNextFrom) {
    chips.push({ key: "contactNextFrom", label: `Контакт с ${filters.contactNextFrom}` });
  }

  if (filters.contactNextTo) {
    chips.push({ key: "contactNextTo", label: `Контакт по ${filters.contactNextTo}` });
  }

  if (filters.contactNextMissing) {
    chips.push({ key: "contactNextMissing", label: "Контакт без даты" });
  }

  if (filters.helpOnly) {
    chips.push({ key: "helpOnly", label: "Нужна помощь" });
  }

  if (filters.contactOnly) {
    chips.push({ key: "contactOnly", label: "Есть контакт" });
  }

  const query = filters.query.trim();
  if (query) {
    chips.push({ key: "query", label: `Поиск: ${query}` });
  }

  return chips;
}

function clearFilterChip(filters: Filters, key: string): Filters {
  if (key === "dateFrom") {
    return { ...filters, dateFrom: "" };
  }
  if (key === "dateTo") {
    return { ...filters, dateTo: "" };
  }
  if (key === "source") {
    return { ...filters, source: "all" };
  }
  if (key === "helpOnly") {
    return { ...filters, helpOnly: false };
  }
  if (key === "contactOnly") {
    return { ...filters, contactOnly: false };
  }
  if (key === "contactNextFrom") {
    return { ...filters, contactNextFrom: "" };
  }
  if (key === "contactNextTo") {
    return { ...filters, contactNextTo: "" };
  }
  if (key === "contactNextMissing") {
    return { ...filters, contactNextMissing: false };
  }
  if (key === "query") {
    return { ...filters, query: "" };
  }

  const [group, value] = key.split(":");
  if (group === "gender") {
    return { ...filters, gender: filters.gender.filter((item) => item !== value) };
  }
  if (group === "ageGroup") {
    return { ...filters, ageGroup: filters.ageGroup.filter((item) => item !== value) };
  }
  if (group === "residence") {
    return { ...filters, residence: filters.residence.filter((item) => item !== value) };
  }
  if (group === "contactStatus") {
    return { ...filters, contactStatus: filters.contactStatus.filter((item) => item !== value) };
  }

  return filters;
}

function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.ageGroup.length > 0 ||
    Boolean(filters.contactNextFrom) ||
    filters.contactNextMissing ||
    Boolean(filters.contactNextTo) ||
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

  if (filters.contactNextFrom && (response.q16 !== "yes" || !response.contactNextDate || response.contactNextDate < filters.contactNextFrom)) {
    return false;
  }

  if (filters.contactNextTo && (response.q16 !== "yes" || !response.contactNextDate || response.contactNextDate > filters.contactNextTo)) {
    return false;
  }

  if (filters.contactNextMissing && (response.q16 !== "yes" || Boolean(response.contactNextDate))) {
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

function buildContactQueueCounts(responses: SurveyResponse[]): Record<ContactQueueStatus, number> {
  return {
    all: responses.length,
    done: responses.filter((response) => response.contactStatus === "done").length,
    in_progress: responses.filter((response) => response.contactStatus === "in_progress").length,
    new: responses.filter((response) => response.contactStatus === "new").length,
    no_contact: responses.filter((response) => response.contactStatus === "no_contact").length
  };
}

function buildContactPlanCounts(responses: SurveyResponse[]): Record<ContactPlanFilter, number> {
  const today = todayString();
  const tomorrow = addDaysString(1);

  return {
    all: responses.length,
    due: responses.filter((response) => response.contactNextDate && response.contactNextDate < today).length,
    future: responses.filter((response) => response.contactNextDate && response.contactNextDate >= tomorrow).length,
    missing: responses.filter((response) => !response.contactNextDate).length,
    today: responses.filter((response) => response.contactNextDate === today).length
  };
}

function getContactPlanFilter(filters: Filters): ContactPlanFilter {
  const today = todayString();
  const yesterday = addDaysString(-1);
  if (filters.contactNextMissing) {
    return "missing";
  }

  if (filters.contactNextFrom === today && filters.contactNextTo === today) {
    return "today";
  }

  if (!filters.contactNextFrom && filters.contactNextTo === yesterday) {
    return "due";
  }

  if (filters.contactNextFrom === addDaysString(1) && !filters.contactNextTo) {
    return "future";
  }

  return "all";
}

function compareContactQueue(a: SurveyResponse, b: SurveyResponse): number {
  const statusPriority: Record<ContactStatus, number> = {
    new: 0,
    in_progress: 1,
    no_contact: 2,
    done: 3
  };
  const byStatus = statusPriority[a.contactStatus] - statusPriority[b.contactStatus];
  if (byStatus !== 0) {
    return byStatus;
  }

  const byNextDate = compareOptionalDate(a.contactNextDate, b.contactNextDate);
  if (byNextDate !== 0) {
    return byNextDate;
  }

  const byContact = Number(hasContact(b)) - Number(hasContact(a));
  if (byContact !== 0) {
    return byContact;
  }

  const byDate = b.surveyDate.localeCompare(a.surveyDate);
  return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt);
}

function compareOptionalDate(a: string | undefined, b: string | undefined): number {
  if (a && b) {
    return a.localeCompare(b);
  }

  if (a) {
    return -1;
  }

  if (b) {
    return 1;
  }

  return 0;
}

function buildPdfCoverage(responses: SurveyResponse[], files: PdfRecord[]): PdfCoverage {
  const paperDates = uniqueDescending(
    responses
      .filter((response) => response.source === "paper")
      .map((response) => response.surveyDate)
  );
  const pdfDates = uniqueDescending(files.map((file) => file.surveyDate));
  const pdfDateSet = new Set(pdfDates);
  const paperDateSet = new Set(paperDates);

  return {
    coveredDates: paperDates.filter((date) => pdfDateSet.has(date)),
    missingPdfDates: paperDates.filter((date) => !pdfDateSet.has(date)),
    paperDates,
    pdfDates,
    pdfWithoutPaperDates: pdfDates.filter((date) => !paperDateSet.has(date))
  };
}

function uniqueDescending(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => right.localeCompare(left));
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

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [query]);

  return matches;
}

function todayString(): string {
  return toDateInputString(new Date());
}

function addDaysString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputString(date);
}

function toDateInputString(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function createClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampResearchYear(value: number): number {
  return Math.min(researchYearMax, Math.max(researchYearMin, Math.round(value)));
}

function optionalStoredNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalStoredBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalStoredString(value: unknown): string | undefined {
  return typeof value === "string" ? cleanOptional(value) : undefined;
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
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

function isContactStatus(value: unknown): value is ContactStatus {
  return value === "new" || value === "in_progress" || value === "done" || value === "no_contact";
}

function readStoredList<TValue extends string>(
  value: unknown,
  isAllowed: (item: unknown) => item is TValue
): TValue[] {
  return Array.isArray(value) ? value.filter(isAllowed) : [];
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readFilterDate(params: URLSearchParams, key: string): string {
  const value = params.get(key);
  return isIsoDate(value) ? value : "";
}

function readFilterBoolean(params: URLSearchParams, key: string): boolean {
  const value = params.get(key)?.toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function readFilterList<TValue extends string>(
  params: URLSearchParams,
  key: string,
  isAllowed: (value: unknown) => value is TValue
): TValue[] {
  return (params.get(key) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(isAllowed);
}

function setSearchParam(params: URLSearchParams, key: string, value: string): void {
  if (value) {
    params.set(key, value);
  }
}

function setSearchList(params: URLSearchParams, key: string, value: string[]): void {
  if (value.length > 0) {
    params.set(key, value.join(","));
  }
}

function setSearchBoolean(params: URLSearchParams, key: string, value: boolean): void {
  if (value) {
    params.set(key, "true");
  }
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

function formatConsent(value: boolean | undefined): string {
  return value === undefined ? "Не зафиксировано" : value ? "Да" : "Нет";
}

function areResponseDraftsEqual(left: ResponseDraft, right: ResponseDraft): boolean {
  return responseDraftKeys.every((key) => left[key] === right[key]);
}

function confirmDiscardResponseChanges(hasChanges: boolean): boolean {
  return !hasChanges || window.confirm("Закрыть анкету без сохранения изменений?");
}

function formatDraftResearchPeriod(draft: Pick<ResponseDraft, "researchPeriodEnd" | "researchPeriodStart">) {
  if (draft.researchPeriodStart && draft.researchPeriodEnd) {
    return `${draft.researchPeriodStart}-${draft.researchPeriodEnd}`;
  }

  if (draft.researchPeriodStart) {
    return `с ${draft.researchPeriodStart}`;
  }

  if (draft.researchPeriodEnd) {
    return `до ${draft.researchPeriodEnd}`;
  }

  return "не ограничен";
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
