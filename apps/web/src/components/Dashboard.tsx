import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReactNode } from "react";
import {
  answerLabels,
  answerQuestions,
  type AnalyticsSummary,
  type AnswerQuestionId
} from "@snz-rodoved/shared";

interface DashboardProps {
  summary: AnalyticsSummary | null;
}

export function Dashboard({ summary }: DashboardProps) {
  if (!summary) {
    return <section className="dashboard-panel skeleton">Загрузка аналитики...</section>;
  }

  return (
    <section className="dashboard-panel" aria-label="Аналитика">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Аналитика</p>
          <h2>Всего анкет: {summary.total}</h2>
        </div>
      </div>

      <div className="stat-grid">
        <Stat title="Мужчины" value={findCount(summary.byGender, "male")} />
        <Stat title="Женщины" value={findCount(summary.byGender, "female")} />
        <Stat title="Снежинск" value={findCount(summary.byResidence, "snezhinsk")} />
        <Stat title="Нужна помощь" value={summary.answerBreakdown.q16.yes} />
      </div>

      <div className="chart-grid">
        <ChartCard title="Анкеты по датам">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={summary.byDate}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line dataKey="count" name="Анкеты" stroke="#2f6f73" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Возраст">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={summary.byAgeGroup}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Анкеты" fill="#b36b34" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="answer-matrix">
        {answerQuestions.map((question) => (
          <AnswerSummary
            key={question.id}
            questionId={question.id}
            title={`${question.number}. ${question.label}`}
            summary={summary}
          />
        ))}
      </div>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function AnswerSummary({
  questionId,
  title,
  summary
}: {
  questionId: AnswerQuestionId;
  title: string;
  summary: AnalyticsSummary;
}) {
  const item = summary.answerBreakdown[questionId];
  const total = item.yes + item.no + item.unknown || 1;

  return (
    <article className="answer-summary">
      <h3>{title}</h3>
      {(["yes", "no", "unknown"] as const).map((answer) => (
        <div className="answer-bar" key={answer}>
          <span>{answerLabels[answer]}</span>
          <div>
            <i style={{ width: `${(item[answer] / total) * 100}%` }} />
          </div>
          <b>{item[answer]}</b>
        </div>
      ))}
    </article>
  );
}

function findCount<TValue extends string>(
  items: Array<{ value: TValue; count: number }>,
  value: TValue
): number {
  return items.find((item) => item.value === value)?.count ?? 0;
}
