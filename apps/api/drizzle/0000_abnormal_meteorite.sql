CREATE TABLE `daily_prices` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`date` date NOT NULL,
	`open` decimal(10,2) NOT NULL,
	`high` decimal(10,2) NOT NULL,
	`low` decimal(10,2) NOT NULL,
	`close` decimal(10,2) NOT NULL,
	`volume` bigint NOT NULL,
	CONSTRAINT `daily_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_prices_idx` UNIQUE(`stock_code`,`date`)
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `stocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `stocks_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `daily_prices` ADD CONSTRAINT `daily_prices_stock_code_stocks_code_fk` FOREIGN KEY (`stock_code`) REFERENCES `stocks`(`code`) ON DELETE cascade ON UPDATE cascade;