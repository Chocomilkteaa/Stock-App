CREATE TABLE `quarterly_cash_flow` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`date` date NOT NULL,
	`operating_cash_flow` decimal(20,0) NOT NULL,
	`investing_cash_flow` decimal(20,0) NOT NULL,
	`financing_cash_flow` decimal(20,0) NOT NULL,
	`exchange_rate_effect` decimal(20,0) NOT NULL,
	`net_cash_change` decimal(20,0) NOT NULL,
	`beginning_cash_balance` decimal(20,0) NOT NULL,
	`ending_cash_balance` decimal(20,0) NOT NULL,
	CONSTRAINT `quarterly_cash_flow_id` PRIMARY KEY(`id`),
	CONSTRAINT `quarterly_cash_flow_idx` UNIQUE(`stock_code`,`date`)
);
--> statement-breakpoint
ALTER TABLE `quarterly_cash_flow` ADD CONSTRAINT `quarterly_cash_flow_stock_code_stocks_code_fk` FOREIGN KEY (`stock_code`) REFERENCES `stocks`(`code`) ON DELETE cascade ON UPDATE cascade;