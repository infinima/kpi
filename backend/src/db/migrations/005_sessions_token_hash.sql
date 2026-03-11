ALTER TABLE `sessions`
  ADD `token_hash` char(64) NOT NULL AFTER `token`;

UPDATE `sessions`
   SET `token_hash` = SHA2(`token`, 256)
 WHERE `token_hash` = '';

ALTER TABLE `sessions`
  DROP COLUMN `token`;

CREATE INDEX `idx_sessions_token_hash` ON `sessions` (`token_hash`);
