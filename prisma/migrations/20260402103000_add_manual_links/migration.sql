-- CreateTable
CREATE TABLE "ManualLink" (
    "id" TEXT NOT NULL,
    "busquedaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "createdBy" TEXT,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "portalDomain" TEXT,
    "tituloInferido" TEXT,
    "precioInferido" INTEGER,
    "monedaInferida" TEXT,
    "zonaInferida" TEXT,
    "tipoOperacion" TEXT,
    "dormitoriosInferidos" INTEGER,
    "ambientesInferidos" INTEGER,
    "tipoPropiedadInferido" TEXT,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "matchNivel" TEXT NOT NULL DEFAULT 'BAJO',
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "fueEnviadoAntes" BOOLEAN NOT NULL DEFAULT false,
    "enviadoGestionAt" TIMESTAMP(3),
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManualLink_busquedaId_normalizedUrl_key" ON "ManualLink"("busquedaId", "normalizedUrl");

-- CreateIndex
CREATE INDEX "ManualLink_clienteId_idx" ON "ManualLink"("clienteId");

-- CreateIndex
CREATE INDEX "ManualLink_busquedaId_idx" ON "ManualLink"("busquedaId");

-- CreateIndex
CREATE INDEX "ManualLink_createdBy_idx" ON "ManualLink"("createdBy");

-- CreateIndex
CREATE INDEX "ManualLink_estado_idx" ON "ManualLink"("estado");

-- CreateIndex
CREATE INDEX "ManualLink_matchScore_idx" ON "ManualLink"("matchScore");

-- CreateIndex
CREATE INDEX "ManualLink_fueEnviadoAntes_idx" ON "ManualLink"("fueEnviadoAntes");

-- AddForeignKey
ALTER TABLE "ManualLink" ADD CONSTRAINT "ManualLink_busquedaId_fkey" FOREIGN KEY ("busquedaId") REFERENCES "Busqueda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualLink" ADD CONSTRAINT "ManualLink_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualLink" ADD CONSTRAINT "ManualLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
