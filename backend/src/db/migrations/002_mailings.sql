CREATE TABLE `mailings` (
  `id` int NOT NULL,
  `subject` text NOT NULL,
  `body` longtext NOT NULL,
  `selection_event_id` int DEFAULT NULL,
  `selection_location_id` int DEFAULT NULL,
  `selection_league_id` int DEFAULT NULL,
  `selection_manual_emails` json DEFAULT NULL,
  `shared_attachments` json NOT NULL,
  `status` enum('draft','sending','sent','partially_sent','failed','canceled') NOT NULL DEFAULT 'draft',
  `send_started_at` timestamp NULL DEFAULT NULL,
  `send_finished_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mailing_recipients` (
  `id` int NOT NULL,
  `mailing_id` int NOT NULL,
  `team_id` int NOT NULL,
  `email` varchar(320) NOT NULL,
  `delivery_status` enum('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  `attempts_count` int NOT NULL DEFAULT '0',
  `provider_message_id` text,
  `last_error_code` varchar(64) DEFAULT NULL,
  `last_error_message` text,
  `last_attempt_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `mailings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `status` (`status`),
  ADD KEY `selection_event_id` (`selection_event_id`),
  ADD KEY `selection_location_id` (`selection_location_id`),
  ADD KEY `selection_league_id` (`selection_league_id`);

ALTER TABLE `mailing_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_mailing_team_email` (`mailing_id`,`team_id`,`email`),
  ADD KEY `team_id` (`team_id`),
  ADD KEY `delivery_status` (`delivery_status`);

ALTER TABLE `mailings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `mailing_recipients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `mailings`
  ADD CONSTRAINT `mailings_ibfk_2` FOREIGN KEY (`selection_event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `mailings_ibfk_3` FOREIGN KEY (`selection_location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `mailings_ibfk_4` FOREIGN KEY (`selection_league_id`) REFERENCES `leagues` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `mailing_recipients`
  ADD CONSTRAINT `mailing_recipients_ibfk_1` FOREIGN KEY (`mailing_id`) REFERENCES `mailings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `mailing_recipients_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE permissions
    MODIFY object ENUM('events','locations','leagues','teams','users','permissions','mailings') NOT NULL;
