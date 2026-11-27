"""Reglas que la base impone por su cuenta sobre `liquidacion` y `movimiento_nomina` (RN-05)."""

FN_LIQUIDACION_INMUTABLE = """
CREATE FUNCTION fn_liquidacion_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.estado <> 'BORRADOR' THEN
        IF TG_OP = 'UPDATE' THEN
            -- tras aprobar solo se permite marcar como pagada y adjuntar el comprobante
            IF NEW.estado IN (OLD.estado, 'PAGADA')
               AND (OLD.comprobante_url IS NULL OR NEW.comprobante_url = OLD.comprobante_url)
               AND to_jsonb(NEW) - 'estado' - 'comprobante_url' = to_jsonb(OLD) - 'estado' - 'comprobante_url' THEN
                RETURN NEW;
            END IF;
        END IF;
        RAISE EXCEPTION 'RN-05: la liquidación aprobada es inmutable';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Una liquidación no se borra';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_liquidacion_inmutable BEFORE UPDATE OR DELETE ON liquidacion
    FOR EACH ROW EXECUTE FUNCTION fn_liquidacion_inmutable();
"""
FN_LIQUIDACION_INMUTABLE_ATRAS = "DROP TRIGGER tg_liquidacion_inmutable ON liquidacion; DROP FUNCTION fn_liquidacion_inmutable();"

# Nada entra ni sale de una liquidación aprobada; y un movimiento nunca se borra.
FN_MOVIMIENTO_CERRADO = """
CREATE FUNCTION fn_movimiento_cerrado() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    anterior uuid;
    nueva uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Un movimiento de nómina no se borra: registre un ajuste';
    END IF;
    IF TG_OP = 'UPDATE' THEN anterior := OLD.liquidacion_id; END IF;
    nueva := NEW.liquidacion_id;
    IF EXISTS (SELECT 1 FROM liquidacion WHERE id IN (anterior, nueva) AND estado <> 'BORRADOR') THEN
        RAISE EXCEPTION 'RN-05: la liquidación ya está aprobada';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_movimiento_cerrado BEFORE INSERT OR UPDATE OR DELETE ON movimiento_nomina
    FOR EACH ROW EXECUTE FUNCTION fn_movimiento_cerrado();
"""
FN_MOVIMIENTO_CERRADO_ATRAS = "DROP TRIGGER tg_movimiento_cerrado ON movimiento_nomina; DROP FUNCTION fn_movimiento_cerrado();"
