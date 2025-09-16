-- Promote Rodrigo Bonfim to admin role
UPDATE user_roles 
SET role = 'admin', assigned_by = '0c73af54-80fc-4bcf-9d29-7c3e81124446'
WHERE user_id = '0c73af54-80fc-4bcf-9d29-7c3e81124446';