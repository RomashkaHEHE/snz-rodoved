import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import {
  answerQuestionIds,
  parseSurveyDateFromPdfFileName,
  partialSurveyResponseInputSchema,
  surveyPdfFileUploadSchema,
  surveyResponseInputSchema,
  type AnswerQuestionId,
  type AnswerValue,
  type PartialSurveyResponseInput,
  type ResponseSource,
  type SurveyFilters,
  type SurveyPdfFile,
  type SurveyResponse,
  type SurveyResponseInput
} from "@snz-rodoved/shared";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import {
  responses,
  surveyPdfFiles,
  type NewResponseRow,
  type NewSurveyPdfFileRow,
  type ResponseRow,
  type SurveyPdfFileRow
} from "./schema.js";

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

  create(
    input: SurveyResponseInput,
    options: { isFake?: boolean; source?: ResponseSource } = {}
  ): SurveyResponse {
    const parsed = surveyResponseInputSchema.parse(input);
    const now = new Date().toISOString();
    const row: NewResponseRow = {
      ...parsed,
      id: randomUUID(),
      source: options.source ?? parsed.source ?? "paper",
      q11WarDetails: parsed.q11WarDetails ?? null,
      researchTerritory: parsed.researchTerritory ?? null,
      researchPeriodStart: parsed.researchPeriodStart ?? null,
      researchPeriodEnd: parsed.researchPeriodEnd ?? null,
      freeText: parsed.freeText ?? null,
      contactName: parsed.q16 === "yes" ? (parsed.contactName ?? null) : null,
      contactPhone: parsed.q16 === "yes" ? (parsed.contactPhone ?? null) : null,
      contactStatus: "new",
      contactNote: null,
      isFake: options.isFake ? "true" : "false",
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

    if ("researchTerritory" in parsed) {
      updateData.researchTerritory = parsed.researchTerritory ?? null;
    }

    if ("researchPeriodStart" in parsed) {
      updateData.researchPeriodStart = parsed.researchPeriodStart ?? null;
    }

    if ("researchPeriodEnd" in parsed) {
      updateData.researchPeriodEnd = parsed.researchPeriodEnd ?? null;
    }

    if ("freeText" in parsed) {
      updateData.freeText = parsed.freeText ?? null;
    }

    if ("contactName" in parsed) {
      updateData.contactName = parsed.contactName ?? null;
    }

    if ("contactPhone" in parsed) {
      updateData.contactPhone = parsed.contactPhone ?? null;
    }

    if ("contactStatus" in parsed) {
      updateData.contactStatus = parsed.contactStatus ?? "new";
    }

    if ("contactNote" in parsed) {
      updateData.contactNote = parsed.contactNote ?? null;
    }

    if (parsed.q16 && parsed.q16 !== "yes") {
      updateData.contactName = null;
      updateData.contactPhone = null;
      updateData.contactStatus = "new";
      updateData.contactNote = null;
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

  deleteFake(): number {
    const result = this.db.delete(responses).where(eq(responses.isFake, "true")).run();
    return result.changes;
  }
}

export interface CreateSurveyPdfFileInput {
  displayName: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
}

export class SurveyPdfFileRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: CreateSurveyPdfFileInput): SurveyPdfFile {
    const parsed = surveyPdfFileUploadSchema.parse({ displayName: input.displayName });
    const now = new Date().toISOString();
    const row: NewSurveyPdfFileRow = {
      id: randomUUID(),
      surveyDate: parseSurveyDateFromPdfFileName(parsed.displayName),
      displayName: parsed.displayName,
      originalFileName: input.originalFileName,
      storedFileName: input.storedFileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      createdAt: now,
      updatedAt: now
    };

    const inserted = this.db.insert(surveyPdfFiles).values(row).returning().get();
    return toSurveyPdfFile(inserted);
  }

  list(filters: Pick<SurveyFilters, "dateFrom" | "dateTo"> = {}): SurveyPdfFile[] {
    const conditions = buildPdfFileFilterConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1 = 1`;

    return this.db
      .select()
      .from(surveyPdfFiles)
      .where(whereClause)
      .orderBy(desc(surveyPdfFiles.surveyDate), desc(surveyPdfFiles.createdAt))
      .all()
      .map(toSurveyPdfFile);
  }

  get(id: string): SurveyPdfFileRow | null {
    return this.db.select().from(surveyPdfFiles).where(eq(surveyPdfFiles.id, id)).get() ?? null;
  }

  delete(id: string): SurveyPdfFileRow | null {
    const row = this.get(id);
    if (!row) {
      return null;
    }

    this.db.delete(surveyPdfFiles).where(eq(surveyPdfFiles.id, id)).run();
    return row;
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

  if (filters.source?.length) {
    conditions.push(inArray(responses.source, filters.source));
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

  if (filters.helpOnly) {
    conditions.push(eq(responses.q16, "yes"));
  }

  if (filters.contactOnly) {
    conditions.push(sql`(coalesce(${responses.contactName}, '') <> '' OR coalesce(${responses.contactPhone}, '') <> '')`);
  }

  if (filters.contactStatus?.length) {
    const contactStatusCondition = and(
      eq(responses.q16, "yes"),
      inArray(responses.contactStatus, filters.contactStatus)
    );
    if (contactStatusCondition) {
      conditions.push(contactStatusCondition);
    }
  }

  const searchQuery = filters.query?.trim();
  if (searchQuery) {
    const pattern = `%${searchQuery}%`;
    conditions.push(sql`(
      coalesce(${responses.researchTerritory}, '') LIKE ${pattern}
      OR coalesce(${responses.freeText}, '') LIKE ${pattern}
      OR coalesce(${responses.contactName}, '') LIKE ${pattern}
      OR coalesce(${responses.contactPhone}, '') LIKE ${pattern}
      OR coalesce(${responses.q11WarDetails}, '') LIKE ${pattern}
    )`);
  }

  for (const questionId of answerQuestionIds) {
    const allowedAnswers = filters.answerFilters?.[questionId];
    if (allowedAnswers?.length) {
      conditions.push(inArray(answerColumns[questionId], allowedAnswers as AnswerValue[]));
    }
  }

  return conditions;
}

function buildPdfFileFilterConditions(filters: Pick<SurveyFilters, "dateFrom" | "dateTo">): SQL[] {
  const conditions: SQL[] = [];

  if (filters.dateFrom) {
    conditions.push(gte(surveyPdfFiles.surveyDate, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(surveyPdfFiles.surveyDate, filters.dateTo));
  }

  return conditions;
}

function toSurveyResponse(row: ResponseRow): SurveyResponse {
  return {
    ...row,
    source: row.source ?? "paper",
    isFake: row.isFake === "true",
    q11WarDetails: row.q11WarDetails ?? undefined,
    researchTerritory: row.researchTerritory ?? undefined,
    researchPeriodStart: row.researchPeriodStart ?? undefined,
    researchPeriodEnd: row.researchPeriodEnd ?? undefined,
    freeText: row.freeText ?? undefined,
    contactName: row.contactName ?? undefined,
    contactPhone: row.contactPhone ?? undefined,
    contactStatus: row.contactStatus ?? "new",
    contactNote: row.contactNote ?? undefined
  };
}

function toSurveyPdfFile(row: SurveyPdfFileRow): SurveyPdfFile {
  return {
    id: row.id,
    surveyDate: row.surveyDate,
    displayName: row.displayName,
    originalFileName: row.originalFileName,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
