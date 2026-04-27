import { Save, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ageGroupLabels,
  ageGroupValues,
  answerLabels,
  answerQuestions,
  answerValues,
  genderLabels,
  genderValues,
  residenceLabels,
  residenceValues,
  warDetailQuickValues,
  type AnswerQuestionId,
  type AnswerValue,
  type SurveyResponse,
  type SurveyResponseInput
} from "@snz-rodoved/shared";
import { createResponse, updateResponse } from "../api/client";
import { SegmentedControl } from "./SegmentedControl";

interface ResponseFormProps {
  editing: SurveyResponse | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}

export function ResponseForm({ editing, onSaved, onCancelEdit }: ResponseFormProps) {
  const initialValue = useMemo(() => toFormValue(editing), [editing]);
  const [form, setForm] = useState<SurveyResponseInput>(initialValue);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialValue);
    setStatus(null);
  }, [initialValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      if (editing) {
        await updateResponse(editing.id, form);
        setStatus("Анкета обновлена.");
      } else {
        await createResponse(form);
        setForm(createDefaultFormValue());
        setStatus("Анкета сохранена.");
      }
      onSaved();
    } catch {
      setStatus("Не удалось сохранить анкету. Проверьте заполнение полей.");
    } finally {
      setSaving(false);
    }
  }

  function setAnswer(questionId: AnswerQuestionId, value: AnswerValue) {
    setForm((current) => ({
      ...current,
      [questionId]: value
    }));
  }

  return (
    <section className="entry-panel" aria-label="Форма анкеты">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Ввод</p>
          <h2>{editing ? "Редактирование анкеты" : "Новая анкета"}</h2>
        </div>
        {editing ? (
          <button className="ghost-button" type="button" onClick={onCancelEdit}>
            <X aria-hidden size={18} />
            Отменить
          </button>
        ) : null}
      </div>
      <form className="response-form" onSubmit={handleSubmit}>
        <div className="form-top-grid">
          <label>
            Дата
            <input
              required
              type="date"
              value={form.surveyDate}
              onChange={(event) => setForm({ ...form, surveyDate: event.target.value })}
            />
          </label>
          <SegmentedControl
            label="1. Пол"
            options={genderValues.map((value) => ({ value, label: genderLabels[value] }))}
            value={form.gender}
            onChange={(gender) => setForm({ ...form, gender })}
          />
          <SegmentedControl
            label="2. Возраст"
            options={ageGroupValues.map((value) => ({ value, label: ageGroupLabels[value] }))}
            value={form.ageGroup}
            onChange={(ageGroup) => setForm({ ...form, ageGroup })}
          />
          <SegmentedControl
            label="3. Место проживания"
            options={residenceValues.map((value) => ({ value, label: residenceLabels[value] }))}
            value={form.residence}
            onChange={(residence) => setForm({ ...form, residence })}
          />
        </div>

        <div className="question-list">
          {answerQuestions.map((question) => (
            <div className="question-row" key={question.id}>
              <SegmentedControl
                compact
                label={`${question.number}. ${question.label}`}
                options={answerValues.map((value) => ({ value, label: answerLabels[value] }))}
                value={form[question.id]}
                onChange={(value) => setAnswer(question.id, value)}
              />
              {question.id === "q11" ? (
                <div className="war-details">
                  <label>
                    Если да, какая война
                    <input
                      list="war-detail-values"
                      placeholder="ВОв, I Мировая, иная или —"
                      value={form.q11WarDetails ?? ""}
                      onChange={(event) => setForm({ ...form, q11WarDetails: event.target.value })}
                    />
                  </label>
                  <datalist id="war-detail-values">
                    {warDetailQuickValues.map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {status ? <p className="form-status">{status}</p> : null}
        <button className="primary-button" disabled={saving} type="submit">
          <Save aria-hidden size={20} />
          {saving ? "Сохранение..." : editing ? "Сохранить изменения" : "Сохранить анкету"}
        </button>
      </form>
    </section>
  );
}

function createDefaultFormValue(): SurveyResponseInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    surveyDate: today,
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

function toFormValue(editing: SurveyResponse | null): SurveyResponseInput {
  if (!editing) {
    return createDefaultFormValue();
  }

  return {
    surveyDate: editing.surveyDate,
    gender: editing.gender,
    ageGroup: editing.ageGroup,
    residence: editing.residence,
    q4: editing.q4,
    q5: editing.q5,
    q6: editing.q6,
    q7: editing.q7,
    q8: editing.q8,
    q9: editing.q9,
    q10: editing.q10,
    q11: editing.q11,
    q11WarDetails: editing.q11WarDetails ?? "—",
    q12: editing.q12,
    q13: editing.q13,
    q14: editing.q14,
    q15: editing.q15,
    q16: editing.q16
  };
}
