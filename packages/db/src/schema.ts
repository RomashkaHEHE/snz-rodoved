import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type {
  AgeGroup,
  AnswerValue,
  ContactStatus,
  Gender,
  Residence,
  ResponseSource
} from "@snz-rodoved/shared";

export const responses = sqliteTable(
  "responses",
  {
    id: text("id").primaryKey(),
    surveyDate: text("survey_date").notNull(),
    gender: text("gender").$type<Gender>().notNull(),
    ageGroup: text("age_group").$type<AgeGroup>().notNull(),
    residence: text("residence").$type<Residence>().notNull(),
    source: text("source").$type<ResponseSource>().notNull().default("paper"),
    q4: text("q4").$type<AnswerValue>().notNull(),
    q5: text("q5").$type<AnswerValue>().notNull(),
    q6: text("q6").$type<AnswerValue>().notNull(),
    q7: text("q7").$type<AnswerValue>().notNull(),
    q8: text("q8").$type<AnswerValue>().notNull(),
    q9: text("q9").$type<AnswerValue>().notNull(),
    q10: text("q10").$type<AnswerValue>().notNull(),
    q11: text("q11").$type<AnswerValue>().notNull(),
    q11WarDetails: text("q11_war_details"),
    q12: text("q12").$type<AnswerValue>().notNull(),
    q13: text("q13").$type<AnswerValue>().notNull(),
    q14: text("q14").$type<AnswerValue>().notNull(),
    q15: text("q15").$type<AnswerValue>().notNull(),
    q16: text("q16").$type<AnswerValue>().notNull(),
    researchTerritory: text("research_territory"),
    researchPeriodStart: integer("research_period_start"),
    researchPeriodEnd: integer("research_period_end"),
    freeText: text("free_text"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactStatus: text("contact_status").$type<ContactStatus>().notNull().default("new"),
    contactNote: text("contact_note"),
    isFake: text("is_fake").$type<"true" | "false">().notNull().default("false"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    surveyDateIdx: index("responses_survey_date_idx").on(table.surveyDate),
    genderIdx: index("responses_gender_idx").on(table.gender),
    ageGroupIdx: index("responses_age_group_idx").on(table.ageGroup),
    residenceIdx: index("responses_residence_idx").on(table.residence),
    sourceIdx: index("responses_source_idx").on(table.source),
    contactStatusIdx: index("responses_contact_status_idx").on(table.contactStatus),
    isFakeIdx: index("responses_is_fake_idx").on(table.isFake)
  })
);

export type ResponseRow = typeof responses.$inferSelect;
export type NewResponseRow = typeof responses.$inferInsert;

export const surveyPdfFiles = sqliteTable(
  "survey_pdf_files",
  {
    id: text("id").primaryKey(),
    surveyDate: text("survey_date").notNull(),
    displayName: text("display_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    storedFileName: text("stored_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    surveyDateIdx: index("survey_pdf_files_survey_date_idx").on(table.surveyDate),
    displayNameIdx: uniqueIndex("survey_pdf_files_display_name_idx").on(table.displayName),
    storedFileNameIdx: uniqueIndex("survey_pdf_files_stored_file_name_idx").on(table.storedFileName)
  })
);

export type SurveyPdfFileRow = typeof surveyPdfFiles.$inferSelect;
export type NewSurveyPdfFileRow = typeof surveyPdfFiles.$inferInsert;
