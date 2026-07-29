import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  ageGroupLabels,
  ageGroupValues,
  answerLabels,
  answerQuestions,
  answerValues,
  genderLabels,
  genderValues,
  isValidContactPhone,
  residenceLabels,
  residenceValues,
  warDetailQuickValues,
  type AnswerQuestionId,
  type AnswerValue,
  type SurveyResponseInput
} from "@snz-rodoved/shared";
import { submitOnlineSurvey } from "../api/client";
import { SegmentedControl } from "./SegmentedControl";

interface OnlineSurveyPageProps {
  authenticated: boolean;
  onHome: () => void;
  onWorkspace: () => void;
}

export function OnlineSurveyPage({ authenticated, onHome, onWorkspace }: OnlineSurveyPageProps) {
  const [form, setForm] = useState<SurveyResponseInput>(createDefaultOnlineSurveyValue());
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(questionId: AnswerQuestionId, value: AnswerValue) {
    setForm((current) => ({
      ...current,
      [questionId]: value,
      ...(questionId === "q16" && value !== "yes"
        ? { contactName: undefined, contactPhone: undefined }
        : {})
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (form.q16 === "yes" && form.contactPhone && !isValidContactPhone(form.contactPhone)) {
      setStatus("Укажите номер телефона: от 10 до 15 цифр.");
      return;
    }

    if (form.consentToDataProcessing !== true) {
      setStatus("Для отправки нужно согласие на обработку ответов.");
      return;
    }

    setSaving(true);
    try {
      await submitOnlineSurvey({
        ...form,
        researchPeriodStart: parseOptionalYear(periodStart),
        researchPeriodEnd: parseOptionalYear(periodEnd)
      });
      setSubmitted(true);
      setStatus("Спасибо, анкета сохранена.");
    } catch {
      setStatus("Не удалось сохранить анкету. Проверьте поля и попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(createDefaultOnlineSurveyValue());
    setPeriodStart("");
    setPeriodEnd("");
    setStatus(null);
    setSubmitted(false);
  }

  return (
    <main className="public-survey-page">
      <header className="public-survey-header">
        <button className="brand-link" type="button" onClick={onHome}>
          Родовед
        </button>
        {authenticated ? (
          <button className="ghost-button" type="button" onClick={onWorkspace}>
            Рабочая зона
          </button>
        ) : null}
      </header>

      <section className="online-survey-panel" aria-label="Онлайн-анкета">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Онлайн-опрос</p>
            <h1>Анкета</h1>
          </div>
        </div>

        {submitted ? (
          <div className="online-survey-success">
            <h2>Спасибо</h2>
            <p>Анкета сохранена.</p>
            <div className="header-actions">
              <button className="primary-button" type="button" onClick={resetForm}>
                Заполнить ещё одну
              </button>
              <button className="ghost-button" type="button" onClick={onHome}>
                На главную
              </button>
            </div>
          </div>
        ) : (
          <form className="response-form online-survey-form" onSubmit={handleSubmit}>
            <div className="form-top-grid">
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

            <div className="online-extra-grid">
              <label>
                Исследуемая территория
                <input
                  maxLength={180}
                  placeholder="Снежинск, Челябинская область"
                  value={form.researchTerritory ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, researchTerritory: event.target.value || undefined })
                  }
                />
              </label>
              <fieldset className="period-fields">
                <legend>Исследуемый период</legend>
                <div>
                  <label>
                    С
                    <input
                      inputMode="numeric"
                      max={2100}
                      min={1500}
                      placeholder="1850"
                      type="number"
                      value={periodStart}
                      onChange={(event) => setPeriodStart(event.target.value)}
                    />
                  </label>
                  <label>
                    По
                    <input
                      inputMode="numeric"
                      max={2100}
                      min={1500}
                      placeholder="1945"
                      type="number"
                      value={periodEnd}
                      onChange={(event) => setPeriodEnd(event.target.value)}
                    />
                  </label>
                </div>
              </fieldset>
              <label className="online-free-text">
                Свободный текст
                <textarea
                  maxLength={1500}
                  placeholder="Дополнительные фамилии, населённые пункты, уточнения"
                  rows={5}
                  value={form.freeText ?? ""}
                  onChange={(event) => setForm({ ...form, freeText: event.target.value || undefined })}
                />
              </label>
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
                        <select
                          value={form.q11WarDetails ?? ""}
                          onChange={(event) =>
                            setForm({ ...form, q11WarDetails: event.target.value })
                          }
                        >
                          {warDetailQuickValues.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                  {question.id === "q16" && form.q16 === "yes" ? (
                    <div className="contact-request-grid">
                      <p className="section-note">Контакты нужны только для связи по вашему запросу.</p>
                      <label>
                        Имя
                        <input
                          autoComplete="name"
                          maxLength={120}
                          required
                          value={form.contactName ?? ""}
                          onChange={(event) =>
                            setForm({ ...form, contactName: event.target.value || undefined })
                          }
                        />
                      </label>
                      <label>
                        Номер телефона
                        <input
                          autoComplete="tel"
                          inputMode="tel"
                          maxLength={40}
                          required
                          type="tel"
                          value={form.contactPhone ?? ""}
                          onChange={(event) =>
                            setForm({ ...form, contactPhone: event.target.value || undefined })
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <label className="consent-checkbox">
              <input
                checked={form.consentToDataProcessing === true}
                required
                type="checkbox"
                onChange={(event) =>
                  setForm({ ...form, consentToDataProcessing: event.target.checked })
                }
              />
              <span>Согласие на обработку ответов и контактных данных для работы с анкетой</span>
            </label>

            <div className="form-actions">
              {status ? <p className="form-status">{status}</p> : null}
              <button className="primary-button" disabled={saving} type="submit">
                <Send aria-hidden size={20} />
                {saving ? "Отправка..." : "Отправить анкету"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function createDefaultOnlineSurveyValue(): SurveyResponseInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    surveyDate: today,
    source: "online",
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

function parseOptionalYear(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
