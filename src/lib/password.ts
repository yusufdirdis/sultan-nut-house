import { hash, verify } from "@node-rs/argon2";

// argon2id, OWASP-recommended baseline parameters for interactive login.
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2_OPTIONS);
}

export function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  return verify(hashedPassword, plainPassword);
}
