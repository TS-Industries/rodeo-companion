-- Session 2: Add plan field to users (free/pro tiers)
ALTER TABLE `users` ADD COLUMN `plan` ENUM('free', 'pro') NOT NULL DEFAULT 'free';
