CREATE TABLE `notification_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enableEntryDeadline` boolean NOT NULL DEFAULT true,
	`defaultDaysBefore` int NOT NULL DEFAULT 14,
	`enableEmail` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_prefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_prefs_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `performances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rodeoId` int NOT NULL,
	`discipline` enum('barrel_racing','breakaway_roping','team_roping','tie_down_roping','bareback','saddle_bronc','steer_wrestling') NOT NULL,
	`timeSeconds` float,
	`score` float,
	`penaltySeconds` float DEFAULT 0,
	`notes` text,
	`runDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rodeos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`discipline` enum('barrel_racing','breakaway_roping','team_roping','tie_down_roping','bareback','saddle_bronc','steer_wrestling') NOT NULL,
	`rodeotype` enum('jackpot','amateur','professional') NOT NULL DEFAULT 'jackpot',
	`rodeoDate` timestamp NOT NULL,
	`entryDeadline` timestamp NOT NULL,
	`locationName` varchar(255),
	`locationAddress` varchar(512),
	`locationLat` float,
	`locationLng` float,
	`notes` text,
	`isEntered` boolean NOT NULL DEFAULT false,
	`notifyDaysBefore` int NOT NULL DEFAULT 14,
	`notificationSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rodeos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`performanceId` int NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`thumbnailUrl` varchar(1024),
	`filename` varchar(255),
	`mimeType` varchar(64),
	`sizeBytes` int,
	`durationSeconds` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
