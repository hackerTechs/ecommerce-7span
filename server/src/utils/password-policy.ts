export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 6 characters and include uppercase, lowercase, a number, and a special character.";

// At least 6 chars, uppercase, lowercase, digit, and one non-alphanumeric character.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
