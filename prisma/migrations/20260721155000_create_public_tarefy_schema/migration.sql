-- Ensure the application schema exists before later migrations run.
CREATE SCHEMA IF NOT EXISTS "public_tarefy";

-- Move enum and tables created by the initial migration in "public".
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PomodoroMode' AND n.nspname = 'public'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PomodoroMode' AND n.nspname = 'public_tarefy'
  ) THEN
    ALTER TYPE "public"."PomodoroMode" SET SCHEMA "public_tarefy";
  END IF;
END $migration$;

ALTER TABLE IF EXISTS "public"."User" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."Account" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."Session" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."VerificationToken" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."Board" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."KanbanColumn" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."KanbanCard" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."Prompt" SET SCHEMA "public_tarefy";
ALTER TABLE IF EXISTS "public"."PomodoroSession" SET SCHEMA "public_tarefy";
