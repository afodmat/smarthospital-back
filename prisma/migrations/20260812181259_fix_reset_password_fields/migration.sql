/*
  Warnings:

  - You are about to drop the column `primaryLanguge` on the `Patient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Appointmenttype" AS ENUM ('in_person_visit', 'virtual_consultation', 'phone_consultation');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'workedon');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "primaryLanguge",
ADD COLUMN     "primaryLanguage" TEXT;

-- CreateTable
CREATE TABLE "Appointment" (
    "Id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "time" TIMESTAMP(3),
    "appointmenttype" "Appointmenttype" NOT NULL,
    "symptoms" TEXT,
    "additionalInfo" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_id_key" ON "Doctor"("id");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
