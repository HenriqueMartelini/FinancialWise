import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  familyId: int("familyId"),
  themeColor: varchar("themeColor", { length: 32 }).default("blue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== FAMILIES (Multi-user) ====================
export const families = mysqlTable("families", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  inviteCode: varchar("inviteCode", { length: 32 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Family = typeof families.$inferSelect;
export type InsertFamily = typeof families.$inferInsert;

// ==================== CATEGORIES ====================
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  userId: int("userId"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ==================== BANK ACCOUNTS ====================
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  accountType: mysqlEnum("accountType", ["checking", "savings", "investment"]).default("checking"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00"),
  color: varchar("color", { length: 20 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

// ==================== CREDIT CARDS ====================
export const creditCards = mysqlTable("credit_cards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  lastFourDigits: varchar("lastFourDigits", { length: 4 }),
  brand: varchar("brand", { length: 50 }),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }).default("0.00"),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).default("0.00"),
  closingDay: int("closingDay"),
  dueDay: int("dueDay"),
  color: varchar("color", { length: 20 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = typeof creditCards.$inferInsert;

// ==================== TRANSACTIONS ====================
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  bankAccountId: int("bankAccountId"),
  creditCardId: int("creditCardId"),
  type: mysqlEnum("type", ["income", "expense", "transfer"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }),
  date: date("date").notNull(),
  isPaid: boolean("isPaid").default(true),
  isRecurring: boolean("isRecurring").default(false),
  recurringFrequency: mysqlEnum("recurringFrequency", ["daily", "weekly", "monthly", "yearly"]),
  notes: text("notes"),
  source: mysqlEnum("source", ["manual", "whatsapp", "import"]).default("manual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ==================== BUDGETS ====================
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  spent: decimal("spent", { precision: 15, scale: 2 }).default("0.00"),
  alertThreshold: int("alertThreshold").default(80),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// ==================== GOALS (Vision Board) ====================
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0.00"),
  targetDate: date("targetDate"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  color: varchar("color", { length: 20 }),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  status: mysqlEnum("status", ["active", "completed", "paused"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

// ==================== DEBTS ====================
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creditor: varchar("creditor", { length: 200 }).notNull(),
  description: text("description"),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  remainingAmount: decimal("remainingAmount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }),
  totalInstallments: int("totalInstallments"),
  paidInstallments: int("paidInstallments").default(0),
  installmentAmount: decimal("installmentAmount", { precision: 15, scale: 2 }),
  dueDay: int("dueDay"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["open", "negotiating", "completed"]).default("open"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

// ==================== DEBT PAYMENTS ====================
export const debtPayments = mysqlTable("debt_payments", {
  id: int("id").autoincrement().primaryKey(),
  debtId: int("debtId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("paymentDate").notNull(),
  installmentNumber: int("installmentNumber"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = typeof debtPayments.$inferInsert;

// ==================== IMPORTS ====================
export const imports = mysqlTable("imports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["ofx", "csv", "pdf"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  totalTransactions: int("totalTransactions").default(0),
  importedTransactions: int("importedTransactions").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Import = typeof imports.$inferSelect;
export type InsertImport = typeof imports.$inferInsert;

// ==================== NOTIFICATIONS ====================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["budget_alert", "goal_progress", "debt_due", "insight"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  isSent: boolean("isSent").default(false),
  relatedId: int("relatedId"),
  relatedType: varchar("relatedType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==================== WHATSAPP MESSAGES ====================
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messageType: mysqlEnum("messageType", ["text", "audio"]).notNull(),
  content: text("content").notNull(),
  parsedData: text("parsedData"),
  transactionId: int("transactionId"),
  status: mysqlEnum("status", ["received", "processed", "failed"]).default("received"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;
