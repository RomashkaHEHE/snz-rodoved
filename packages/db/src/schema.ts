import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { AgeGroup, AnswerValue, Gender, Residence } from "@snz-rodoved/shared";

export const responses = sqliteTable(
  "responses",
  {
    id: text("id").primaryKey(),
    surveyDate: text("survey_date").notNull(),
    gender: text("gender").$type<Gender>().notNull(),
    ageGroup: text("age_group").$type<AgeGroup>().notNull(),
    residence: text("residence").$type<Residence>().notNull(),
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
    isFake: text("is_fake").$type<"true" | "false">().notNull().default("false"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    surveyDateIdx: index("responses_survey_date_idx").on(table.surveyDate),
    genderIdx: index("responses_gender_idx").on(table.gender),
    ageGroupIdx: index("responses_age_group_idx").on(table.ageGroup),
    residenceIdx: index("responses_residence_idx").on(table.residence),
    isFakeIdx: index("responses_is_fake_idx").on(table.isFake)
  })
);

export type ResponseRow = typeof responses.$inferSelect;
export type NewResponseRow = typeof responses.$inferInsert;
