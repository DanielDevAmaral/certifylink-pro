-- Enable realtime for teams table
ALTER TABLE public.teams REPLICA IDENTITY FULL;

-- Enable realtime for team_members table
ALTER TABLE public.team_members REPLICA IDENTITY FULL;

-- Enable realtime for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;