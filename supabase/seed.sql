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

INSERT INTO
    auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
VALUES (
    '00000000-0000-0000-0000-000000000000',
    extensions.uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'enei.sluga@gmail.com',
    NULL,
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
);

-- Create one identity for the user
INSERT INTO
    auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
SELECT
    extensions.uuid_generate_v4(),
    id,
    id,
    format('{"sub":"%s","email":"enei.sluga@gmail.com"}', id::text)::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
FROM
    auth.users
WHERE
    email = 'enei.sluga@gmail.com';

-- Create base_user linked to the auth user
INSERT INTO
    public.base_users (
        name,
        surname,
        auth
    )
SELECT
    'Enei',
    'Sluga',
    id
FROM
    auth.users
WHERE
    email = 'enei.sluga@gmail.com';

-- Create resident entry for enei user and link it to base_user
INSERT INTO
    public.residents (
        room,
        phone_number
    )
VALUES (
    203,
    ''
)
ON CONFLICT DO NOTHING;

-- Link the resident to the base_user (update the resident column in base_users)
UPDATE public.base_users
SET resident = (
    SELECT id 
    FROM public.residents 
    WHERE room = 203 AND phone_number = ''
)
WHERE auth = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'enei.sluga@gmail.com'
);

-- Grant all permissions to the enei user
INSERT INTO public.permissions (user_id, permission_type, permission_creator)
SELECT 
    bu.id as user_id,
    pt.id as permission_type,
    bu.id as permission_creator
FROM 
    public.base_users bu,
    public.permission_types pt
WHERE 
    bu.auth = (SELECT id FROM auth.users WHERE email = 'enei.sluga@gmail.com')
    AND pt.name IN ('MANAGE_USERS', 'ENROLL', 'MANAGE_PERMISSIONS', 'ENROLL_RESIDENT', 'MANAGE_ITEMS', 'MANAGE_TRANSACTIONS', 'CAN_WASH');

