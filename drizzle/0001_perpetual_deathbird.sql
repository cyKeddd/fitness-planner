CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`instructions` text,
	`workoutType` varchar(64) NOT NULL,
	`muscleGroups` json,
	`equipment` varchar(128),
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`imageUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`exerciseId` int,
	`exerciseName` varchar(255) NOT NULL,
	`setNumber` int NOT NULL,
	`reps` int,
	`weightKg` float,
	`durationSeconds` int,
	`completed` boolean NOT NULL DEFAULT true,
	`notes` text,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` int,
	`gender` varchar(32),
	`heightCm` float,
	`weightKg` float,
	`fitnessLevel` enum('beginner','intermediate','advanced'),
	`bodyType` varchar(64),
	`injuries` text,
	`goals` json,
	`equipment` json,
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `workout_plan_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	CONSTRAINT `workout_plan_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_plan_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planDayId` int NOT NULL,
	`exerciseId` int,
	`exerciseName` varchar(255) NOT NULL,
	`sets` int NOT NULL,
	`reps` varchar(64) NOT NULL,
	`restSeconds` int NOT NULL DEFAULT 60,
	`notes` text,
	`orderIndex` int NOT NULL,
	CONSTRAINT `workout_plan_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`daysPerWeek` int,
	`goalFocus` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planDayId` int,
	`name` varchar(255) NOT NULL,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationSeconds` int,
	`notes` text,
	CONSTRAINT `workout_sessions_id` PRIMARY KEY(`id`)
);
