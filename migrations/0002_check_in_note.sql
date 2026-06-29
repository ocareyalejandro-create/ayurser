-- 0002_check_in_note.sql
-- The open door: the person's own words after the structured check-in.
-- "How do you feel today?" — answered in their language, not just multiple choice.
--
-- Nullable by design: the one-minute check-in never requires it. Most mornings it
-- will be empty, and that is fine. We capture it from the very first morning so the
-- journal can one day translate these words against the cited knowledge base
-- (capture early, interpret later — see PHILOSOPHY.md).
alter table check_ins add column if not exists note text;
