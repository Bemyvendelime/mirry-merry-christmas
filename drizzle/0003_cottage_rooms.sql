CREATE TABLE `room_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`sender` text NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`op` text NOT NULL,
	`sent` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `room_message_order` ON `room_messages` (`room`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `room_message_op` ON `room_messages` (`sender`,`op`);--> statement-breakpoint
ALTER TABLE `visitors` ADD `room` text DEFAULT 'plaza' NOT NULL;--> statement-breakpoint
ALTER TABLE `visitors` ADD `visit` integer DEFAULT 0 NOT NULL;