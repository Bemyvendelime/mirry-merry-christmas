CREATE TABLE `objects` (
	`id` text PRIMARY KEY NOT NULL,
	`plot` text NOT NULL,
	`slot` integer NOT NULL,
	`kind` text NOT NULL,
	`turn` integer NOT NULL,
	`version` integer NOT NULL,
	`op` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`plot` text PRIMARY KEY NOT NULL,
	`keyhash` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`yaw` real NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visitors_seen` ON `visitors` (`seen`);