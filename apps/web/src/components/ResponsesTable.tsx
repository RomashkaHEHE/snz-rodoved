import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ageGroupLabels,
  answerLabels,
  genderLabels,
  responseSourceLabels,
  residenceLabels,
  type SurveyResponse
} from "@snz-rodoved/shared";
import { deleteResponse } from "../api/client";
import {
  getNextVisibleResponseCount,
  getVisibleResponseBatch,
  responseBatchSize
} from "../responseBatch";

interface ResponsesTableProps {
  responses: SurveyResponse[];
  onEdit: (response: SurveyResponse) => void;
  onDeleted: () => void;
}

export function ResponsesTable({ responses, onEdit, onDeleted }: ResponsesTableProps) {
  const fakeCount = responses.filter((response) => response.isFake).length;
  const [hideContacts, setHideContacts] = useState(readContactPrivacyMode);
  const [status, setStatus] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(responseBatchSize);
  const responseIdentity = useMemo(
    () => responses.map((response) => response.id).join(","),
    [responses]
  );
  const visibleResponses = getVisibleResponseBatch(responses, visibleCount);

  useEffect(() => {
    setVisibleCount(responseBatchSize);
  }, [responseIdentity]);

  useEffect(() => {
    writeContactPrivacyMode(hideContacts);
  }, [hideContacts]);

  async function handleDelete(response: SurveyResponse) {
    const confirmed = window.confirm(
      `Переместить анкету от ${response.surveyDate} в корзину? Её можно будет восстановить.`
    );
    if (!confirmed) {
      return;
    }

    setStatus(null);
    try {
      await deleteResponse(response.id);
      setStatus("Анкета перемещена в корзину.");
      onDeleted();
    } catch {
      setStatus("Не удалось переместить анкету в корзину.");
    }
  }

  return (
    <section className="table-panel" aria-label="Анкеты">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Данные</p>
          <h2>Анкеты в базе: {responses.length}</h2>
          {fakeCount > 0 ? <p className="table-note">Фейковых в текущем срезе: {fakeCount}</p> : null}
        </div>
        <button
          aria-pressed={!hideContacts}
          className="ghost-button"
          onClick={() => setHideContacts((current) => !current)}
          type="button"
        >
          {hideContacts ? <Eye aria-hidden size={18} /> : <EyeOff aria-hidden size={18} />}
          {hideContacts ? "Показать контакты" : "Скрыть контакты"}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Источник</th>
              <th>Пол</th>
              <th>Возраст</th>
              <th>Проживание</th>
              <th>Поиск</th>
              <th>Контакт</th>
              <th>Q7</th>
              <th>Q8</th>
              <th>Q11</th>
              <th>Помощь</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleResponses.map((response) => (
              <tr className={response.isFake ? "fake-row" : ""} key={response.id}>
                <td data-label="Дата">{response.surveyDate}</td>
                <td data-label="Тип">
                  {response.isFake ? (
                    <span className="fake-badge">Фейковая</span>
                  ) : (
                    <span className="real-badge">Реальная</span>
                  )}
                </td>
                <td data-label="Источник">
                  <span className={`source-badge source-${response.source}`}>
                    {responseSourceLabels[response.source]}
                  </span>
                </td>
                <td data-label="Пол">{genderLabels[response.gender]}</td>
                <td data-label="Возраст">{ageGroupLabels[response.ageGroup]}</td>
                <td data-label="Проживание">{residenceLabels[response.residence]}</td>
                <td data-label="Поиск">{formatResearchInfo(response)}</td>
                <td data-label="Контакт">{renderContactInfo(response, hideContacts)}</td>
                <td data-label="Q7">{answerLabels[response.q7]}</td>
                <td data-label="Q8">{answerLabels[response.q8]}</td>
                <td data-label="Q11">
                  {answerLabels[response.q11]}
                  {response.q11WarDetails ? `, ${response.q11WarDetails}` : ""}
                </td>
                <td data-label="Помощь">{answerLabels[response.q16]}</td>
                <td data-label="Действия">
                  <div className="row-actions">
                    <button aria-label="Редактировать" onClick={() => onEdit(response)} type="button">
                      <Pencil aria-hidden size={18} />
                    </button>
                    <button aria-label="Удалить" onClick={() => handleDelete(response)} type="button">
                      <Trash2 aria-hidden size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {responses.length === 0 ? (
              <tr>
                <td className="empty-table-cell" colSpan={13}>
                  По текущим фильтрам анкет нет.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {status ? <p className="data-status table-status" role="status">{status}</p> : null}
      {visibleResponses.length < responses.length ? (
        <div className="table-pagination">
          <span>
            Показано {visibleResponses.length} из {responses.length}
          </span>
          <button
            className="ghost-button"
            onClick={() =>
              setVisibleCount((current) =>
                getNextVisibleResponseCount(current, responses.length)
              )
            }
            type="button"
          >
            Показать ещё
          </button>
        </div>
      ) : null}
    </section>
  );
}

function formatResearchInfo(response: SurveyResponse): string {
  const period = formatResearchPeriod(response);
  const parts = [response.researchTerritory, period, response.freeText].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function renderContactInfo(response: SurveyResponse, hidden: boolean): ReactNode {
  if (!response.contactName && !response.contactPhone) {
    return "—";
  }

  if (hidden) {
    return <span className="contact-masked">Скрыто</span>;
  }

  return (
    <span className="contact-cell">
      {response.contactName ? <span>{response.contactName}</span> : null}
      {response.contactPhone ? (
        <a href={`tel:${normalizePhoneHref(response.contactPhone)}`}>{response.contactPhone}</a>
      ) : null}
    </span>
  );
}

function normalizePhoneHref(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

const contactPrivacyStorageKey = "rodoved-hide-contacts-v1";

function readContactPrivacyMode(): boolean {
  try {
    const stored = window.localStorage.getItem(contactPrivacyStorageKey);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function writeContactPrivacyMode(value: boolean): void {
  try {
    window.localStorage.setItem(contactPrivacyStorageKey, String(value));
  } catch {
    // The safe default remains active when browser storage is unavailable.
  }
}

function formatResearchPeriod(response: SurveyResponse): string | undefined {
  if (response.researchPeriodStart && response.researchPeriodEnd) {
    return `${response.researchPeriodStart}-${response.researchPeriodEnd}`;
  }

  if (response.researchPeriodStart) {
    return `с ${response.researchPeriodStart}`;
  }

  if (response.researchPeriodEnd) {
    return `до ${response.researchPeriodEnd}`;
  }

  return undefined;
}
