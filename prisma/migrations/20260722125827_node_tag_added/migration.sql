-- CreateEnum
CREATE TYPE "node_tag" AS ENUM ('archive', 'full', 'rpc', 'validator', 'other');

-- AlterTable
ALTER TABLE "node" ADD COLUMN     "createdBy" INTEGER DEFAULT 1,
ADD COLUMN     "tag" "node_tag" NOT NULL DEFAULT 'other';
