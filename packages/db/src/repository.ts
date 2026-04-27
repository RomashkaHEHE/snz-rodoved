import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import {
  answerQuestionIds,
  partialSurveyResponseInputSchema,
  surveyResponseInputSchema,
  type AnswerQuestionId,
  type AnswerValue,
  type PartialSurveyResponseInput,
  type SurveyFilters,
  type SurveyResponse,
  type SurveyResponseInput
} from "@snz-rodoved/shared";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { responses, type NewResponseRow, type ResponseRow } from "./schema.js";

type AppDatabase = BetterSQLite3Database<typeof schema>;
type ResponseColumn = (typeof responses)[AnswerQuestionId];

const answerColumns: Record<AnswerQuestionId, ResponseColumn> = {
  q4: responses.q4,
  q5: responses.q5,
  q6: responses.q6,
  q7: responses.q7,
  q8: responses.q8,
  q9: responses.q9,
  q10: responses.q10,
  q11: responses.q11,
  q12: responses.q12,
  q13: responses.q13,
  q14: responses.q14,
  q15: responses.q15,
  q16: responses.q16
};

export class SurveyRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: SurveyResponseInput): SurveyResponse {
    const parsed = surveyResponseInputSchema.parse(input);
    const now = new Date().toISOString();
    const row: NewResponseRow = {
      ...parsed,
      id: randomUUID(),
      q11WarDetails: parsed.q11WarDetails ?? null,
      createdAt: now,
      updatedAt: now
    };

    const inserted = this.db.insert(responses).values(row).returning().get();
    return toSurveyResponse(inserted);
  }

  list(filters: SurveyFilters = {}): SurveyResponse[] {
    const conditions = buildFilterConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1 = 1`;

    return this.db
      .select()
      .from(responses)
      .where(whereClause)
      .orderBy(desc(responses.surveyDate), desc(responses.createdAt))
      .all()
      .map(toSurveyResponse);
  }

  update(id: string, input: PartialSurveyResponseInput): SurveyResponse | null {
    const parsed = partialSurveyResponseInputSchema.parse(input);
    const updateData: Partial<NewResponseRow> = {
      ...parsed,
      updatedAt: new Date().toISOString()
    };

    if ("q11WarDetails" in parsed) {
      updateData.q11WarDetails = parsed.q11WarDetails ?? null;
    }

    const updated = this.db
      .update(responses)
      .set(updateData)
      .where(eq(responses.id, id))
      .returning()
      .get();

    return updated ? toSurveyResponse(updated) : null;
  }

  delete(id: string): boolean {
    const result = this.db.delete(responses).where(eq(responses.id, id)).run();
    return result.changes > 0;
  }
}

function buildFilterConditions(filters: SurveyFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.dateFrom) {
    conditions.push(gte(responses.surveyDate, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(responses.surveyDate, filters.dateTo));
  }

  if (filters.gender?.length) {
    conditions.push(inArray(responses.gender, filters.gender));
  }

  if (filters.ageGroup?.length) {
    conditions.push(inArray(responses.ageGroup, filters.ageGroup));
  }

  if (filters.residence?.length) {
    conditions.push(inArray(responses.residence, filters.residence));
  }

  for (const questionId of answerQuestionIds) {
    const allowedAnswers = filters.answerFilters?.[questionId];
    if (allowedAnswers?.length) {
      conditions.push(inArray(answerColumns[questionId], allowedAnswers as AnswerValue[]));
    }
  }

  return conditions;
}

function toSurveyResponse(row: ResponseRow): SurveyResponse {
  return {
    ...row,
    q11WarDetails: row.q11WarDetails ?? undefined
  };
}
