-- AlterTable
ALTER TABLE "payment" DROP COLUMN "proof_path",
ADD COLUMN     "proof_data" BYTEA,
ADD COLUMN     "proof_mime" TEXT,
ADD COLUMN     "proof_name" TEXT,
ADD COLUMN     "proof_size" INTEGER,
ADD COLUMN     "proof_uploaded_at" TIMESTAMPTZ(3);
