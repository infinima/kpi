ALTER TABLE `teams`
    ADD COLUMN `documents` TEXT NULL AFTER `special_nominations`;

UPDATE `teams`
SET `documents` = 'Согласие ОПД: 0 из 4
Справка об эпид. окружении: 0 из 4
Справки из школы: 0 из 4

Примечание: '
WHERE `documents` IS NULL;

ALTER TABLE `teams`
    MODIFY `documents` TEXT NOT NULL;
