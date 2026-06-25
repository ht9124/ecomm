-- CreateEnum
CREATE TYPE "ReturnKind" AS ENUM ('CANCELLATION', 'RETURN');

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "kind" "ReturnKind" NOT NULL DEFAULT 'RETURN';

-- CreateIndex
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
