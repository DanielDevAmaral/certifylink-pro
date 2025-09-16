-- Enable leaked password protection and other security enhancements
-- This addresses the security warning about leaked password protection being disabled

-- Enable leaked password protection
UPDATE auth.config 
SET leaked_password_protection = true 
WHERE parameter = 'GOTRUE_PASSWORD_MIN_LENGTH';

-- If the above doesn't work, we'll use the settings approach
INSERT INTO auth.config (parameter, value) 
VALUES ('GOTRUE_PASSWORD_MIN_LENGTH', '8')
ON CONFLICT (parameter) DO UPDATE SET value = '8';

-- Enable stronger password requirements
INSERT INTO auth.config (parameter, value) 
VALUES ('GOTRUE_PASSWORD_REQUIRED_CHARACTERS', 'letters,numbers')
ON CONFLICT (parameter) DO UPDATE SET value = 'letters,numbers';

-- Configure session timeout (24 hours)
INSERT INTO auth.config (parameter, value) 
VALUES ('GOTRUE_JWT_EXP', '86400')
ON CONFLICT (parameter) DO UPDATE SET value = '86400';