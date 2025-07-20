/*
  Warnings:

  - You are about to alter the column `amount` on the `donation` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `targetAmount` on the `fundraiser` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `minimumAmount` on the `fundraiser` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `raisedAmount` on the `fundraiser` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `totalWithdrawn` on the `fundraiser` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.
  - You are about to alter the column `amount` on the `withdrawal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Double`.

*/
-- AlterTable
ALTER TABLE `donation` MODIFY `amount` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `fundraiser` MODIFY `targetAmount` DOUBLE NOT NULL,
    MODIFY `minimumAmount` DOUBLE NOT NULL,
    MODIFY `raisedAmount` DOUBLE NOT NULL,
    MODIFY `totalWithdrawn` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `withdrawal` MODIFY `amount` DOUBLE NOT NULL;
