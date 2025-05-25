/*
  Warnings:

  - You are about to drop the column `animosity` on the `fundraiser` table. All the data in the column will be lost.
  - Added the required column `anonymity` to the `Fundraiser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fundraiser` DROP COLUMN `animosity`,
    ADD COLUMN `anonymity` BOOLEAN NOT NULL;
