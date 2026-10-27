-- AlterTable
ALTER TABLE `VerificationRequest` ADD COLUMN `idNumberLast4` VARCHAR(191) NULL,
    MODIFY `idNumber` VARCHAR(191) NULL;

