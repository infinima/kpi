CREATE TABLE `password_reset_requests` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `email` varchar(320) NOT NULL,
  `token_hash` text NOT NULL,
  `attempts_count` INT NOT NULL DEFAULT '0',
  `blocked_until` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_password_reset_email` (`email`),
  UNIQUE KEY `uniq_password_reset_token` (`token_hash`(64)),
  KEY `idx_password_reset_user` (`user_id`),
  CONSTRAINT `password_reset_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `password_reset_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
