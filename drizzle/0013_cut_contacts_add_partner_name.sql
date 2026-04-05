-- Session 2: Cut contacts feature, add partnerName to performances
DROP TABLE IF EXISTS `rodeo_contacts`;
DROP TABLE IF EXISTS `contacts`;
ALTER TABLE `performances` ADD COLUMN `partnerName` VARCHAR(128) DEFAULT NULL;
