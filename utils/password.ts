import bcrypt from "bcrypt";

export async function saltAndHashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

export async function isPasswordMatched(plainPassword: string, passwordHash: string) {
  return await bcrypt.compare(plainPassword, passwordHash);
}
