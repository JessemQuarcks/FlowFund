-- AlterTable
ALTER TABLE `Donation` ADD COLUMN `reference` VARCHAR(191) NULL;

-- Backfill from the stored Paystack verify response. If the same reference
-- was recorded more than once (replayed verification), only the earliest row
-- gets it; the duplicates keep NULL and should be reviewed with:
--   SELECT JSON_UNQUOTE(JSON_EXTRACT(paymentDetails, '$.data.reference')) AS ref,
--          COUNT(*) AS n, SUM(amount) AS total
--   FROM `Donation` GROUP BY ref HAVING n > 1;
UPDATE `Donation` d
JOIN (
  SELECT JSON_UNQUOTE(JSON_EXTRACT(paymentDetails, '$.data.reference')) AS ref,
         MIN(dateAdded) AS firstAdded
  FROM `Donation`
  GROUP BY ref
) f
  ON JSON_UNQUOTE(JSON_EXTRACT(d.paymentDetails, '$.data.reference')) = f.ref
 AND d.dateAdded = f.firstAdded
SET d.reference = f.ref
WHERE f.ref IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Donation_reference_key` ON `Donation`(`reference`);
