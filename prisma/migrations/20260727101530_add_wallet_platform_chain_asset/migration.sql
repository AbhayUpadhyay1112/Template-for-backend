/*
  Warnings:

  - You are about to drop the column `platform` on the `wallet` table. All the data in the column will be lost.
  - Added the required column `platform_id` to the `wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "wallet" DROP COLUMN "platform",
ADD COLUMN     "platform_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "platform" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain" (
    "id" SERIAL NOT NULL,
    "chain_name" TEXT NOT NULL,
    "rpc" TEXT NOT NULL,
    "fallback_rpc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" SERIAL NOT NULL,
    "asset_name" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "address" TEXT,
    "is_native" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
