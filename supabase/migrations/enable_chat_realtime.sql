-- ============================================================
-- ENABLE REALTIME ON CHAT TABLES
-- Run this in your Supabase SQL Editor to enable Postgres
-- change events for chat messages and conversations.
-- ============================================================

-- 1. Add chat tables to the supabase_realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 2. Enable REPLICA IDENTITY FULL so all row columns are available in realtime payloads & filters
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
