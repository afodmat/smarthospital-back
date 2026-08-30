/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'IT_STAFF');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PATIENT',
ALTER COLUMN "isEmailVerified" SET DEFAULT false,
ALTER COLUMN "twoFactorEnabled" SET DEFAULT false,
ALTER COLUMN "twoFactorSecret" DROP NOT NULL,
ALTER COLUMN "tokenVersion" SET DEFAULT 0,
ALTER COLUMN "resetPasswordToken" DROP NOT NULL,
ALTER COLUMN "resetpasswordExpires" DROP NOT NULL;
