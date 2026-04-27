import { z } from "zod";

export const genderValues = ["male", "female"] as const;
export const ageGroupValues = ["under_18", "18_40", "over_40"] as const;
export const residenceValues = ["snezhinsk", "other"] as const;
export const answerValues = ["yes", "no", "unknown"] as const;

export type Gender = (typeof genderValues)[number];
export type AgeGroup = (typeof ageGroupValues)[number];
export type Residence = (typeof residenceValues)[number];
export type AnswerValue = (typeof answerValues)[number];

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

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD");

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

export const surveyResponseInputSchema = z.object({
  surveyDate: dateSchema,
  gender: genderSchema,
  ageGroup: ageGroupSchema,
  residence: residenceSchema,
  ...answerFieldSchemas,
  q11WarDetails: z
    .string()
    .trim()
    .max(120, "Поле про войну должно быть короче 120 символов")
    .optional()
    .nullable()
    .transform((value) => value || undefined)
});

export const partialSurveyResponseInputSchema = surveyResponseInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Нет полей для обновления");

export const surveyFiltersSchema = z.object({
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  gender: z.array(genderSchema).optional(),
  ageGroup: z.array(ageGroupSchema).optional(),
  residence: z.array(residenceSchema).optional(),
  answerFilters: z.record(answerQuestionIdSchema, z.array(answerSchema)).optional()
});

export type SurveyResponseInput = z.infer<typeof surveyResponseInputSchema>;
export type PartialSurveyResponseInput = z.infer<typeof partialSurveyResponseInputSchema>;
export type SurveyFilters = z.infer<typeof surveyFiltersSchema>;

export interface SurveyResponse extends SurveyResponseInput {
  id: string;
  isFake: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountItem<TValue extends string = string> {
  value: TValue;
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  total: number;
  byDate: Array<{ date: string; count: number }>;
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
  "Иная война",
  "—"
] as const;

export function createEmptyAnswerRecord(): Record<AnswerValue, number> {
  return {
    yes: 0,
    no: 0,
    unknown: 0
  };
}
