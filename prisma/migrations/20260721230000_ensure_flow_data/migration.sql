-- Idempotent fix for environments where flowData was not added yet.
ALTER TABLE "public_tarefy"."Board" ADD COLUMN IF NOT EXISTS "flowData" JSONB;
