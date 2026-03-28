ALTER TABLE locations
  ADD COLUMN photo_album_url VARCHAR(1024) DEFAULT NULL AFTER address;
