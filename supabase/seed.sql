-- Insert default permission types
INSERT INTO public.permission_types (name, display_name) VALUES
  ('MANAGE_USERS', 'Manage Users'),
  ('ENROLL', 'Enroll Users'),
  ('MANAGE_PERMISSIONS', 'Manage Permissions'),
  ('ENROLL_RESIDENT', 'Enroll Residents'),
  ('MANAGE_ITEMS', 'Manage Items'),
  ('MANAGE_TRANSACTIONS', 'Manage Transactions'),
  ('CAN_WASH', 'Can Wash');

-- Insert default washing machines
INSERT INTO public.washing_machines (name, description) VALUES
  ('Washing Machine 1', 'Main floor washing machine'),
 ('Washing Machine 2', 'Basement washing machine');
