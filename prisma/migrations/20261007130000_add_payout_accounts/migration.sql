-- AlterTable
ALTER TABLE `Withdrawal` ADD COLUMN `payoutAccountId` VARCHAR(191) NULL,
    ADD COLUMN `reference` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED') NOT NULL;

-- CreateTable
CREATE TABLE `PayoutAccount` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountType` ENUM('MOBILE_MONEY', 'BANK_ACCOUNT') NOT NULL,
    `bankCode` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `recipientCode` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GHS',
    `dateAdded` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateUpdated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PayoutAccount_userId_recipientCode_key`(`userId`, `recipientCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Withdrawal_reference_key` ON `Withdrawal`(`reference`);

-- AddForeignKey
ALTER TABLE `Withdrawal` ADD CONSTRAINT `Withdrawal_payoutAccountId_fkey` FOREIGN KEY (`payoutAccountId`) REFERENCES `PayoutAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutAccount` ADD CONSTRAINT `PayoutAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

