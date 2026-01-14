-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Busqueda" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "presupuestoTexto" TEXT,
    "presupuestoValor" INTEGER,
    "moneda" TEXT,
    "tipoPropiedad" TEXT,
    "ubicacionPreferida" TEXT,
    "dormitoriosMin" INTEGER,
    "cochera" TEXT,
    "finalidad" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "observaciones" TEXT,
    "planillaRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Busqueda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propiedad" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "localidad" TEXT,
    "precio" TEXT,
    "precioNumerico" INTEGER,
    "moneda" TEXT,
    "descripcion" TEXT,
    "dormitorios" INTEGER,
    "link" TEXT,
    "fuente" TEXT,
    "aptaCredito" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchBusquedaPropiedad" (
    "id" TEXT NOT NULL,
    "busquedaId" TEXT NOT NULL,
    "propiedadId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'SUGERIDA',
    "notas" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchBusquedaPropiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "busquedaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operacion" (
    "id" TEXT NOT NULL,
    "nro" INTEGER,
    "clienteId" TEXT,
    "descripcion" TEXT NOT NULL,
    "precioReal" INTEGER,
    "comisionTotal" DOUBLE PRECISION,
    "totalComisionEquipo" DOUBLE PRECISION,
    "comisionEquipoUnaPunta" DOUBLE PRECISION,
    "comisionLeoDosPuntas" DOUBLE PRECISION,
    "comisionLeoUnaPunta" DOUBLE PRECISION,
    "fechaPagoAprox" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaDocumento" (
    "id" TEXT NOT NULL,
    "nro" INTEGER,
    "reservaTexto" TEXT,
    "boletoCompraVentaTexto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservaDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigImport" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nombreCompleto_key" ON "Cliente"("nombreCompleto");

-- CreateIndex
CREATE INDEX "Propiedad_localidad_idx" ON "Propiedad"("localidad");

-- CreateIndex
CREATE INDEX "Propiedad_aptaCredito_idx" ON "Propiedad"("aptaCredito");

-- CreateIndex
CREATE UNIQUE INDEX "MatchBusquedaPropiedad_busquedaId_propiedadId_key" ON "MatchBusquedaPropiedad"("busquedaId", "propiedadId");

-- CreateIndex
CREATE INDEX "Tarea_clienteId_idx" ON "Tarea"("clienteId");

-- CreateIndex
CREATE INDEX "Tarea_busquedaId_idx" ON "Tarea"("busquedaId");

-- CreateIndex
CREATE INDEX "Tarea_estado_idx" ON "Tarea"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Operacion_nro_key" ON "Operacion"("nro");

-- CreateIndex
CREATE INDEX "Operacion_nro_idx" ON "Operacion"("nro");

-- CreateIndex
CREATE UNIQUE INDEX "ReservaDocumento_nro_key" ON "ReservaDocumento"("nro");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigImport_clave_key" ON "ConfigImport"("clave");

-- AddForeignKey
ALTER TABLE "Busqueda" ADD CONSTRAINT "Busqueda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBusquedaPropiedad" ADD CONSTRAINT "MatchBusquedaPropiedad_busquedaId_fkey" FOREIGN KEY ("busquedaId") REFERENCES "Busqueda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBusquedaPropiedad" ADD CONSTRAINT "MatchBusquedaPropiedad_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_busquedaId_fkey" FOREIGN KEY ("busquedaId") REFERENCES "Busqueda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacion" ADD CONSTRAINT "Operacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
