-- RenameColumn (refresh tokens are now stored hashed, never in plaintext)
ALTER TABLE "users" RENAME COLUMN "refreshToken" TO "refreshTokenHash";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "verificationTokenHash" TEXT,
ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationTokenHash_key" ON "users"("verificationTokenHash");
