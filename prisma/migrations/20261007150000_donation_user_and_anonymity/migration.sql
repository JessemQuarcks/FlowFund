-- AlterTable
ALTER TABLE `Donation` ADD COLUMN `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Donation_userId_idx` ON `Donation`(`userId`);

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Donation` RENAME INDEX `Donation_fundraiserId_fkey` TO `Donation_fundraiserId_idx`;

