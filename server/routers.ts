import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USER ====================
  user: router({
    updateTheme: protectedProcedure
      .input(z.object({ themeColor: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserTheme(ctx.user.id, input.themeColor);
        return { success: true };
      }),
  }),

  // ==================== FAMILY ====================
  family: router({
    create: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const familyId = await db.createFamily({
          name: input.name,
          ownerId: ctx.user.id,
          inviteCode,
        });
        if (familyId) {
          await db.updateUserFamily(ctx.user.id, familyId);
        }
        return { familyId, inviteCode };
      }),
    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const family = await db.getFamilyByInviteCode(input.inviteCode);
        if (!family) {
          throw new Error("Código de convite inválido");
        }
        await db.updateUserFamily(ctx.user.id, family.id);
        return { familyId: family.id, familyName: family.name };
      }),
    getMembers: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.familyId) return [];
      return db.getFamilyMembers(ctx.user.familyId);
    }),
  }),

  // ==================== CATEGORIES ====================
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCategories(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        icon: z.string().optional(),
        color: z.string().optional(),
        type: z.enum(["income", "expense"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCategory({ ...input, userId: ctx.user.id });
        return { id };
      }),
  }),

  // ==================== BANK ACCOUNTS ====================
  bankAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getBankAccounts(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        bankName: z.string().optional(),
        accountType: z.enum(["checking", "savings", "investment"]).optional(),
        balance: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createBankAccount({ ...input, userId: ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        bankName: z.string().optional(),
        balance: z.string().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBankAccount(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBankAccount(input.id);
        return { success: true };
      }),
  }),

  // ==================== CREDIT CARDS ====================
  creditCards: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCreditCards(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        lastFourDigits: z.string().optional(),
        brand: z.string().optional(),
        creditLimit: z.string().optional(),
        closingDay: z.number().optional(),
        dueDay: z.number().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCreditCard({ ...input, userId: ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        creditLimit: z.string().optional(),
        currentBalance: z.string().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCreditCard(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCreditCard(input.id);
        return { success: true };
      }),
  }),

  // ==================== TRANSACTIONS ====================
  transactions: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        type: z.enum(["income", "expense", "transfer"]).optional(),
        categoryId: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getTransactions(ctx.user.id, input);
      }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense", "transfer"]),
        amount: z.string(),
        description: z.string().optional(),
        date: z.string(),
        categoryId: z.number().optional(),
        bankAccountId: z.number().optional(),
        creditCardId: z.number().optional(),
        isPaid: z.boolean().optional(),
        isRecurring: z.boolean().optional(),
        recurringFrequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
        notes: z.string().optional(),
        source: z.enum(["manual", "whatsapp", "import"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTransaction({
          ...input,
          userId: ctx.user.id,
          date: new Date(input.date),
        });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["income", "expense", "transfer"]).optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        categoryId: z.number().optional(),
        isPaid: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, date, ...data } = input;
        await db.updateTransaction(id, {
          ...data,
          ...(date && { date: new Date(date) }),
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTransaction(input.id);
        return { success: true };
      }),
    getMonthlyStats: protectedProcedure
      .input(z.object({ month: z.number(), year: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getMonthlyStats(ctx.user.id, input.month, input.year);
      }),
    getCategoryStats: protectedProcedure
      .input(z.object({ month: z.number(), year: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCategoryStats(ctx.user.id, input.month, input.year);
      }),
  }),

  // ==================== BUDGETS ====================
  budgets: router({
    list: protectedProcedure
      .input(z.object({ month: z.number(), year: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getBudgets(ctx.user.id, input.month, input.year);
      }),
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.string(),
        month: z.number(),
        year: z.number(),
        alertThreshold: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createBudget({ ...input, userId: ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string().optional(),
        alertThreshold: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBudget(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBudget(input.id);
        return { success: true };
      }),
  }),

  // ==================== GOALS ====================
  goals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getGoals(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        targetAmount: z.string(),
        currentAmount: z.string().optional(),
        targetDate: z.string().optional(),
        imageUrl: z.string().optional(),
        color: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createGoal({
          ...input,
          userId: ctx.user.id,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        currentAmount: z.string().optional(),
        targetAmount: z.string().optional(),
        status: z.enum(["active", "completed", "paused"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateGoal(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteGoal(input.id);
        return { success: true };
      }),
  }),

  // ==================== DEBTS ====================
  debts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDebts(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        creditor: z.string(),
        description: z.string().optional(),
        totalAmount: z.string(),
        remainingAmount: z.string(),
        interestRate: z.string().optional(),
        totalInstallments: z.number().optional(),
        installmentAmount: z.string().optional(),
        dueDay: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["open", "negotiating", "completed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createDebt({
          ...input,
          userId: ctx.user.id,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        remainingAmount: z.string().optional(),
        paidInstallments: z.number().optional(),
        status: z.enum(["open", "negotiating", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDebt(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDebt(input.id);
        return { success: true };
      }),
    getPayments: protectedProcedure
      .input(z.object({ debtId: z.number() }))
      .query(async ({ input }) => {
        return db.getDebtPayments(input.debtId);
      }),
    addPayment: protectedProcedure
      .input(z.object({
        debtId: z.number(),
        amount: z.string(),
        paymentDate: z.string(),
        installmentNumber: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDebtPayment({
          ...input,
          paymentDate: new Date(input.paymentDate),
        });
        return { id };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getNotifications(ctx.user.id, input?.unreadOnly);
      }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ==================== WHATSAPP SIMULATION ====================
  whatsapp: router({
    processMessage: protectedProcedure
      .input(z.object({
        message: z.string(),
        messageType: z.enum(["text", "audio"]).default("text"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save the message
        const messageId = await db.createWhatsappMessage({
          userId: ctx.user.id,
          messageType: input.messageType,
          content: input.message,
          status: "received",
        });

        // Use LLM to parse the transaction
        const categories = await db.getCategories(ctx.user.id);
        const categoryList = categories.map(c => `${c.name} (${c.type})`).join(", ");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um assistente financeiro que extrai informações de transações de mensagens em português.
              
Categorias disponíveis: ${categoryList}

Extraia as seguintes informações da mensagem:
- tipo: "income" para receita ou "expense" para despesa
- valor: número decimal (ex: 34.50)
- descrição: descrição curta da transação
- categoria: nome da categoria mais apropriada da lista acima
- data: data no formato YYYY-MM-DD (use a data de hoje se não especificada)

Responda APENAS com um JSON válido no formato:
{"tipo": "expense", "valor": 34.50, "descricao": "uber", "categoria": "Transporte", "data": "2026-01-07"}

Se não conseguir extrair as informações, responda com:
{"erro": "mensagem de erro"}`,
            },
            {
              role: "user",
              content: input.message,
            },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === "string" ? messageContent : "";
        let parsedData: any;
        
        try {
          parsedData = JSON.parse(content);
        } catch {
          await db.updateWhatsappMessage(messageId!, {
            status: "failed",
            parsedData: content,
          });
          return {
            success: false,
            error: "Não consegui entender a mensagem. Tente algo como: 'despesa 34 uber' ou 'receita 5000 salário'",
          };
        }

        if (parsedData.erro) {
          await db.updateWhatsappMessage(messageId!, {
            status: "failed",
            parsedData: JSON.stringify(parsedData),
          });
          return { success: false, error: parsedData.erro };
        }

        // Find category ID
        const category = categories.find(
          c => c.name.toLowerCase() === parsedData.categoria?.toLowerCase()
        );

        // Create the transaction
        const transactionId = await db.createTransaction({
          userId: ctx.user.id,
          type: parsedData.tipo,
          amount: String(parsedData.valor),
          description: parsedData.descricao,
          date: new Date(parsedData.data),
          categoryId: category?.id,
          source: "whatsapp",
          isPaid: true,
        });

        await db.updateWhatsappMessage(messageId!, {
          status: "processed",
          parsedData: JSON.stringify(parsedData),
          transactionId,
        });

        return {
          success: true,
          transaction: {
            id: transactionId,
            type: parsedData.tipo,
            amount: parsedData.valor,
            description: parsedData.descricao,
            category: parsedData.categoria,
            date: parsedData.data,
          },
        };
      }),
  }),

  // ==================== AI INSIGHTS ====================
  insights: router({
    generate: protectedProcedure
      .input(z.object({ month: z.number(), year: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const stats = await db.getMonthlyStats(ctx.user.id, input.month, input.year);
        const categoryStats = await db.getCategoryStats(ctx.user.id, input.month, input.year);
        const transactions = await db.getTransactions(ctx.user.id, {
          startDate: `${input.year}-${String(input.month).padStart(2, "0")}-01`,
          endDate: `${input.year}-${String(input.month).padStart(2, "0")}-31`,
        });

        const transactionSummary = categoryStats.map(c => 
          `${c.categoryName}: R$ ${parseFloat(c.total || "0").toFixed(2)} (${c.count} transações)`
        ).join("\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um consultor financeiro pessoal especializado em análise de gastos e economia.
              
Analise os dados financeiros do usuário e forneça:
1. Um resumo geral da saúde financeira
2. 3 insights específicos sobre padrões de gastos
3. 3 sugestões práticas de economia
4. Uma previsão para o próximo mês

Seja direto, use linguagem simples e amigável em português brasileiro.
Formate a resposta em markdown com seções claras.`,
            },
            {
              role: "user",
              content: `Dados financeiros do mês ${input.month}/${input.year}:

Receitas: R$ ${stats.income.toFixed(2)}
Despesas: R$ ${stats.expense.toFixed(2)}
Saldo: R$ ${stats.balance.toFixed(2)}

Gastos por categoria:
${transactionSummary}

Total de transações: ${transactions.length}`,
            },
          ],
        });

        const insightContent = response.choices[0]?.message?.content;
        return {
          insights: typeof insightContent === "string" ? insightContent : "Não foi possível gerar insights.",
          stats,
          categoryStats,
        };
      }),
  }),

  // ==================== IMPORT ====================
  import: router({
    parseCSV: protectedProcedure
      .input(z.object({
        content: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const importId = await db.createImport({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileType: "csv",
          status: "processing",
        });

        // Parse CSV content
        const lines = input.content.split("\n").filter(l => l.trim());
        const transactions: any[] = [];
        
        // Use LLM to categorize transactions
        const categories = await db.getCategories(ctx.user.id);
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(/[,;]/);
          
          if (parts.length >= 2) {
            const description = parts[0]?.trim() || "";
            const amountStr = parts[1]?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0";
            const amount = Math.abs(parseFloat(amountStr));
            const type = parseFloat(amountStr) < 0 ? "expense" : "income";
            const dateStr = parts[2]?.trim() || new Date().toISOString().split("T")[0];

            // Simple category matching
            let categoryId: number | undefined;
            const descLower = description.toLowerCase();
            
            for (const cat of categories) {
              if (descLower.includes(cat.name.toLowerCase())) {
                categoryId = cat.id;
                break;
              }
            }

            transactions.push({
              description,
              amount: String(amount),
              type,
              date: dateStr,
              categoryId,
            });
          }
        }

        // Create transactions
        let imported = 0;
        for (const t of transactions) {
          await db.createTransaction({
            userId: ctx.user.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: new Date(t.date),
            categoryId: t.categoryId,
            source: "import",
            isPaid: true,
          });
          imported++;
        }

        await db.updateImport(importId!, {
          status: "completed",
          totalTransactions: transactions.length,
          importedTransactions: imported,
        });

        return {
          success: true,
          totalTransactions: transactions.length,
          importedTransactions: imported,
        };
      }),
  }),

  // ==================== SEED DEFAULT DATA ====================
  seed: router({
    categories: protectedProcedure.mutation(async () => {
      await db.seedDefaultCategories();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
