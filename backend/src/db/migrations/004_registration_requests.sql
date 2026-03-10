CREATE TABLE `registration_requests` (
  `id` int NOT NULL,
  `email` varchar(320) NOT NULL,
  `payload` json NOT NULL,
  `code_hash` text NOT NULL,
  `attempts_count` INT NOT NULL DEFAULT '0',
  `blocked_until` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_registration_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `registration_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
