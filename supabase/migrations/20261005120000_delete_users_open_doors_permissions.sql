INSERT INTO public.permission_types (name, display_name) VALUES
  ('DELETE_USERS', 'Delete Users'),
  ('OPEN_DOORS', 'Open Doors')
ON CONFLICT (name) DO NOTHING;
