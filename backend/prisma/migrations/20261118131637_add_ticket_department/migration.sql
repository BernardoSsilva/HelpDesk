-- CreateEnum
CREATE TYPE "TicketDepartmentEnum" AS ENUM ('TI', 'FINANCEIRO', 'RH', 'OPERACOES', 'OUTROS');

-- AlterEnum
ALTER TYPE "TicketHistoryActionEnum" ADD VALUE 'DEPARTAMENTO_ALTERADO';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "department" "TicketDepartmentEnum";

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "tickets_updated_at_idx" ON "tickets"("updated_at");
