"""Reglas que la base impone por su cuenta sobre `regla_comision`."""

# Una sola versión vigente por día y ámbito (especialista o general). `btree_gist` es una extensión
# de confianza: la crea el dueño de la base, sin superusuario.
EXT_BTREE_GIST = "CREATE EXTENSION IF NOT EXISTS btree_gist;"
EXCLUIR_SOLAPE = """
ALTER TABLE regla_comision ADD CONSTRAINT ex_regla_comision_vigencia EXCLUDE USING gist (
    salon_id WITH =,
    (coalesce(especialista_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
    daterange(vigente_desde, vigente_hasta, '[]') WITH &&
);
"""
EXCLUIR_SOLAPE_ATRAS = "ALTER TABLE regla_comision DROP CONSTRAINT ex_regla_comision_vigencia;"

# CP-09: una política ya publicada no se edita ni se borra; solo se le pone fecha de fin (una vez).
FN_REGLA_INMUTABLE = """
CREATE FUNCTION fn_regla_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'CP-09: una regla de comisión no se borra; publique una versión nueva';
    END IF;
    IF OLD.vigente_hasta IS NOT NULL
       OR to_jsonb(NEW) - 'vigente_hasta' <> to_jsonb(OLD) - 'vigente_hasta' THEN
        RAISE EXCEPTION 'CP-09: una regla de comisión publicada no se modifica; publique una versión nueva';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_regla_inmutable BEFORE UPDATE OR DELETE ON regla_comision
    FOR EACH ROW EXECUTE FUNCTION fn_regla_inmutable();
"""
FN_REGLA_INMUTABLE_ATRAS = "DROP TRIGGER tg_regla_inmutable ON regla_comision; DROP FUNCTION fn_regla_inmutable();"
