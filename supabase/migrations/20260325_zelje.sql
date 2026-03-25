SET search_path TO public, extensions;

CREATE TYPE "zelje_status" AS ENUM ('queued', 'playing', 'done', 'voting');

CREATE TABLE IF NOT EXISTS "public"."zelje" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "song_name" "text" NOT NULL,
    "selfie_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "emoji_like" bigint DEFAULT 0 NOT NULL,
    "emoji_fire" bigint DEFAULT 0 NOT NULL,
    "emoji_dislike" bigint DEFAULT 0 NOT NULL,
    "emoji_party" bigint DEFAULT 0 NOT NULL,
    "status" "zelje_status" DEFAULT 'voting' NOT NULL
);

COMMENT ON TABLE "public"."zelje" IS 'Songs for zelje voting';

ALTER TABLE ONLY "public"."zelje"
    ADD CONSTRAINT "zelje_pkey" PRIMARY KEY ("id");

CREATE POLICY "zelje_select_for_all" ON "public"."zelje" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "zelje_insert_for_authenticated" ON "public"."zelje" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "zelje_update_for_all" ON "public"."zelje" FOR UPDATE TO "authenticated" USING (true);

GRANT ALL ON TABLE "public"."zelje" TO "anon";
GRANT ALL ON TABLE "public"."zelje" TO "authenticated";
GRANT ALL ON TABLE "public"."zelje" TO "service_role";

CREATE OR REPLACE FUNCTION "public"."add_zelje_song"("song_name" "text", "selfie_ref" "text")
RETURNS "public"."zelje"
LANGUAGE "plpgsql"
AS $$
DECLARE
    new_song "public"."zelje"%ROWTYPE;
BEGIN
    INSERT INTO "public"."zelje" ("song_name", "selfie_ref", "emoji_like")
    VALUES ("song_name", "selfie_ref", 1)
    RETURNING * INTO new_song;
    
    RETURN new_song;
END;
$$;

GRANT ALL ON FUNCTION "public"."add_zelje_song"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_zelje_song"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_zelje_song"("text", "text") TO "service_role";

CREATE OR REPLACE FUNCTION "public"."react_to_zelje"("song_id" "uuid", "emoji_type" "text")
RETURNS "public"."zelje"
LANGUAGE "plpgsql"
AS $$
DECLARE
    updated_song "public"."zelje"%ROWTYPE;
BEGIN
    UPDATE "public"."zelje"
    SET 
        "emoji_like" = CASE WHEN "emoji_type" = 'like' THEN "emoji_like" + 1 ELSE "emoji_like" END,
        "emoji_fire" = CASE WHEN "emoji_type" = 'fire' THEN "emoji_fire" + 1 ELSE "emoji_fire" END,
        "emoji_dislike" = CASE WHEN "emoji_type" = 'dislike' THEN "emoji_dislike" + 1 ELSE "emoji_dislike" END,
        "emoji_party" = CASE WHEN "emoji_type" = 'party' THEN "emoji_party" + 1 ELSE "emoji_party" END
    WHERE "id" = "song_id"
    RETURNING * INTO updated_song;
    
    RETURN updated_song;
END;
$$;

GRANT ALL ON FUNCTION "public"."react_to_zelje"("uuid", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."react_to_zelje"("uuid", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."react_to_zelje"("uuid", "text") TO "service_role";

CREATE OR REPLACE FUNCTION "public"."reset_reactions_on_play"()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'playing' THEN
        NEW.emoji_like := 0;
        NEW.emoji_fire := 0;
        NEW.emoji_dislike := 0;
        NEW.emoji_party := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "reset_reactions_trigger"
    BEFORE UPDATE ON "public"."zelje"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."reset_reactions_on_play"();

GRANT ALL ON FUNCTION "public"."reset_reactions_on_play"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_reactions_on_play"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_reactions_on_play"() TO "service_role";
