import { RotateCcw } from "lucide-react";
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
  type AnswerQuestionId,
  type AnswerValue,
  type SurveyFilters
} from "@snz-rodoved/shared";

interface FilterPanelProps {
  filters: SurveyFilters;
  onChange: (filters: SurveyFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <section className="filter-panel" aria-label="Фильтры">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Фильтры</p>
          <h2>Срез данных</h2>
        </div>
        <button className="ghost-button" type="button" onClick={() => onChange({})}>
          <RotateCcw aria-hidden size={18} />
          Сбросить
        </button>
      </div>
      <div className="filter-grid">
        <label>
          Дата с
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
          />
        </label>
        <label>
          Дата по
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
          />
        </label>
        <MultiToggle
          label="Пол"
          values={genderValues}
          selected={filters.gender ?? []}
          labels={genderLabels}
          onChange={(gender) => onChange({ ...filters, gender })}
        />
        <MultiToggle
          label="Возраст"
          values={ageGroupValues}
          selected={filters.ageGroup ?? []}
          labels={ageGroupLabels}
          onChange={(ageGroup) => onChange({ ...filters, ageGroup })}
        />
        <MultiToggle
          label="Проживание"
          values={residenceValues}
          selected={filters.residence ?? []}
          labels={residenceLabels}
          onChange={(residence) => onChange({ ...filters, residence })}
        />
      </div>
      <details className="question-filters">
        <summary>Фильтры по вопросам</summary>
        <div className="question-filter-grid">
          {answerQuestions.map((question) => (
            <label key={question.id}>
              {question.number}. {question.label}
              <select
                value={filters.answerFilters?.[question.id]?.[0] ?? ""}
                onChange={(event) =>
                  onChange(updateAnswerFilter(filters, question.id, event.target.value as AnswerValue | ""))
                }
              >
                <option value="">Все ответы</option>
                {answerValues.map((answer) => (
                  <option value={answer} key={answer}>
                    {answerLabels[answer]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </details>
    </section>
  );
}

interface MultiToggleProps<TValue extends string> {
  label: string;
  values: readonly TValue[];
  selected: TValue[];
  labels: Record<TValue, string>;
  onChange: (values: TValue[] | undefined) => void;
}

function MultiToggle<TValue extends string>({
  label,
  values,
  selected,
  labels,
  onChange
}: MultiToggleProps<TValue>) {
  function toggle(value: TValue) {
    const next = selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value];
    onChange(next.length > 0 ? next : undefined);
  }

  return (
    <fieldset className="multi-toggle">
      <legend>{label}</legend>
      <div>
        {values.map((value) => (
          <button
            aria-pressed={selected.includes(value)}
            className={selected.includes(value) ? "is-selected" : ""}
            key={value}
            onClick={() => toggle(value)}
            type="button"
          >
            {labels[value]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function updateAnswerFilter(
  filters: SurveyFilters,
  questionId: AnswerQuestionId,
  answer: AnswerValue | ""
): SurveyFilters {
  const answerFilters = { ...(filters.answerFilters ?? {}) };

  if (!answer) {
    delete answerFilters[questionId];
  } else {
    answerFilters[questionId] = [answer];
  }

  return {
    ...filters,
    answerFilters: Object.keys(answerFilters).length > 0 ? answerFilters : undefined
  };
}
