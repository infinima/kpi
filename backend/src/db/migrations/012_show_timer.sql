ALTER TABLE `leagues`
    ADD COLUMN `show_timer_minutes` INT NOT NULL DEFAULT 2,
    ADD COLUMN `show_timer_started_at` DATETIME NULL;
