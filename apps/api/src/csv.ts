import {
  ageGroupLabels,
  answerLabels,
  answerQuestions,
  genderLabels,
  residenceLabels,
  type SurveyResponse
} from "@snz-rodoved/shared";

interface CsvColumn {
  header: string;
  value: (response: SurveyResponse) => string;
}

const columns: CsvColumn[] = [
  { header: "ID", value: (response) => response.id },
  { header: "Дата опроса", value: (response) => response.surveyDate },
  { header: "Пол", value: (response) => genderLabels[response.gender] },
  { header: "Возраст", value: (response) => ageGroupLabels[response.ageGroup] },
  { header: "Место проживания", value: (response) => residenceLabels[response.residence] },
  ...answerQuestions.flatMap<CsvColumn>((question) => {
    const questionColumn: CsvColumn = {
      header: `${question.number}. ${question.label}`,
      value: (response) => answerLabels[response[question.id]]
    };

    if (question.id !== "q11") {
      return [questionColumn];
    }

    return [
      questionColumn,
      {
        header: "11. Если да, какая война",
        value: (response) => response.q11WarDetails ?? ""
      }
    ];
  }),
  { header: "Создано", value: (response) => response.createdAt },
  { header: "Обновлено", value: (response) => response.updatedAt }
];

export function buildResponsesCsv(responses: SurveyResponse[]): string {
  const rows = [
    columns.map((column) => escapeCsvCell(column.header)).join(";"),
    ...responses.map((response) =>
      columns.map((column) => escapeCsvCell(column.value(response))).join(";")
    )
  ];

  // UTF-8 BOM helps Excel open Russian text correctly on Windows.
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r?\n/g, " ");

  if (/[;"\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}
