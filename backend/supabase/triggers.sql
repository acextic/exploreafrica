-- triggers.sql — Supabase Auth Sync

-- Trigger Function: Insert user into 'users' table after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (user_id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: After insert on 'auth.users'
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notes:
-- 1. This assumes 'user_id' in 'users' table matches 'auth.users.id'
-- 2. You can extend 'handle_new_user' to populate name, role, etc.
-- 3. Make sure your 'users' table's 'user_id' is of type UUID to match auth.users
