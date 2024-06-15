import { string, object } from "zod";

export const loginSchema = object({
  username: string({ required_error: "Username is required:" })
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: string({ required_error: "Password is required:" })
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters")
});
