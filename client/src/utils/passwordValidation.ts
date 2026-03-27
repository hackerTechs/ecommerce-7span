export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 6 characters and include uppercase, lowercase, a number, and a special character.";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getPasswordValidationError(password: string): string | null {
  if (!password.trim()) return "Password is required";
  if (!isValidPassword(password)) return PASSWORD_POLICY_MESSAGE;
  return null;
}
