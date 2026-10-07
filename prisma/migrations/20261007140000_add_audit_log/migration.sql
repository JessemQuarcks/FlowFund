-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `fundraiserId` VARCHAR(191) NULL,
    `donationId` VARCHAR(191) NULL,
    `withdrawalId` VARCHAR(191) NULL,
    `amount` INTEGER NULL,
    `currency` VARCHAR(191) NULL,
    `detail` JSON NOT NULL,
    `reference` VARCHAR(191) NULL,

    INDEX `AuditLog_fundraiserId_idx`(`fundraiserId`),
    INDEX `AuditLog_withdrawalId_idx`(`withdrawalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

