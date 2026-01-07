import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getTransactions: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      type: "expense",
      amount: "150.00",
      description: "Supermercado",
      date: new Date("2026-01-05"),
      categoryId: 1,
      categoryName: "Alimentação",
      categoryIcon: "🛒",
      categoryColor: "#22c55e",
      isPaid: true,
      source: "manual",
    },
    {
      id: 2,
      userId: 1,
      type: "income",
      amount: "5000.00",
      description: "Salário",
      date: new Date("2026-01-01"),
      categoryId: 2,
      categoryName: "Salário",
      categoryIcon: "💰",
      categoryColor: "#3b82f6",
      isPaid: true,
      source: "manual",
    },
  ]),
  getMonthlyStats: vi.fn().mockResolvedValue({
    income: 5000,
    expense: 150,
    balance: 4850,
  }),
  getCategoryStats: vi.fn().mockResolvedValue([
    { categoryId: 1, categoryName: "Alimentação", total: "150.00", count: 1 },
  ]),
  createTransaction: vi.fn().mockResolvedValue(3),
  updateTransaction: vi.fn().mockResolvedValue(undefined),
  deleteTransaction: vi.fn().mockResolvedValue(undefined),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Alimentação", type: "expense", icon: "🛒", color: "#22c55e" },
    { id: 2, name: "Salário", type: "income", icon: "💰", color: "#3b82f6" },
  ]),
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

describe("transactions router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists transactions for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.list({
      month: 1,
      year: 2026,
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("description", "Supermercado");
    expect(result[1]).toHaveProperty("description", "Salário");
  });

  it("gets monthly stats for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.getMonthlyStats({
      month: 1,
      year: 2026,
    });

    expect(result).toEqual({
      income: 5000,
      expense: 150,
      balance: 4850,
    });
  });

  it("gets category stats for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.getCategoryStats({
      month: 1,
      year: 2026,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("categoryName", "Alimentação");
    expect(result[0]).toHaveProperty("total", "150.00");
  });

  it("creates a new transaction", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.create({
      type: "expense",
      amount: "50.00",
      description: "Uber",
      date: "2026-01-07",
      categoryId: 1,
      source: "manual",
    });

    expect(result).toHaveProperty("id", 3);
  });

  it("updates an existing transaction", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.update({
      id: 1,
      amount: "175.00",
      description: "Supermercado Extra",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a transaction", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("categories router", () => {
  it("lists categories for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("name", "Alimentação");
    expect(result[1]).toHaveProperty("name", "Salário");
  });
});
