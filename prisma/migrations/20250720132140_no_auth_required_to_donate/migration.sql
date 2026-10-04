/*
  Warnings:

  - You are about to drop the column `userId` on the `donation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Donation` DROP FOREIGN KEY `Donation_userId_fkey`;

-- DropIndex
DROP INDEX `Donation_userId_fkey` ON `Donation`;

-- AlterTable
ALTER TABLE `Donation` DROP COLUMN `userId`,
    ADD COLUMN `donorEmail` VARCHAR(191) NULL,
    ADD COLUMN `donorFirstName` VARCHAR(191) NULL,
    ADD COLUMN `donorLastName` VARCHAR(191) NULL;
