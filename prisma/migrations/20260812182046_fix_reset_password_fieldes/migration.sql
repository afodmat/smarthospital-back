/*
  Warnings:

  - You are about to drop the column `resetPasswordToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetpasswordExpires` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetPasswordToken",
DROP COLUMN "resetpasswordExpires",
ADD COLUMN     "resetpasswordexpires" TIMESTAMP(3),
ADD COLUMN     "resetpasswordtoken" TEXT;
