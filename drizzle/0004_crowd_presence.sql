CREATE TABLE `visitor_appearances` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_key` text NOT NULL,
	`photo` text NOT NULL,
	`preview` text NOT NULL,
	`bio` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visitors_room_seen` ON `visitors` (`room`,`seen`);