-- ==============================================================================
-- ARVEN — Step 3: Grant Admin Role to Existing Supabase Auth Account
-- ==============================================================================
-- Target Admin Email: ahmedashaer84@gmail.com
-- No passwords are stored or modified here.
-- Ensure the user already exists in Authentication -> Users in Supabase first.
-- ==============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'ahmedashaer84@gmail.com';
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'User % was not found in auth.users. Create the user in Supabase Dashboard -> Authentication -> Users first, then re-run this script.',
      v_email;
  END IF;

  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (v_user_id, lower(v_email), 'admin')
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        role = 'admin';

  RAISE NOTICE 'Admin privileges granted successfully to % (user_id: %)', v_email, v_user_id;
END $$;

-- Verification query (should return 1 row for ahmedashaer84@gmail.com)
SELECT user_id, email, role, created_at
FROM public.admin_users;
