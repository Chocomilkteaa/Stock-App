CREATE TABLE `monthly_revenues` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`date` date NOT NULL,
	`monthly_revenue` decimal(20,2) NOT NULL,
	`last_month_revenue` decimal(20,2) NOT NULL,
	`last_year_monthly_revenue` decimal(20,2) NOT NULL,
	`previous_month_change_percent` decimal(10,2) NOT NULL,
	`last_year_same_month_change_percent` decimal(10,2) NOT NULL,
	`cumulative_revenue` decimal(20,2) NOT NULL,
	`last_year_cumulative_revenue` decimal(20,2) NOT NULL,
	`cumulative_previous_period_change_percent` decimal(10,2) NOT NULL,
	`remarks` varchar(255),
	CONSTRAINT `monthly_revenues_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_revenues_idx` UNIQUE(`stock_code`,`date`)
);
--> statement-breakpoint
ALTER TABLE `monthly_revenues` ADD CONSTRAINT `monthly_revenues_stock_code_stocks_code_fk` FOREIGN KEY (`stock_code`) REFERENCES `stocks`(`code`) ON DELETE cascade ON UPDATE cascade;