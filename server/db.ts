import { eq, and, gte, lte, desc, sql, between } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  categories, InsertCategory,
  bankAccounts, InsertBankAccount,
  creditCards, InsertCreditCard,
  transactions, InsertTransaction,
  budgets, InsertBudget,
  goals, InsertGoal,
  debts, InsertDebt,
  debtPayments, InsertDebtPayment,
  imports, InsertImport,
  notifications, InsertNotification,
  whatsappMessages, InsertWhatsappMessage,
  families, InsertFamily,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserTheme(userId: number, themeColor: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ themeColor }).where(eq(users.id, userId));
}

export async function updateUserFamily(userId: number, familyId: number | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ familyId }).where(eq(users.id, userId));
}

// ==================== FAMILY FUNCTIONS ====================
export async function createFamily(data: InsertFamily) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(families).values(data);
  return result[0].insertId;
}

export async function getFamilyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(families).where(eq(families.id, id)).limit(1);
  return result[0] || null;
}

export async function getFamilyByInviteCode(inviteCode: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(families).where(eq(families.inviteCode, inviteCode)).limit(1);
  return result[0] || null;
}

export async function getFamilyMembers(familyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.familyId, familyId));
}

// ==================== CATEGORY FUNCTIONS ====================
export async function getCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(
    sql`${categories.userId} = ${userId} OR ${categories.isDefault} = true`
  );
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

export async function seedDefaultCategories() {
  const db = await getDb();
  if (!db) return;

  const defaultCategories: InsertCategory[] = [
    { name: "Mercado", icon: "🛒", color: "#22c55e", type: "expense", isDefault: true },
    { name: "Transporte", icon: "🚗", color: "#3b82f6", type: "expense", isDefault: true },
    { name: "Alimentação", icon: "🍽️", color: "#f97316", type: "expense", isDefault: true },
    { name: "Moradia", icon: "🏠", color: "#8b5cf6", type: "expense", isDefault: true },
    { name: "Contas", icon: "💡", color: "#eab308", type: "expense", isDefault: true },
    { name: "Educação", icon: "🎓", color: "#06b6d4", type: "expense", isDefault: true },
    { name: "Saúde", icon: "💊", color: "#ef4444", type: "expense", isDefault: true },
    { name: "Assinaturas", icon: "📺", color: "#ec4899", type: "expense", isDefault: true },
    { name: "Roupas", icon: "👚", color: "#f472b6", type: "expense", isDefault: true },
    { name: "Lazer", icon: "🎮", color: "#a855f7", type: "expense", isDefault: true },
    { name: "Desenvolvimento", icon: "🧠", color: "#14b8a6", type: "expense", isDefault: true },
    { name: "Salário", icon: "💰", color: "#22c55e", type: "income", isDefault: true },
    { name: "Freelance", icon: "💼", color: "#3b82f6", type: "income", isDefault: true },
    { name: "Investimentos", icon: "📈", color: "#8b5cf6", type: "income", isDefault: true },
    { name: "Outros", icon: "📦", color: "#6b7280", type: "expense", isDefault: true },
  ];

  for (const cat of defaultCategories) {
    const existing = await db.select().from(categories)
      .where(and(eq(categories.name, cat.name), eq(categories.isDefault, true)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values(cat);
    }
  }
}

// ==================== BANK ACCOUNT FUNCTIONS ====================
export async function getBankAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
}

export async function createBankAccount(data: InsertBankAccount) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bankAccounts).values(data);
  return result[0].insertId;
}

export async function updateBankAccount(id: number, data: Partial<InsertBankAccount>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id));
}

export async function deleteBankAccount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
}

// ==================== CREDIT CARD FUNCTIONS ====================
export async function getCreditCards(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditCards).where(eq(creditCards.userId, userId));
}

export async function createCreditCard(data: InsertCreditCard) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(creditCards).values(data);
  return result[0].insertId;
}

export async function updateCreditCard(id: number, data: Partial<InsertCreditCard>) {
  const db = await getDb();
  if (!db) return;
  await db.update(creditCards).set(data).where(eq(creditCards.id, id));
}

export async function deleteCreditCard(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(creditCards).where(eq(creditCards.id, id));
}

// ==================== TRANSACTION FUNCTIONS ====================
export async function getTransactions(userId: number, filters?: {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense" | "transfer";
  categoryId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(transactions).where(eq(transactions.userId, userId));
  
  const conditions = [eq(transactions.userId, userId)];
  
  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(transactions.date, new Date(filters.startDate), new Date(filters.endDate)));
  }
  if (filters?.type) {
    conditions.push(eq(transactions.type, filters.type));
  }
  if (filters?.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }

  const result = await db.select().from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date))
    .limit(filters?.limit || 100);

  return result;
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(transactions).values(data);
  return result[0].insertId;
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) return;
  await db.update(transactions).set(data).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transactions).where(eq(transactions.id, id));
}

export async function getMonthlyStats(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return { income: 0, expense: 0, balance: 0 };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const result = await db.select({
    type: transactions.type,
    total: sql<string>`SUM(${transactions.amount})`,
  }).from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      between(transactions.date, startDate, endDate)
    ))
    .groupBy(transactions.type);

  let income = 0;
  let expense = 0;

  for (const row of result) {
    if (row.type === "income") income = parseFloat(row.total || "0");
    if (row.type === "expense") expense = parseFloat(row.total || "0");
  }

  return { income, expense, balance: income - expense };
}

export async function getCategoryStats(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return db.select({
    categoryId: transactions.categoryId,
    categoryName: categories.name,
    categoryIcon: categories.icon,
    categoryColor: categories.color,
    total: sql<string>`SUM(${transactions.amount})`,
    count: sql<number>`COUNT(*)`,
  }).from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, "expense"),
      between(transactions.date, startDate, endDate)
    ))
    .groupBy(transactions.categoryId, categories.name, categories.icon, categories.color)
    .orderBy(desc(sql`SUM(${transactions.amount})`));
}

// ==================== BUDGET FUNCTIONS ====================
export async function getBudgets(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    budget: budgets,
    category: categories,
  }).from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(
      eq(budgets.userId, userId),
      eq(budgets.month, month),
      eq(budgets.year, year)
    ));
}

export async function createBudget(data: InsertBudget) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(budgets).values(data);
  return result[0].insertId;
}

export async function updateBudget(id: number, data: Partial<InsertBudget>) {
  const db = await getDb();
  if (!db) return;
  await db.update(budgets).set(data).where(eq(budgets.id, id));
}

export async function deleteBudget(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(budgets).where(eq(budgets.id, id));
}

// ==================== GOAL FUNCTIONS ====================
export async function getGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
}

export async function createGoal(data: InsertGoal) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(goals).values(data);
  return result[0].insertId;
}

export async function updateGoal(id: number, data: Partial<InsertGoal>) {
  const db = await getDb();
  if (!db) return;
  await db.update(goals).set(data).where(eq(goals.id, id));
}

export async function deleteGoal(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(goals).where(eq(goals.id, id));
}

// ==================== DEBT FUNCTIONS ====================
export async function getDebts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(debts).where(eq(debts.userId, userId)).orderBy(desc(debts.createdAt));
}

export async function createDebt(data: InsertDebt) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(debts).values(data);
  return result[0].insertId;
}

export async function updateDebt(id: number, data: Partial<InsertDebt>) {
  const db = await getDb();
  if (!db) return;
  await db.update(debts).set(data).where(eq(debts.id, id));
}

export async function deleteDebt(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(debts).where(eq(debts.id, id));
}

export async function getDebtPayments(debtId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(debtPayments).where(eq(debtPayments.debtId, debtId)).orderBy(desc(debtPayments.paymentDate));
}

export async function createDebtPayment(data: InsertDebtPayment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(debtPayments).values(data);
  return result[0].insertId;
}

// ==================== NOTIFICATION FUNCTIONS ====================
export async function getNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }
  
  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ==================== WHATSAPP MESSAGE FUNCTIONS ====================
export async function createWhatsappMessage(data: InsertWhatsappMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(whatsappMessages).values(data);
  return result[0].insertId;
}

export async function updateWhatsappMessage(id: number, data: Partial<InsertWhatsappMessage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(whatsappMessages).set(data).where(eq(whatsappMessages.id, id));
}

// ==================== IMPORT FUNCTIONS ====================
export async function createImport(data: InsertImport) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(imports).values(data);
  return result[0].insertId;
}

export async function updateImport(id: number, data: Partial<InsertImport>) {
  const db = await getDb();
  if (!db) return;
  await db.update(imports).set(data).where(eq(imports.id, id));
}

export async function getImports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(imports).where(eq(imports.userId, userId)).orderBy(desc(imports.createdAt));
}
