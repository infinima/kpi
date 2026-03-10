ALTER TABLE `teams` ADD `owner_user_id` INT NULL AFTER `league_id`;
ALTER TABLE `teams` ADD INDEX(`owner_user_id`);
ALTER TABLE `teams`
    ADD CONSTRAINT `fk_teams_owner_user`
        FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`)
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
ALTER TABLE `teams` ADD `status` ENUM('IN_RESERVE','ON_CHECKING','ACCEPTED','PAID') NOT NULL DEFAULT 'ON_CHECKING' AFTER `appreciations`;
ALTER TABLE `teams` ADD `school` TEXT NOT NULL AFTER `appreciations`;
ALTER TABLE `teams` ADD `region` TEXT NOT NULL AFTER `school`;
ALTER TABLE `teams` ADD `meals_count` INT NOT NULL DEFAULT '0' AFTER `region`;
ALTER TABLE `teams` ADD `maintainer_full_name` TEXT NULL AFTER `meals_count`;
ALTER TABLE `teams` ADD `maintainer_activity` ENUM('семинар учителей математики','экскурсия по Технопарку (платно)','мастер-класс в Технопарке (платно)','заниматься своими делами') NULL AFTER `maintainer_full_name`;

ALTER TABLE `users` DROP `photo`;
ALTER TABLE `users` ADD `phone_number` TEXT NOT NULL AFTER `password_hash`;

ALTER TABLE `leagues` CHANGE `status` `status` ENUM('NOT_STARTED','REGISTRATION_IN_PROGRESS','REGISTRATION_ENDED','TEAMS_FIXED','ARRIVAL_IN_PROGRESS','ARRIVAL_ENDED','KVARTALY_GAME','LUNCH','FUDZI_GAME','FUDZI_GAME_BREAK','GAMES_ENDED','AWARDING_IN_PROGRESS','ENDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE `leagues` ADD `max_teams_count` INT NOT NULL DEFAULT '0' AFTER `name`;
