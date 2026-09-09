/**
 * One-off local operator tool — NOT exposed over the web. Grants ADMIN role
 * to an email, creating the account with a generated temporary password if
 * it doesn't exist yet.
 *
 * Usage: npx tsx scripts/promote-admin.ts someone@example.com
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts someone@example.com");
    process.exit(1);
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { email },
      data: { role: "ADMIN", emailVerified: existing.emailVerified ?? new Date() },
    });
    console.log(`Promoted existing account ${email} to ADMIN.`);
    return;
  }

  const temporaryPassword = randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  await db.user.create({
    data: {
      email,
      name: "Sultan Nut House Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  console.log(`Created ADMIN account for ${email}`);
  console.log(`Temporary password: ${temporaryPassword}`);
  console.log("Sign in at /login, then change this password (password-change UI is on the roadmap).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
