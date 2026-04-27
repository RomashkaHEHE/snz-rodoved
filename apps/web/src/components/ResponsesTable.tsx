import { Pencil, Trash2 } from "lucide-react";
import {
  ageGroupLabels,
  answerLabels,
  genderLabels,
  residenceLabels,
  type SurveyResponse
} from "@snz-rodoved/shared";
import { deleteResponse } from "../api/client";

interface ResponsesTableProps {
  responses: SurveyResponse[];
  onEdit: (response: SurveyResponse) => void;
  onDeleted: () => void;
}

export function ResponsesTable({ responses, onEdit, onDeleted }: ResponsesTableProps) {
  const fakeCount = responses.filter((response) => response.isFake).length;

  async function handleDelete(response: SurveyResponse) {
    const confirmed = window.confirm(`Удалить анкету от ${response.surveyDate}?`);
    if (!confirmed) {
      return;
    }

    await deleteResponse(response.id);
    onDeleted();
  }

  return (
    <section className="table-panel" aria-label="Анкеты">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Данные</p>
          <h2>Анкеты в базе: {responses.length}</h2>
          {fakeCount > 0 ? <p className="table-note">Фейковых в текущем срезе: {fakeCount}</p> : null}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Пол</th>
              <th>Возраст</th>
              <th>Проживание</th>
              <th>Q7</th>
              <th>Q8</th>
              <th>Q11</th>
              <th>Помощь</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr className={response.isFake ? "fake-row" : ""} key={response.id}>
                <td>{response.surveyDate}</td>
                <td>
                  {response.isFake ? (
                    <span className="fake-badge">Фейковая</span>
                  ) : (
                    <span className="real-badge">Реальная</span>
                  )}
                </td>
                <td>{genderLabels[response.gender]}</td>
                <td>{ageGroupLabels[response.ageGroup]}</td>
                <td>{residenceLabels[response.residence]}</td>
                <td>{answerLabels[response.q7]}</td>
                <td>{answerLabels[response.q8]}</td>
                <td>
                  {answerLabels[response.q11]}
                  {response.q11WarDetails ? `, ${response.q11WarDetails}` : ""}
                </td>
                <td>{answerLabels[response.q16]}</td>
                <td>
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
                <td colSpan={10}>По текущим фильтрам анкет нет.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
