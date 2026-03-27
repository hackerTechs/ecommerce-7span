import { isValidPassword, PASSWORD_REGEX } from "../utils/password-policy";

describe("password policy", () => {
  it("accepts passwords meeting all rules (min 6, upper, lower, number, special)", () => {
    expect(isValidPassword("Pass123!")).toBe(true);
    expect(isValidPassword("Aa1!xyz")).toBe(true);
  });

  it("rejects too short", () => {
    expect(isValidPassword("Aa1!")).toBe(false);
  });

  it("rejects missing character classes", () => {
    expect(isValidPassword("password1!")).toBe(false); // no uppercase
    expect(isValidPassword("PASSWORD1!")).toBe(false); // no lowercase
    expect(isValidPassword("Password!")).toBe(false); // no digit
    expect(isValidPassword("Password1")).toBe(false); // no special
  });

  it("matches only full-string candidates", () => {
    expect(PASSWORD_REGEX.test("xPass123!")).toBe(true);
    expect(PASSWORD_REGEX.test("Pass123")).toBe(false);
  });
});
