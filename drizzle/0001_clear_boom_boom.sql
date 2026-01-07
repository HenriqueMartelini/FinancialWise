CREATE TABLE `bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`bankName` varchar(100),
	`accountType` enum('checking','savings','investment') DEFAULT 'checking',
	`balance` decimal(15,2) DEFAULT '0.00',
	`color` varchar(20),
	`icon` varchar(50),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`spent` decimal(15,2) DEFAULT '0.00',
	`alertThreshold` int DEFAULT 80,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50),
	`color` varchar(20),
	`type` enum('income','expense') NOT NULL,
	`userId` int,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`lastFourDigits` varchar(4),
	`brand` varchar(50),
	`creditLimit` decimal(15,2) DEFAULT '0.00',
	`currentBalance` decimal(15,2) DEFAULT '0.00',
	`closingDay` int,
	`dueDay` int,
	`color` varchar(20),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debtId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`paymentDate` date NOT NULL,
	`installmentNumber` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debt_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`creditor` varchar(200) NOT NULL,
	`description` text,
	`totalAmount` decimal(15,2) NOT NULL,
	`remainingAmount` decimal(15,2) NOT NULL,
	`interestRate` decimal(5,2),
	`totalInstallments` int,
	`paidInstallments` int DEFAULT 0,
	`installmentAmount` decimal(15,2),
	`dueDay` int,
	`startDate` date,
	`endDate` date,
	`status` enum('open','negotiating','completed') DEFAULT 'open',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerId` int NOT NULL,
	`inviteCode` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `families_id` PRIMARY KEY(`id`),
	CONSTRAINT `families_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`targetAmount` decimal(15,2) NOT NULL,
	`currentAmount` decimal(15,2) DEFAULT '0.00',
	`targetDate` date,
	`imageUrl` varchar(500),
	`color` varchar(20),
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`status` enum('active','completed','paused') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` enum('ofx','csv','pdf') NOT NULL,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`totalTransactions` int DEFAULT 0,
	`importedTransactions` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('budget_alert','goal_progress','debt_due','insight') NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`isSent` boolean DEFAULT false,
	`relatedId` int,
	`relatedType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`bankAccountId` int,
	`creditCardId` int,
	`type` enum('income','expense','transfer') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500),
	`date` date NOT NULL,
	`isPaid` boolean DEFAULT true,
	`isRecurring` boolean DEFAULT false,
	`recurringFrequency` enum('daily','weekly','monthly','yearly'),
	`notes` text,
	`source` enum('manual','whatsapp','import') DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageType` enum('text','audio') NOT NULL,
	`content` text NOT NULL,
	`parsedData` text,
	`transactionId` int,
	`status` enum('received','processed','failed') DEFAULT 'received',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `familyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `themeColor` varchar(32) DEFAULT 'blue';