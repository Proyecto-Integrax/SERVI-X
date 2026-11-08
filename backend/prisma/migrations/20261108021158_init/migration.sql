-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('Agente', 'Administrador');

-- CreateTable
CREATE TABLE "cliente" (
    "cliente_id" UUID NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "tipo_documento" VARCHAR(50) NOT NULL,
    "numero_documento" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("cliente_id")
);

-- CreateTable
CREATE TABLE "responsable" (
    "responsable_id" UUID NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "correo_corporativo" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol_operativo" "Rol" NOT NULL,
    "estado_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "responsable_pkey" PRIMARY KEY ("responsable_id")
);

-- CreateTable
CREATE TABLE "caso" (
    "caso_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "pedido_id" UUID,
    "despacho_id" UUID,
    "tipo_solicitud" VARCHAR(50) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado_atencion" VARCHAR(50) NOT NULL DEFAULT 'Radicado',
    "responsable_id" UUID,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMPTZ,

    CONSTRAINT "caso_pkey" PRIMARY KEY ("caso_id")
);

-- CreateTable
CREATE TABLE "historial_atencion" (
    "historial_id" UUID NOT NULL,
    "caso_id" UUID NOT NULL,
    "estado_anterior" VARCHAR(50),
    "estado_nuevo" VARCHAR(50) NOT NULL,
    "accion_realizada" TEXT NOT NULL,
    "usuario_accion_id" UUID NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "fecha_registro" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_atencion_pkey" PRIMARY KEY ("historial_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_email_key" ON "cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "responsable_correo_corporativo_key" ON "responsable"("correo_corporativo");

-- AddForeignKey
ALTER TABLE "caso" ADD CONSTRAINT "caso_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso" ADD CONSTRAINT "caso_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "responsable"("responsable_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_atencion" ADD CONSTRAINT "historial_atencion_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "caso"("caso_id") ON DELETE RESTRICT ON UPDATE CASCADE;
