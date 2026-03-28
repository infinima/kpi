ALTER TABLE events
  ADD COLUMN documents_generator_id INT NOT NULL DEFAULT 1 AFTER photo;

UPDATE events
  SET documents_generator_id = 1
  WHERE documents_generator_id IS NULL;

DROP TRIGGER IF EXISTS trg_events_documents_generator_id;
DELIMITER //
CREATE TRIGGER trg_events_documents_generator_id
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
  IF NEW.documents_generator_id IS NULL THEN
    SET NEW.documents_generator_id = (
      SELECT COALESCE(MAX(documents_generator_id), 1) FROM events
    );
  END IF;
END//
DELIMITER ;
