CREATE TABLE `quarterly_eps` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`date` date NOT NULL,
	`eps` decimal(10,4) NOT NULL,
	CONSTRAINT `quarterly_eps_id` PRIMARY KEY(`id`),
	CONSTRAINT `quarterly_eps_idx` UNIQUE(`stock_code`,`date`)
);
--> statement-breakpoint
ALTER TABLE `quarterly_eps` ADD CONSTRAINT `quarterly_eps_stock_code_stocks_code_fk` FOREIGN KEY (`stock_code`) REFERENCES `stocks`(`code`) ON DELETE cascade ON UPDATE cascade;