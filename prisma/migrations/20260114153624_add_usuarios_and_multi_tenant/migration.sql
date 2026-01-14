/*
  Warnings:

  - You are about to drop the column `link` on the `Propiedad` table. All the data in the column will be lost.
  - You are about to drop the column `precioNumerico` on the `Propiedad` table. All the data in the column will be lost.
  - The `precio` column on the `Propiedad` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[nombreCompleto,usuarioId]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[direccion,tipo,usuarioId]` on the table `Propiedad` will be added. If there are existing duplicate values, this will fail.
  - Made the column `moneda` on table `Propiedad` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Cliente_nombreCompleto_key";

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "Operacion" ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "Propiedad" DROP COLUMN "link",
DROP COLUMN "precioNumerico",
ADD COLUMN     "ambientes" INTEGER,
ADD COLUMN     "banos" INTEGER,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "subtipo" TEXT,
ADD COLUMN     "superficie" INTEGER,
ADD COLUMN     "titulo" TEXT,
ADD COLUMN     "urlMls" TEXT,
ADD COLUMN     "usuarioId" TEXT,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "zona" TEXT,
DROP COLUMN "precio",
ADD COLUMN     "precio" INTEGER,
ALTER COLUMN "moneda" SET NOT NULL,
ALTER COLUMN "moneda" SET DEFAULT 'USD';

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "avatar" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombre_key" ON "Usuario"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nombreCompleto_usuarioId_key" ON "Cliente"("nombreCompleto", "usuarioId");

-- CreateIndex
CREATE INDEX "Operacion_usuarioId_idx" ON "Operacion"("usuarioId");

-- CreateIndex
CREATE INDEX "Propiedad_zona_idx" ON "Propiedad"("zona");

-- CreateIndex
CREATE INDEX "Propiedad_usuarioId_idx" ON "Propiedad"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Propiedad_direccion_tipo_usuarioId_key" ON "Propiedad"("direccion", "tipo", "usuarioId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacion" ADD CONSTRAINT "Operacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
