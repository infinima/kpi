ALTER TABLE `mailing_recipients`
    DROP FOREIGN KEY `mailing_recipients_ibfk_2`;

ALTER TABLE `mailing_recipients`
    MODIFY `team_id` int NULL;

ALTER TABLE `mailing_recipients`
    ADD CONSTRAINT `mailing_recipients_ibfk_2`
        FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE;
