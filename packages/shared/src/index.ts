import { z } from "zod";

export const genderValues = ["male", "female"] as const;
export const ageGroupValues = ["under_18", "18_40", "over_40"] as const;
export const residenceValues = ["snezhinsk", "other"] as const;
export const answerValues = ["yes", "no", "unknown"] as const;
export const responseSourceValues = ["paper", "online"] as const;
export const contactStatusValues = ["new", "in_progress", "done", "no_contact"] as const;

export type Gender = (typeof genderValues)[number];
export type AgeGroup = (typeof ageGroupValues)[number];
export type Residence = (typeof residenceValues)[number];
export type AnswerValue = (typeof answerValues)[number];
export type ResponseSource = (typeof responseSourceValues)[number];
export type ContactStatus = (typeof contactStatusValues)[number];

export const genderLabels: Record<Gender, string> = {
  male: "М",
  female: "Ж"
};

export const ageGroupLabels: Record<AgeGroup, string> = {
  under_18: "до 18 лет",
  "18_40": "18-40 лет",
  over_40: "старше 40 лет"
};

export const residenceLabels: Record<Residence, string> = {
  snezhinsk: "г. Снежинск",
  other: "другое"
};

export const answerLabels: Record<AnswerValue, string> = {
  yes: "Да",
  no: "Нет",
  unknown: "Нет ответа"
};

export const responseSourceLabels: Record<ResponseSource, string> = {
  paper: "Очная",
  online: "Онлайн"
};

export const contactStatusLabels: Record<ContactStatus, string> = {
  new: "Новое",
  in_progress: "В работе",
  done: "Закрыто",
  no_contact: "Не дозвонились"
};

export const answerQuestionIds = [
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16"
] as const;

export type AnswerQuestionId = (typeof answerQuestionIds)[number];

export interface AnswerQuestion {
  id: AnswerQuestionId;
  number: number;
  label: string;
  group: "experience" | "interest" | "help";
}

// Q7 and Q8 intentionally remain separate: the paper survey has both options.
export const answerQuestions: readonly AnswerQuestion[] = [
  {
    id: "q4",
    number: 4,
    label: "Вы рисовали в школе схему своей семьи?",
    group: "experience"
  },
  {
    id: "q5",
    number: 5,
    label: "Вы знаете имя своей прабабушки?",
    group: "experience"
  },
  {
    id: "q6",
    number: 6,
    label: "Вы можете назвать имена всех 4х прадедов?",
    group: "experience"
  },
  {
    id: "q7",
    number: 7,
    label: "Найти предков, живших в 20 в. (СССР)",
    group: "interest"
  },
  {
    id: "q8",
    number: 8,
    label: "Найти предков, живших в 20 в.",
    group: "interest"
  },
  {
    id: "q9",
    number: 9,
    label: "Найти предков, живших в 19 в.",
    group: "interest"
  },
  {
    id: "q10",
    number: 10,
    label: "Найти предков, живших в 18 в.",
    group: "interest"
  },
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
  {
    id: "q13",
    number: 13,
    label: "Найти информацию о других детях предка",
    group: "interest"
  },
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
  {
    id: "q16",
    number: 16,
    label: "Нужна помощь в поисках?",
    group: "help"
  }
];

export const interestQuestionIds = answerQuestions
  .filter((question) => question.group === "interest" || question.group === "help")
  .map((question) => question.id);

export const genderSchema = z.enum(genderValues);
export const ageGroupSchema = z.enum(ageGroupValues);
export const residenceSchema = z.enum(residenceValues);
export const answerSchema = z.enum(answerValues);
export const answerQuestionIdSchema = z.enum(answerQuestionIds);
export const responseSourceSchema = z.enum(responseSourceValues);
export const contactStatusSchema = z.enum(contactStatusValues);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD");

const optionalDateSchema = dateSchema
  .optional()
  .nullable()
  .transform((value) => value ?? undefined);

const answerFieldSchemas = {
  q4: answerSchema,
  q5: answerSchema,
  q6: answerSchema,
  q7: answerSchema,
  q8: answerSchema,
  q9: answerSchema,
  q10: answerSchema,
  q11: answerSchema,
  q12: answerSchema,
  q13: answerSchema,
  q14: answerSchema,
  q15: answerSchema,
  q16: answerSchema
};

const optionalTextField = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((value) => value || undefined);

const optionalResearchYearSchema = z
  .number()
  .int()
  .min(1500, "Год должен быть не раньше 1500")
  .max(2100, "Год должен быть не позже 2100")
  .optional()
  .nullable()
  .transform((value) => value ?? undefined);

const optionalBooleanSchema = z
  .boolean()
  .optional()
  .nullable()
  .transform((value) => value ?? undefined);

export function isValidContactPhone(value: string): boolean {
  const normalized = value.trim();
  if (!/^[+\d\s().-]+$/.test(normalized)) {
    return false;
  }

  const digitCount = normalized.replace(/\D/g, "").length;
  return digitCount >= 10 && digitCount <= 15;
}

const surveyResponseInputObjectSchema = z.object({
  surveyDate: dateSchema,
  gender: genderSchema,
  ageGroup: ageGroupSchema,
  residence: residenceSchema,
  source: responseSourceSchema.optional(),
  ...answerFieldSchemas,
  q11WarDetails: z
    .string()
    .trim()
    .max(120, "Поле про войну должно быть короче 120 символов")
    .optional()
    .nullable()
    .transform((value) => value || undefined),
  researchTerritory: optionalTextField(
    180,
    "Исследуемая территория должна быть короче 180 символов"
  ),
  researchPeriodStart: optionalResearchYearSchema,
  researchPeriodEnd: optionalResearchYearSchema,
  freeText: optionalTextField(1500, "Свободный текст должен быть короче 1500 символов"),
  contactName: optionalTextField(120, "Имя должно быть короче 120 символов"),
  contactPhone: optionalTextField(40, "Номер телефона должен быть короче 40 символов").refine(
    (value) => !value || isValidContactPhone(value),
    "Укажите номер телефона: от 10 до 15 цифр"
  ),
  consentToDataProcessing: optionalBooleanSchema,
  consentToEvents: optionalBooleanSchema
});

function hasValidResearchPeriod(value: {
  researchPeriodStart?: number;
  researchPeriodEnd?: number;
}): boolean {
  if (!value.researchPeriodStart || !value.researchPeriodEnd) {
    return true;
  }

  return value.researchPeriodStart <= value.researchPeriodEnd;
}

export const surveyResponseInputSchema = surveyResponseInputObjectSchema.refine(
  hasValidResearchPeriod,
  {
    message: "Начало исследуемого периода не может быть позже окончания",
    path: ["researchPeriodStart"]
  }
);

export const onlineSurveyResponseInputSchema = surveyResponseInputSchema.refine(
  (value) => value.q16 !== "yes" || (Boolean(value.contactName) && Boolean(value.contactPhone)),
  {
    message: "Для запроса помощи нужно указать имя и телефон",
    path: ["contactPhone"]
  }
).refine(
  (value) => value.consentToDataProcessing === true,
  {
    message: "Нужно согласие на обработку ответов",
    path: ["consentToDataProcessing"]
  }
);

export const partialSurveyResponseInputSchema = surveyResponseInputObjectSchema
  .extend({
    contactStatus: contactStatusSchema.optional(),
    contactNote: optionalTextField(800, "Заметка по обращению должна быть короче 800 символов"),
    contactNextDate: optionalDateSchema
  })
  .partial()
  .refine(hasValidResearchPeriod, {
    message: "Начало исследуемого периода не может быть позже окончания",
    path: ["researchPeriodStart"]
  })
  .refine((value) => Object.keys(value).length > 0, "Нет полей для обновления");

export const surveyFiltersSchema = z.object({
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  source: z.array(responseSourceSchema).optional(),
  gender: z.array(genderSchema).optional(),
  ageGroup: z.array(ageGroupSchema).optional(),
  residence: z.array(residenceSchema).optional(),
  contactStatus: z.array(contactStatusSchema).optional(),
  contactNextFrom: dateSchema.optional(),
  contactNextTo: dateSchema.optional(),
  contactNextMissing: z.boolean().optional(),
  contactOnly: z.boolean().optional(),
  helpOnly: z.boolean().optional(),
  query: optionalTextField(120, "Поисковый запрос должен быть короче 120 символов"),
  answerFilters: z.record(answerQuestionIdSchema, z.array(answerSchema)).optional()
});

export const savedFilterPresetInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Укажите название среза")
    .max(80, "Название среза должно быть короче 80 символов"),
  filters: surveyFiltersSchema
});

export type SurveyResponseInput = z.infer<typeof surveyResponseInputSchema>;
export type PartialSurveyResponseInput = z.infer<typeof partialSurveyResponseInputSchema>;
export type SurveyFilters = z.infer<typeof surveyFiltersSchema>;
export type SavedFilterPresetInput = z.infer<typeof savedFilterPresetInputSchema>;

export interface SavedFilterPreset extends SavedFilterPresetInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse extends Omit<
  SurveyResponseInput,
  "consentToDataProcessing" | "consentToEvents" | "source"
> {
  id: string;
  source: ResponseSource;
  consentToDataProcessing?: boolean;
  consentToEvents?: boolean;
  contactStatus: ContactStatus;
  contactNote?: string;
  contactNextDate?: string;
  isFake: boolean;
  createdAt: string;
  updatedAt: string;
}

export const surveyPdfFileNameSchema = z
  .string()
  .trim()
  .regex(/^\d{8}_анкеты\.pdf$/u, "Имя PDF должно быть в формате ггггммдд_анкеты.pdf")
  .refine((value) => isValidSurveyPdfFileDate(value.slice(0, 8)), {
    message: "Дата в имени PDF должна существовать"
  });

export const surveyPdfFileUploadSchema = z.object({
  displayName: surveyPdfFileNameSchema
});

export type SurveyPdfFileUpload = z.infer<typeof surveyPdfFileUploadSchema>;

export interface SurveyPdfFile {
  id: string;
  surveyDate: string;
  displayName: string;
  originalFileName: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export function parseSurveyDateFromPdfFileName(fileName: string): string {
  const parsed = surveyPdfFileNameSchema.parse(fileName);
  const year = parsed.slice(0, 4);
  const month = parsed.slice(4, 6);
  const day = parsed.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function isValidSurveyPdfFileDate(value: string): boolean {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export interface CountItem<TValue extends string = string> {
  value: TValue;
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  total: number;
  byDate: Array<{ date: string; count: number }>;
  bySource: Array<CountItem<ResponseSource>>;
  byGender: Array<CountItem<Gender>>;
  byAgeGroup: Array<CountItem<AgeGroup>>;
  byResidence: Array<CountItem<Residence>>;
  answerBreakdown: Record<AnswerQuestionId, Record<AnswerValue, number>>;
  interestYesCounts: Array<{ questionId: AnswerQuestionId; label: string; count: number }>;
  warDetails: Array<{ label: string; count: number }>;
}

export const warDetailQuickValues = [
  "Великая Отечественная война",
  "Первая мировая война",
  "Иная",
  "—"
] as const;

export function createEmptyAnswerRecord(): Record<AnswerValue, number> {
  return {
    yes: 0,
    no: 0,
    unknown: 0
  };
}
