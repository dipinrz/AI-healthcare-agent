"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixPrescriptionDosageColumn1724740800000 = void 0;
class FixPrescriptionDosageColumn1724740800000 {
    constructor() {
        this.name = 'FixPrescriptionDosageColumn1724740800000';
    }
    async up(queryRunner) {
        // First, check if the dosage column exists in prescription table
        const hasColumn = await queryRunner.hasColumn("prescription", "dosage");
        if (hasColumn) {
            // If the column exists but has NOT NULL constraint issues, fix it
            await queryRunner.query(`ALTER TABLE "prescription" ALTER COLUMN "dosage" DROP NOT NULL`);
            console.log("Removed NOT NULL constraint from prescription.dosage column");
        }
        else {
            console.log("dosage column does not exist in prescription table - no action needed");
        }
    }
    async down(queryRunner) {
        // In rollback, we could add the NOT NULL constraint back if needed
        const hasColumn = await queryRunner.hasColumn("prescription", "dosage");
        if (hasColumn) {
            // First update null values to empty string or default value
            await queryRunner.query(`UPDATE "prescription" SET "dosage" = '' WHERE "dosage" IS NULL`);
            // Then add NOT NULL constraint back
            await queryRunner.query(`ALTER TABLE "prescription" ALTER COLUMN "dosage" SET NOT NULL`);
        }
    }
}
exports.FixPrescriptionDosageColumn1724740800000 = FixPrescriptionDosageColumn1724740800000;
