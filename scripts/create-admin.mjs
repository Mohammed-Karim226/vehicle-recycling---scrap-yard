import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);
const prisma = new PrismaClient();
const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

const email = args.email?.trim().toLowerCase();
const password = args.password;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("Provide a valid --email= address");
}
if (!password || password.length < 12 || password.length > 128) {
  throw new Error("Password must contain between 12 and 128 characters");
}

const salt = randomBytes(16);
const derivedKey = await scrypt(password, salt, 32);
const passwordHash = `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;

try {
  const admin = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash, isActive: true },
    select: { id: true, email: true, isActive: true },
  });
  console.log(JSON.stringify(admin, null, 2));
} finally {
  await prisma.$disconnect();
}
