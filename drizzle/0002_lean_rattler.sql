CREATE TABLE `personal_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`maxWeightKg` float NOT NULL,
	`repsAtMax` int,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	`previousMaxKg` float,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_records_id` PRIMARY KEY(`id`)
);
