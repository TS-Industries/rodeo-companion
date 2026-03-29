CREATE TABLE `horse_care_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`horseId` int NOT NULL,
	`type` enum('vet','dentist','farrier','deworming','vaccination','other') NOT NULL DEFAULT 'vet',
	`title` varchar(255) NOT NULL,
	`notes` text,
	`reminderDate` timestamp NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horse_care_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `horse_feeding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`horseId` int NOT NULL,
	`feedName` varchar(255) NOT NULL,
	`feedType` enum('hay','grain','supplement','mineral','other') NOT NULL DEFAULT 'hay',
	`amount` varchar(128),
	`frequency` varchar(128),
	`notes` text,
	`monthlyCostCents` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horse_feeding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `horse_health_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`horseId` int NOT NULL,
	`type` enum('vet','dentist','farrier','deworming','vaccination','other') NOT NULL DEFAULT 'vet',
	`title` varchar(255) NOT NULL,
	`notes` text,
	`cost` int DEFAULT 0,
	`provider` varchar(255),
	`logDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horse_health_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `horse_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`horseId` int NOT NULL,
	`healthLogId` int,
	`title` varchar(255) NOT NULL,
	`category` enum('vet','dentist','farrier','deworming','vaccination','other') NOT NULL DEFAULT 'vet',
	`amountCents` int NOT NULL DEFAULT 0,
	`s3Key` varchar(512),
	`url` varchar(1024),
	`filename` varchar(255),
	`mimeType` varchar(64),
	`receiptDate` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horse_receipts_id` PRIMARY KEY(`id`)
);
