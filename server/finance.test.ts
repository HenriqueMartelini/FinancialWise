import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getBudgets: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      categoryId: 1,
      categoryName: "Alimentação",
      categoryIcon: "🛒",
      categoryColor: "#22c55e",
      amount: "1000.00",
      spent: "150.00",
      month: 1,
      year: 2026,
    },
  ]),
  createBudget: vi.fn().mockResolvedValue(2),
  updateBudget: vi.fn().mockResolvedValue(undefined),
  deleteBudget: vi.fn().mockResolvedValue(undefined),
  getGoals: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Viagem para Europa",
      targetAmount: "15000.00",
      currentAmount: "5000.00",
      deadline: new Date("2026-12-31"),
      icon: "✈️",
      color: "#3b82f6",
      status: "active",
    },
  ]),
  createGoal: vi.fn().mockResolvedValue(2),
  updateGoal: vi.fn().mockResolvedValue(undefined),
  deleteGoal: vi.fn().mockResolvedValue(undefined),
  getDebts: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Financiamento Carro",
      totalAmount: "50000.00",
      remainingAmount: "35000.00",
      monthlyPayment: "1500.00",
      interestRate: "1.5",
      dueDay: 10,
      status: "open",
      creditor: "Banco XYZ",
    },
  ]),
  createDebt: vi.fn().mockResolvedValue(2),
  updateDebt: vi.fn().mockResolvedValue(undefined),
  deleteDebt: vi.fn().mockResolvedValue(undefined),
  getBankAccounts: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Conta Corrente",
      bankName: "Nubank",
      accountType: "checking",
      balance: "5000.00",
      color: "#8b5cf6",
    },
  ]),
  createBankAccount: vi.fn().mockResolvedValue(2),
  updateBankAccount: vi.fn().mockResolvedValue(undefined),
  deleteBankAccount: vi.fn().mockResolvedValue(undefined),
  getCreditCards: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Nubank",
      lastFourDigits: "1234",
      creditLimit: "10000.00",
      currentBalance: "2500.00",
      dueDay: 15,
      closingDay: 8,
      color: "#8b5cf6",
    },
  ]),
  createCreditCard: vi.fn().mockResolvedValue(2),
  updateCreditCard: vi.fn().mockResolvedValue(undefined),
  deleteCreditCard: vi.fn().mockResolvedValue(undefined),
  getCategories: vi.fn().mockResolvedValue([]),
  getTransactions: vi.fn().mockResolvedValue([]),
  getMonthlyStats: vi.fn().mockResolvedValue({ income: 0, expense: 0, balance: 0 }),
  getCategoryStats: vi.fn().mockResolvedValue([]),
  createTransaction: vi.fn().mockResolvedValue(1),
  updateTransaction: vi.fn().mockResolvedValue(undefined),
  deleteTransaction: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockResolvedValue(1),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("budgets router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists budgets for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgets.list({
      month: 1,
      year: 2026,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("categoryName", "Alimentação");
    expect(result[0]).toHaveProperty("amount", "1000.00");
    expect(result[0]).toHaveProperty("spent", "150.00");
  });

  it("creates a new budget", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgets.create({
      categoryId: 2,
      amount: "500.00",
      month: 1,
      year: 2026,
    });

    expect(result).toHaveProperty("id", 2);
  });

  it("deletes a budget", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.budgets.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("goals router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists goals for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Viagem para Europa");
    expect(result[0]).toHaveProperty("targetAmount", "15000.00");
    expect(result[0]).toHaveProperty("currentAmount", "5000.00");
  });

  it("creates a new goal", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.create({
      name: "Fundo de Emergência",
      targetAmount: "10000.00",
      deadline: "2026-06-30",
      icon: "🏦",
      color: "#22c55e",
    });

    expect(result).toHaveProperty("id", 2);
  });

  it("updates goal progress", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.update({
      id: 1,
      currentAmount: "7500.00",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a goal", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("debts router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists debts for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debts.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Financiamento Carro");
    expect(result[0]).toHaveProperty("totalAmount", "50000.00");
    expect(result[0]).toHaveProperty("status", "open");
  });

  it("creates a new debt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debts.create({
      name: "Empréstimo Pessoal",
      totalAmount: "5000.00",
      remainingAmount: "5000.00",
      monthlyPayment: "500.00",
      interestRate: "2.0",
      dueDay: 5,
      creditor: "Banco ABC",
    });

    expect(result).toHaveProperty("id", 2);
  });

  it("updates debt status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debts.update({
      id: 1,
      status: "negotiating",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a debt", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debts.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("bankAccounts router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists bank accounts for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bankAccounts.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Conta Corrente");
    expect(result[0]).toHaveProperty("bankName", "Nubank");
    expect(result[0]).toHaveProperty("balance", "5000.00");
  });

  it("creates a new bank account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bankAccounts.create({
      name: "Poupança",
      bankName: "Itaú",
      accountType: "savings",
      balance: "10000.00",
      color: "#f97316",
    });

    expect(result).toHaveProperty("id", 2);
  });

  it("deletes a bank account", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bankAccounts.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("creditCards router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists credit cards for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creditCards.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "Nubank");
    expect(result[0]).toHaveProperty("creditLimit", "10000.00");
  });

  it("creates a new credit card", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creditCards.create({
      name: "Inter",
      lastFourDigits: "5678",
      creditLimit: "5000.00",
      dueDay: 20,
      closingDay: 13,
      color: "#f97316",
    });

    expect(result).toHaveProperty("id", 2);
  });

  it("deletes a credit card", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creditCards.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});
