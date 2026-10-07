-- Store all money as an integer number of pesewas (1 GHS = 100 pesewas)
-- instead of a floating-point number of GHS, and record the currency of each
-- money-bearing row.
--
-- Existing rows hold GHS as a DOUBLE. We multiply by 100 and round to the
-- nearest pesewa while the columns are still DOUBLE, then narrow them to INT:
-- the values are already whole numbers by then, so the cast loses nothing.

-- Add the currency columns (default GHS: the only currency in use so far).
ALTER TABLE `Fundraiser` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'GHS';
ALTER TABLE `Donation` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'GHS';
ALTER TABLE `Withdrawal` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'GHS';

-- Convert GHS -> pesewas in place (columns are still DOUBLE here).
UPDATE `Fundraiser` SET
  `targetAmount` = ROUND(`targetAmount` * 100),
  `minimumAmount` = ROUND(`minimumAmount` * 100),
  `raisedAmount` = ROUND(`raisedAmount` * 100),
  `totalWithdrawn` = ROUND(`totalWithdrawn` * 100);
UPDATE `Donation` SET `amount` = ROUND(`amount` * 100);
UPDATE `Withdrawal` SET `amount` = ROUND(`amount` * 100);

-- Narrow the money columns to INT pesewas.
ALTER TABLE `Fundraiser`
  MODIFY `targetAmount` INT NOT NULL,
  MODIFY `minimumAmount` INT NOT NULL,
  MODIFY `raisedAmount` INT NOT NULL,
  MODIFY `totalWithdrawn` INT NOT NULL;
ALTER TABLE `Donation` MODIFY `amount` INT NOT NULL;
ALTER TABLE `Withdrawal` MODIFY `amount` INT NOT NULL;
