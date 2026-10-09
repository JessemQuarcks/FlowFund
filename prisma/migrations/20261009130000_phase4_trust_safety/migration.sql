-- AlterTable
ALTER TABLE `Event` ADD COLUMN `status` ENUM('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'ENDED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    ADD COLUMN `verificationStatus` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED';

-- CreateTable
CREATE TABLE `VerificationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `idType` VARCHAR(191) NOT NULL,
    `idNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewNotes` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `dateAdded` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateUpdated` DATETIME(3) NOT NULL,

    INDEX `VerificationRequest_userId_idx`(`userId`),
    INDEX `VerificationRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,
    `reporterEmail` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'ACTIONED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `dateAdded` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateUpdated` DATETIME(3) NOT NULL,

    INDEX `Report_eventId_idx`(`eventId`),
    INDEX `Report_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Event_status_idx` ON `Event`(`status`);

-- AddForeignKey
ALTER TABLE `VerificationRequest` ADD CONSTRAINT `VerificationRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

