import { z } from "zod";
import { PASSWORD_POLICY_MESSAGE, PASSWORD_REGEX } from "../utils/password-policy";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().regex(PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE),
    name: z.string().min(2),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});
