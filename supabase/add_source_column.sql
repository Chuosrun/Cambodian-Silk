-- ============================================================
-- Sprint 2 enhancement — add the museum/origin source column
-- Run in Supabase SQL Editor after the main schema.sql.
-- Safe to run multiple times (idempotent).
-- ============================================================

alter table public.entries
  add column if not exists source text;