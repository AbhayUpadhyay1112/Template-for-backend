-- CreateEnum
CREATE TYPE "wallet_purpose" AS ENUM ('gas', 'commission', 'payload');

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "purpose" "wallet_purpose" NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);
