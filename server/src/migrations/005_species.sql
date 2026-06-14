-- Pet species (mascot choice). Existing pets default to the original dog.
ALTER TABLE pets ADD COLUMN species TEXT NOT NULL DEFAULT 'dog';
