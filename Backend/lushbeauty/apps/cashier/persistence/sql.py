"""Reglas que la base impone por su cuenta sobre `cierre_caja`."""

# Nada contable se borra; y un cierre aprobado queda congelado.
FN_CIERRE_INMUTABLE = """
CREATE FUNCTION fn_cierre_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Un cierre de caja no se borra';
    END IF;
    IF OLD.aprobado_por IS NOT NULL THEN
        RAISE EXCEPTION 'Un cierre de caja aprobado no se modifica';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_cierre_inmutable BEFORE UPDATE OR DELETE ON cierre_caja
    FOR EACH ROW EXECUTE FUNCTION fn_cierre_inmutable();
"""
FN_CIERRE_INMUTABLE_ATRAS = "DROP TRIGGER tg_cierre_inmutable ON cierre_caja; DROP FUNCTION fn_cierre_inmutable();"
