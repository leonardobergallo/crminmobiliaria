/*
  Warnings:

  - A unique constraint covering the columns `[nombreCompleto,inmobiliariaId]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[direccion,tipo,inmobiliariaId]` on the table `Propiedad` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre,inmobiliariaId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Cliente_nombreCompleto_usuarioId_key";

-- DropIndex
DROP INDEX "Propiedad_direccion_tipo_usuarioId_key";

-- DropIndex
DROP INDEX "Usuario_nombre_key";

-- AlterTable
ALTER TABLE "Busqueda" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "inmobiliariaId" TEXT;

-- AlterTable
ALTER TABLE "Operacion" ADD COLUMN     "inmobiliariaId" TEXT;

-- AlterTable
ALTER TABLE "Propiedad" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
ADD COLUMN     "inmobiliariaId" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "inmobiliariaId" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "password" TEXT,
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'agente';

-- CreateTable
CREATE TABLE "Inmobiliaria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "colorPrimario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inmobiliaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvioPropiedad" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "propiedadId" TEXT,
    "urlExterna" TEXT,
    "tituloExterno" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "mensaje" TEXT,
    "respuesta" TEXT,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvioPropiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comunicacion" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "direccion" TEXT NOT NULL DEFAULT 'SALIENTE',
    "resumen" TEXT NOT NULL,
    "detalle" TEXT,
    "resultado" TEXT,
    "requiereSeguimiento" BOOLEAN NOT NULL DEFAULT false,
    "fechaSeguimiento" TIMESTAMP(3),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comunicacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inmobiliaria_nombre_key" ON "Inmobiliaria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Inmobiliaria_slug_key" ON "Inmobiliaria"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_usuarioId_idx" ON "Session"("usuarioId");

-- CreateIndex
CREATE INDEX "EnvioPropiedad_clienteId_idx" ON "EnvioPropiedad"("clienteId");

-- CreateIndex
CREATE INDEX "EnvioPropiedad_propiedadId_idx" ON "EnvioPropiedad"("propiedadId");

-- CreateIndex
CREATE INDEX "EnvioPropiedad_fechaEnvio_idx" ON "EnvioPropiedad"("fechaEnvio");

-- CreateIndex
CREATE INDEX "Comunicacion_clienteId_idx" ON "Comunicacion"("clienteId");

-- CreateIndex
CREATE INDEX "Comunicacion_fecha_idx" ON "Comunicacion"("fecha");

-- CreateIndex
CREATE INDEX "Comunicacion_tipo_idx" ON "Comunicacion"("tipo");

-- CreateIndex
CREATE INDEX "Busqueda_createdBy_idx" ON "Busqueda"("createdBy");

-- CreateIndex
CREATE INDEX "Cliente_inmobiliariaId_idx" ON "Cliente"("inmobiliariaId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nombreCompleto_inmobiliariaId_key" ON "Cliente"("nombreCompleto", "inmobiliariaId");

-- CreateIndex
CREATE INDEX "Operacion_inmobiliariaId_idx" ON "Operacion"("inmobiliariaId");

-- CreateIndex
CREATE INDEX "Propiedad_inmobiliariaId_idx" ON "Propiedad"("inmobiliariaId");

-- CreateIndex
CREATE INDEX "Propiedad_estado_idx" ON "Propiedad"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Propiedad_direccion_tipo_inmobiliariaId_key" ON "Propiedad"("direccion", "tipo", "inmobiliariaId");

-- CreateIndex
CREATE INDEX "Usuario_inmobiliariaId_idx" ON "Usuario"("inmobiliariaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombre_inmobiliariaId_key" ON "Usuario"("nombre", "inmobiliariaId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Busqueda" ADD CONSTRAINT "Busqueda_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacion" ADD CONSTRAINT "Operacion_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioPropiedad" ADD CONSTRAINT "EnvioPropiedad_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvioPropiedad" ADD CONSTRAINT "EnvioPropiedad_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicacion" ADD CONSTRAINT "Comunicacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
