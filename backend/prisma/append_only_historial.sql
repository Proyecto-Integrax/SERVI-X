-- RNF-05 / regla append-only de historial_atencion.
-- Se aplica como migracion manual despues de `prisma migrate dev` inicial
-- (Prisma no expresa triggers en schema.prisma).
CREATE OR REPLACE FUNCTION historial_atencion_bloquear_mutacion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'historial_atencion es append-only: no se permiten UPDATE ni DELETE';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_atencion_append_only ON historial_atencion;
CREATE TRIGGER trg_historial_atencion_append_only
BEFORE UPDATE OR DELETE ON historial_atencion
FOR EACH ROW EXECUTE FUNCTION historial_atencion_bloquear_mutacion();
