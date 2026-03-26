ALTER TABLE `users`
    ADD COLUMN `uuid` varchar(36) NULL AFTER `id`;

UPDATE `users`
SET `uuid` = UUID()
WHERE `uuid` IS NULL;

ALTER TABLE `users`
    MODIFY `uuid` varchar(36) NOT NULL;

ALTER TABLE `users`
    ADD UNIQUE KEY `uniq_users_uuid` (`uuid`);
