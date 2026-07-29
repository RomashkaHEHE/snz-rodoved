import {
  ageGroupLabels,
  answerLabels,
  answerQuestions,
  genderLabels,
  responseSourceLabels,
  residenceLabels,
  type SurveyResponse
} from "@snz-rodoved/shared";

interface CsvColumn {
  contact?: boolean;
  header: string;
  value: (response: SurveyResponse) => string;
}

const columns: CsvColumn[] = [
  { header: "ID", value: (response) => response.id },
  { header: "Тип строки", value: (response) => (response.isFake ? "Фейковая" : "Реальная") },
  { header: "Источник", value: (response) => responseSourceLabels[response.source] },
  { header: "Дата опроса", value: (response) => response.surveyDate },
  { header: "Пол", value: (response) => genderLabels[response.gender] },
  { header: "Возраст", value: (response) => ageGroupLabels[response.ageGroup] },
  { header: "Место проживания", value: (response) => residenceLabels[response.residence] },
  { header: "Исследуемая территория", value: (response) => response.researchTerritory ?? "" },
  {
    header: "Исследуемый период",
    value: (response) => formatResearchPeriod(response)
  },
  { header: "Свободный текст", value: (response) => response.freeText ?? "" },
  { contact: true, header: "Имя", value: (response) => response.contactName ?? "" },
  { contact: true, header: "Номер телефона", value: (response) => response.contactPhone ?? "" },
  {
    header: "Согласие на обработку данных",
    value: (response) => formatConsent(response.consentToDataProcessing)
  },
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

function formatResearchPeriod(response: SurveyResponse): string {
  if (response.researchPeriodStart && response.researchPeriodEnd) {
    return `${response.researchPeriodStart}-${response.researchPeriodEnd}`;
  }

  return String(response.researchPeriodStart ?? response.researchPeriodEnd ?? "");
}

function formatConsent(value: boolean | undefined): string {
  return value === undefined ? "Не зафиксировано" : value ? "Да" : "Нет";
}

export function buildResponsesCsv(
  responses: SurveyResponse[],
  options: { includeContacts?: boolean } = {}
): string {
  const selectedColumns = options.includeContacts
    ? columns
    : columns.filter((column) => !column.contact);
  const rows = [
    selectedColumns.map((column) => escapeCsvCell(column.header)).join(";"),
    ...responses.map((response) =>
      selectedColumns.map((column) => escapeCsvCell(column.value(response))).join(";")
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
