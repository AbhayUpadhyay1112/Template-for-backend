-- AlterTable
ALTER TABLE "node" ADD COLUMN     "created_by" INTEGER;

-- AddForeignKey
ALTER TABLE "node" ADD CONSTRAINT "node_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
