/*
  Warnings:

  - You are about to drop the column `resetpasswordexpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetpasswordtoken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetpasswordexpires",
DROP COLUMN "resetpasswordtoken",
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
