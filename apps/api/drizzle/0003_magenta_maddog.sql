CREATE TABLE `quarterly_capital` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`date` date NOT NULL,
	`capital` decimal(20,0) NOT NULL,
	CONSTRAINT `quarterly_capital_id` PRIMARY KEY(`id`),
	CONSTRAINT `quarterly_capital_idx` UNIQUE(`stock_code`,`date`)
);
--> statement-breakpoint
ALTER TABLE `quarterly_capital` ADD CONSTRAINT `quarterly_capital_stock_code_stocks_code_fk` FOREIGN KEY (`stock_code`) REFERENCES `stocks`(`code`) ON DELETE cascade ON UPDATE cascade;