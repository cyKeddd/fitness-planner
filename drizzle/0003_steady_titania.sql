CREATE TABLE `workout_template_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`sets` int NOT NULL,
	`reps` varchar(64) NOT NULL,
	`weightKg` float,
	`restSeconds` int NOT NULL DEFAULT 60,
	`notes` text,
	`orderIndex` int NOT NULL,
	CONSTRAINT `workout_template_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sourceSessionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_templates_id` PRIMARY KEY(`id`)
);
