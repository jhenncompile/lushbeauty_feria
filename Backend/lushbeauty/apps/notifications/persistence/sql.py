"""RLS del outbox. El publicador no tiene petición ni salón: necesita *listar* qué salones tienen eventos
pendientes. Se le da solo lectura (SELECT) cuando declara `app.publicador = 'on'`; escribir y tomar lotes
sigue exigiendo fijar `app.salon_id`."""

POLITICA_PUBLICADOR = """
CREATE POLICY lectura_publicador ON evento_outbox FOR SELECT
    USING (current_setting('app.publicador', true) = 'on');
"""
POLITICA_PUBLICADOR_ATRAS = "DROP POLICY IF EXISTS lectura_publicador ON evento_outbox;"
