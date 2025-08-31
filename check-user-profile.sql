-- Check if profile exists for the user
SELECT 
  id,
  email,
  role,
  full_name,
  created_at,
  updated_at
FROM profiles 
WHERE id = 'e5b0e084-4892-4790-a653-fd31b3b0c014';

-- Also check auth.users to see if the user exists there
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE id = 'e5b0e084-4892-4790-a653-fd31b3b0c014';

-- Check if there are any profiles without roles
SELECT 
  id,
  email,
  role,
  full_name
FROM profiles 
WHERE role IS NULL OR role = '';
