"""SQL de la auditoría: bitácora de solo inserción y trigger genérico de historial."""

FN_SOLO_INSERCION = """
CREATE FUNCTION fn_solo_insercion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'La tabla % es de solo inserción', TG_TABLE_NAME;
END $$;
"""

# Copia, para las tablas del módulo, el patrón del esquema `db/LushBeauty_feria_postgresql.sql`:
# toma salón y usuario de la sesión (`app.salon_id`, `app.usuario_id`) y nunca guarda la contraseña.
FN_AUDITAR = """
CREATE FUNCTION fn_auditar() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    antes jsonb;
    despues jsonb;
    fila jsonb;
    operacion text;
BEGIN
    IF TG_OP <> 'INSERT' THEN antes := to_jsonb(OLD) - 'password_hash'; END IF;
    IF TG_OP <> 'DELETE' THEN despues := to_jsonb(NEW) - 'password_hash'; END IF;
    fila := coalesce(despues, antes);
    operacion := CASE TG_OP WHEN 'INSERT' THEN 'CREAR' WHEN 'UPDATE' THEN 'MODIFICAR' ELSE 'ELIMINAR' END;
    IF TG_OP = 'UPDATE' AND despues ->> 'estado' = 'APROBADA' AND antes ->> 'estado' <> 'APROBADA' THEN
        operacion := 'APROBAR';
    END IF;
    INSERT INTO auditoria (id, salon_id, usuario_id, accion, entidad, entidad_id,
                           valor_anterior, valor_nuevo, direccion_ip, ocurrido_en)
    VALUES (
        gen_random_uuid(),
        coalesce(CASE WHEN TG_TABLE_NAME = 'salon' THEN fila ->> 'id' ELSE fila ->> 'salon_id' END,
                 nullif(current_setting('app.salon_id', true), ''))::uuid,
        nullif(current_setting('app.usuario_id', true), '')::uuid,
        operacion, TG_TABLE_NAME, (fila ->> 'id')::uuid, antes, despues, inet_client_addr(), now());
    RETURN NULL;
END $$;
"""

SOLO_INSERCION_TRIGGERS = """
CREATE TRIGGER tg_auditoria_solo_insercion BEFORE UPDATE OR DELETE ON auditoria
    FOR EACH ROW EXECUTE FUNCTION fn_solo_insercion();
CREATE TRIGGER tg_auditoria_truncate BEFORE TRUNCATE ON auditoria
    FOR EACH STATEMENT EXECUTE FUNCTION fn_solo_insercion();
"""


def sql_activar_auditoria(tabla: str) -> tuple[str, str]:
    """SQL (adelante, atrás) para que cada escritura de `tabla` deje una fila en `auditoria`."""
    adelante = (
        f"CREATE TRIGGER tg_auditar AFTER INSERT OR UPDATE OR DELETE ON {tabla} "
        "FOR EACH ROW EXECUTE FUNCTION fn_auditar();"
    )
    atras = f"DROP TRIGGER IF EXISTS tg_auditar ON {tabla};"
    return adelante, atras
