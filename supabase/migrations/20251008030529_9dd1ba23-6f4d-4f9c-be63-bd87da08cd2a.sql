-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update handle_new_user function to capture Google profile picture
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Migrate existing data - update profiles with Google avatars
UPDATE public.profiles p
SET avatar_url = COALESCE(
  (SELECT au.raw_user_meta_data->>'avatar_url' FROM auth.users au WHERE au.id = p.user_id),
  (SELECT au.raw_user_meta_data->>'picture' FROM auth.users au WHERE au.id = p.user_id)
)
WHERE avatar_url IS NULL;