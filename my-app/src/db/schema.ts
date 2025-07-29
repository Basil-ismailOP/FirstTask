import { relations } from "drizzle-orm";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull(),
});

export const postsTable = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  content: varchar({ length: 255 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
});

export const userRelation = relations(usersTable, ({ many }) => ({
  post: many(postsTable),
}));

export const postsRelation = relations(postsTable, ({ one }) => ({
  post: one(usersTable, {
    fields: [postsTable.userId],
    references: [usersTable.id],
  }),
}));
