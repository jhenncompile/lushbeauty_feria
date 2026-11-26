"""Reglas que la base de datos impone por su cuenta (copia del esquema `db/`)."""

# RN-04: en una venta confirmada, los pagos igualan a las líneas (se comprueba al confirmar la transacción).
FN_VALIDAR_VENTA = """
CREATE FUNCTION fn_validar_venta() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    vid uuid;
    lineas numeric(12,2);
    pagado numeric(12,2);
BEGIN
    IF TG_TABLE_NAME = 'venta' THEN vid := NEW.id; ELSE vid := NEW.venta_id; END IF;
    IF NOT EXISTS (SELECT 1 FROM venta WHERE id = vid AND estado = 'CONFIRMADA') THEN RETURN NULL; END IF;
    SELECT coalesce(sum(importe_cobrado), 0) INTO lineas FROM linea_venta WHERE venta_id = vid;
    SELECT coalesce(sum(monto), 0) INTO pagado FROM pago WHERE venta_id = vid;
    IF lineas <> pagado OR NOT EXISTS (SELECT 1 FROM linea_venta WHERE venta_id = vid) THEN
        RAISE EXCEPTION 'RN-04: pagos (%) distintos de las líneas (%)', pagado, lineas;
    END IF;
    RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER tg_venta_cuadra AFTER INSERT OR UPDATE ON venta
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fn_validar_venta();
CREATE CONSTRAINT TRIGGER tg_pago_cuadra AFTER INSERT OR UPDATE ON pago
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fn_validar_venta();
CREATE CONSTRAINT TRIGGER tg_linea_cuadra AFTER INSERT ON linea_venta
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fn_validar_venta();
"""
FN_VALIDAR_VENTA_ATRAS = """
DROP TRIGGER tg_linea_cuadra ON linea_venta;
DROP TRIGGER tg_pago_cuadra ON pago;
DROP TRIGGER tg_venta_cuadra ON venta;
DROP FUNCTION fn_validar_venta();
"""

# RN-02: una línea de venta confirmada o anulada no se modifica (solo `liquidacion_id` puede asignarse).
FN_LINEA_INMUTABLE = """
CREATE FUNCTION fn_linea_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM venta WHERE id = OLD.venta_id AND estado IN ('CONFIRMADA','ANULADA')) THEN
        IF TG_OP = 'DELETE' OR to_jsonb(NEW) - 'liquidacion_id' <> to_jsonb(OLD) - 'liquidacion_id' THEN
            RAISE EXCEPTION 'RN-02: una línea confirmada no se modifica';
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_linea_inmutable BEFORE UPDATE OR DELETE ON linea_venta
    FOR EACH ROW EXECUTE FUNCTION fn_linea_inmutable();
"""
FN_LINEA_INMUTABLE_ATRAS = "DROP TRIGGER tg_linea_inmutable ON linea_venta; DROP FUNCTION fn_linea_inmutable();"

# Nada contable se borra: las correcciones son anulaciones/ajustes auditados.
FN_NO_BORRAR = """
CREATE FUNCTION fn_no_borrar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'No se borra %: use una anulación con ajuste auditado', TG_TABLE_NAME;
END $$;
CREATE TRIGGER tg_no_borrar BEFORE DELETE ON venta FOR EACH ROW EXECUTE FUNCTION fn_no_borrar();
CREATE TRIGGER tg_no_borrar BEFORE DELETE ON pago FOR EACH ROW EXECUTE FUNCTION fn_no_borrar();
CREATE TRIGGER tg_no_borrar BEFORE DELETE ON linea_venta FOR EACH ROW EXECUTE FUNCTION fn_no_borrar();
"""
FN_NO_BORRAR_ATRAS = """
DROP TRIGGER tg_no_borrar ON linea_venta;
DROP TRIGGER tg_no_borrar ON pago;
DROP TRIGGER tg_no_borrar ON venta;
DROP FUNCTION fn_no_borrar();
"""
