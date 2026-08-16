CREATE TABLE "AdminUser" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminUser_email_lowercase_check" CHECK ("email" = lower("email")),
  CONSTRAINT "AdminUser_password_hash_check" CHECK ("passwordHash" LIKE 'scrypt$%')
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
