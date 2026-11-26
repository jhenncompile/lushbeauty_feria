-- Lush Beauty Smart DSS - esquema PostgreSQL 15+ (generado del mismo modelo que el diagrama UML)
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE accion_auditoria AS ENUM ('CREAR', 'MODIFICAR', 'ELIMINAR', 'APROBAR', 'INICIAR_SESION', 'ACCESO_DENEGADO', 'CONSULTAR', 'EXPORTAR');
CREATE TYPE base_comision AS ENUM ('PRECIO_LISTA', 'PRECIO_COBRADO');
CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'QR', 'TRANSFERENCIA', 'TARJETA');
CREATE TYPE estado_venta AS ENUM ('PENDIENTE', 'CONFIRMADA', 'REQUIERE_REVISION', 'ANULADA');
CREATE TYPE origen_venta AS ENUM ('WEB', 'PWA_OFFLINE', 'IMPORTACION');
CREATE TYPE estado_liquidacion AS ENUM ('BORRADOR', 'APROBADA', 'PAGADA');
CREATE TYPE tipo_movimiento AS ENUM ('ADELANTO', 'FALTA', 'MATERIAL', 'EXCEDENTE', 'AJUSTE');
CREATE TYPE estado_importacion AS ENUM ('EN_REVISION', 'CONFIRMADA', 'RECHAZADA');
CREATE TYPE estado_fila AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');
CREATE TYPE tipo_alerta AS ENUM ('DESCUENTO_EXCEDIDO', 'PAGO_DESCUADRADO', 'DIFERENCIA_CAJA', 'SIN_CATALOGO', 'EDICION_TARDIA', 'CLAVE_REPETIDA');
CREATE TYPE estado_alerta AS ENUM ('PENDIENTE', 'REVISADA');
CREATE TYPE estado_evento AS ENUM ('PENDIENTE', 'ENVIADO', 'FALLIDO');
CREATE TYPE tipo_decision AS ENUM ('DESCUENTO', 'PRECIO', 'COMISION');
CREATE TYPE estado_decision AS ENUM ('EN_ANALISIS', 'APROBADA', 'RECHAZADA', 'REVISADA');

-- Salon: Negocio (inquilino).
CREATE TABLE salon (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre varchar(120) NOT NULL,
    moneda char(3) NOT NULL DEFAULT 'BOB',
    descuento_maximo numeric(5,4) NOT NULL DEFAULT 0.50,
    CONSTRAINT pk_salon PRIMARY KEY (id),
    CONSTRAINT ck_salon_01 CHECK (descuento_maximo BETWEEN 0 AND 1)
);

-- Usuario: Cuenta de acceso. Sus permisos provienen de sus roles.
CREATE TABLE usuario (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    nombre varchar(120) NOT NULL,
    email varchar(160) NOT NULL,
    password_hash varchar(255) NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uq_usuario_01 UNIQUE (salon_id, email),
    CONSTRAINT uq_usuario_tenant UNIQUE (salon_id, id)
);

-- Rol: Administradora, Especialista o Lector de reportes.
CREATE TABLE rol (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30) NOT NULL,
    nombre varchar(60) NOT NULL,
    descripcion varchar(200),
    CONSTRAINT pk_rol PRIMARY KEY (id),
    CONSTRAINT uq_rol_codigo UNIQUE (codigo)
);

-- Permiso: Operación que se puede autorizar.
CREATE TABLE permiso (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(60) NOT NULL,
    modulo varchar(40) NOT NULL,
    descripcion varchar(200) NOT NULL,
    CONSTRAINT pk_permiso PRIMARY KEY (id),
    CONSTRAINT uq_permiso_codigo UNIQUE (codigo)
);

-- RolPermiso: Permisos de cada rol.
CREATE TABLE rol_permiso (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    CONSTRAINT pk_rol_permiso PRIMARY KEY (id),
    CONSTRAINT uq_rol_permiso_01 UNIQUE (rol_id, permiso_id)
);

-- UsuarioRol: Una persona puede tener más de un rol.
CREATE TABLE usuario_rol (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    asignado_por uuid,
    asignado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_usuario_rol PRIMARY KEY (id),
    CONSTRAINT uq_usuario_rol_01 UNIQUE (usuario_id, rol_id)
);

-- Especialista: Persona que atiende y recibe liquidación.
CREATE TABLE especialista (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    usuario_id uuid,
    nombre varchar(120) NOT NULL,
    sueldo_fijo numeric(12,2) NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT pk_especialista PRIMARY KEY (id),
    CONSTRAINT uq_especialista_usuario_id UNIQUE (salon_id, usuario_id),
    CONSTRAINT uq_especialista_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_especialista_01 CHECK (sueldo_fijo >= 0)
);

-- Cliente: Ficha mínima de clienta.
CREATE TABLE cliente (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    nombre varchar(120) NOT NULL,
    telefono varchar(30),
    notas text,
    CONSTRAINT pk_cliente PRIMARY KEY (id),
    CONSTRAINT uq_cliente_tenant UNIQUE (salon_id, id)
);

-- Servicio: Catálogo oficial.
CREATE TABLE servicio (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    categoria varchar(60) NOT NULL,
    nombre varchar(120) NOT NULL,
    precio_lista numeric(12,2) NOT NULL,
    costo_materiales numeric(12,2),
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT pk_servicio PRIMARY KEY (id),
    CONSTRAINT uq_servicio_01 UNIQUE (salon_id, nombre),
    CONSTRAINT uq_servicio_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_servicio_01 CHECK (precio_lista >= 0),
    CONSTRAINT ck_servicio_02 CHECK (costo_materiales IS NULL OR costo_materiales >= 0)
);

-- ReglaComision: Regla con vigencia. Sin especialista = regla general.
CREATE TABLE regla_comision (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    especialista_id uuid,
    porcentaje numeric(5,4) NOT NULL,
    base base_comision NOT NULL,
    vigente_desde date NOT NULL,
    vigente_hasta date,
    CONSTRAINT pk_regla_comision PRIMARY KEY (id),
    CONSTRAINT uq_regla_comision_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_regla_comision_01 CHECK (porcentaje BETWEEN 0 AND 1),
    CONSTRAINT ck_regla_comision_02 CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde)
);

-- Venta: uuid_cliente evita duplicados al sincronizar (RN-01).
CREATE TABLE venta (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    cliente_id uuid,
    registrado_por uuid NOT NULL,
    uuid_cliente uuid NOT NULL,
    fecha_servicio timestamptz NOT NULL,
    registrada_en timestamptz NOT NULL DEFAULT now(),
    estado estado_venta NOT NULL DEFAULT 'PENDIENTE',
    origen origen_venta NOT NULL DEFAULT 'WEB',
    motivo_anulacion varchar(250),
    CONSTRAINT pk_venta PRIMARY KEY (id),
    CONSTRAINT uq_venta_01 UNIQUE (salon_id, uuid_cliente),
    CONSTRAINT uq_venta_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_venta_01 CHECK (estado <> 'ANULADA' OR motivo_anulacion IS NOT NULL)
);

-- LineaVenta: Copia el precio y la regla aplicados (RN-02).
CREATE TABLE linea_venta (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    venta_id uuid NOT NULL,
    servicio_id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    regla_comision_id uuid NOT NULL,
    liquidacion_id uuid,
    cantidad integer NOT NULL DEFAULT 1,
    precio_lista numeric(12,2) NOT NULL,
    descuento numeric(12,2) NOT NULL DEFAULT 0,
    motivo_descuento varchar(200),
    importe_cobrado numeric(12,2) NOT NULL,
    base_comision base_comision NOT NULL,
    tasa_comision numeric(5,4) NOT NULL,
    comision numeric(12,2) NOT NULL,
    costo_materiales numeric(12,2),
    propina numeric(12,2) NOT NULL DEFAULT 0,
    metodo_propina metodo_pago,
    CONSTRAINT pk_linea_venta PRIMARY KEY (id),
    CONSTRAINT ck_linea_venta_01 CHECK (cantidad > 0),
    CONSTRAINT ck_linea_venta_02 CHECK (descuento >= 0),
    CONSTRAINT ck_linea_venta_03 CHECK (importe_cobrado >= 0),
    CONSTRAINT ck_linea_venta_04 CHECK (propina >= 0),
    CONSTRAINT ck_linea_venta_05 CHECK (importe_cobrado = precio_lista * cantidad - descuento),
    CONSTRAINT ck_linea_venta_06 CHECK (descuento = 0 OR motivo_descuento IS NOT NULL),
    CONSTRAINT ck_linea_venta_07 CHECK (comision = round(CASE base_comision WHEN 'PRECIO_LISTA' THEN precio_lista * cantidad ELSE importe_cobrado END * tasa_comision, 2)),
    CONSTRAINT ck_linea_venta_08 CHECK (propina = 0 OR metodo_propina IS NOT NULL)
);

-- Pago: Permite pagos divididos (RN-04).
CREATE TABLE pago (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    venta_id uuid NOT NULL,
    metodo metodo_pago NOT NULL,
    monto numeric(12,2) NOT NULL,
    pagado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_pago PRIMARY KEY (id),
    CONSTRAINT ck_pago_01 CHECK (monto > 0)
);

-- CierreCaja: Una fila por día y método de pago. Diferencia = declarado - esperado.
CREATE TABLE cierre_caja (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    fecha date NOT NULL,
    metodo metodo_pago NOT NULL,
    esperado numeric(12,2) NOT NULL,
    declarado numeric(12,2) NOT NULL,
    justificacion text,
    aprobado_por uuid,
    aprobado_en timestamptz,
    CONSTRAINT pk_cierre_caja PRIMARY KEY (id),
    CONSTRAINT uq_cierre_caja_01 UNIQUE (salon_id, fecha, metodo),
    CONSTRAINT ck_cierre_caja_01 CHECK (aprobado_por IS NULL OR declarado = esperado OR justificacion IS NOT NULL)
);

-- Liquidacion: Liquidación semanal por especialista.
CREATE TABLE liquidacion (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fin date NOT NULL,
    estado estado_liquidacion NOT NULL DEFAULT 'BORRADOR',
    sueldo_fijo numeric(12,2) NOT NULL DEFAULT 0,
    total_comision numeric(12,2) NOT NULL DEFAULT 0,
    total_propina numeric(12,2) NOT NULL DEFAULT 0,
    total_movimientos numeric(12,2) NOT NULL DEFAULT 0,
    neto numeric(12,2) NOT NULL DEFAULT 0,
    excedente numeric(12,2) NOT NULL DEFAULT 0,
    aprobada_por uuid,
    aprobada_en timestamptz,
    comprobante_url varchar(300),
    CONSTRAINT pk_liquidacion PRIMARY KEY (id),
    CONSTRAINT uq_liquidacion_01 UNIQUE (salon_id, especialista_id, periodo_inicio),
    CONSTRAINT uq_liquidacion_02 UNIQUE (salon_id, especialista_id, id),
    CONSTRAINT uq_liquidacion_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_liquidacion_01 CHECK (periodo_fin >= periodo_inicio),
    CONSTRAINT ck_liquidacion_02 CHECK (neto >= 0),
    CONSTRAINT ck_liquidacion_03 CHECK (excedente >= 0),
    CONSTRAINT ck_liquidacion_04 CHECK (neto = 0 OR excedente = 0),
    CONSTRAINT ck_liquidacion_05 CHECK (neto - excedente = sueldo_fijo + total_comision + total_propina + total_movimientos),
    CONSTRAINT ck_liquidacion_06 CHECK (estado = 'BORRADOR' OR aprobada_por IS NOT NULL)
);

-- MovimientoNomina: Deducciones (monto negativo), excedentes y ajustes.
CREATE TABLE movimiento_nomina (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    liquidacion_id uuid,
    tipo tipo_movimiento NOT NULL,
    monto numeric(12,2) NOT NULL,
    motivo varchar(250) NOT NULL,
    fecha date NOT NULL,
    CONSTRAINT pk_movimiento_nomina PRIMARY KEY (id),
    CONSTRAINT ck_movimiento_nomina_01 CHECK (monto <> 0),
    CONSTRAINT ck_movimiento_nomina_02 CHECK (tipo = 'AJUSTE' OR monto < 0)
);

-- Importacion: Planilla XLSX cargada.
CREATE TABLE importacion (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nombre_archivo varchar(200) NOT NULL,
    hash_archivo char(64) NOT NULL,
    estado estado_importacion NOT NULL DEFAULT 'EN_REVISION',
    cargada_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_importacion PRIMARY KEY (id),
    CONSTRAINT uq_importacion_01 UNIQUE (salon_id, hash_archivo),
    CONSTRAINT uq_importacion_tenant UNIQUE (salon_id, id)
);

-- FilaImportacion: Las filas aceptadas sirven como alias conocidos.
CREATE TABLE fila_importacion (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    importacion_id uuid NOT NULL,
    servicio_id uuid,
    venta_id uuid,
    hoja varchar(80) NOT NULL,
    numero_fila integer NOT NULL,
    datos_originales jsonb NOT NULL,
    texto_servicio varchar(160) NOT NULL,
    estado estado_fila NOT NULL DEFAULT 'PENDIENTE',
    observacion varchar(250),
    CONSTRAINT pk_fila_importacion PRIMARY KEY (id),
    CONSTRAINT uq_fila_importacion_01 UNIQUE (importacion_id, hoja, numero_fila),
    CONSTRAINT ck_fila_importacion_01 CHECK (estado <> 'ACEPTADA' OR servicio_id IS NOT NULL),
    CONSTRAINT ck_fila_importacion_02 CHECK (estado <> 'RECHAZADA' OR observacion IS NOT NULL)
);

-- Alerta: Alertas de Lush Guard.
CREATE TABLE alerta (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    tipo tipo_alerta NOT NULL,
    entidad varchar(60) NOT NULL,
    entidad_id uuid NOT NULL,
    detalle text NOT NULL,
    estado estado_alerta NOT NULL DEFAULT 'PENDIENTE',
    revisada_por uuid,
    creada_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_alerta PRIMARY KEY (id)
);

-- Auditoria: Historial por usuario, de solo inserción; incluye consultas de Lush Insight.
CREATE TABLE auditoria (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    usuario_id uuid,
    permiso_id uuid,
    accion accion_auditoria NOT NULL,
    entidad varchar(60) NOT NULL,
    entidad_id uuid,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    direccion_ip inet,
    ocurrido_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_auditoria PRIMARY KEY (id)
);

-- EventoOutbox: Eventos aprobados que consume n8n.
CREATE TABLE evento_outbox (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    tipo varchar(60) NOT NULL,
    entidad_id uuid NOT NULL,
    payload jsonb NOT NULL,
    estado estado_evento NOT NULL DEFAULT 'PENDIENTE',
    intentos integer NOT NULL DEFAULT 0,
    ultimo_error text,
    creado_en timestamptz NOT NULL DEFAULT now(),
    enviado_en timestamptz,
    CONSTRAINT pk_evento_outbox PRIMARY KEY (id),
    CONSTRAINT uq_evento_outbox_01 UNIQUE (salon_id, tipo, entidad_id),
    CONSTRAINT ck_evento_outbox_01 CHECK (intentos >= 0)
);

-- Decision: Problema, pesos, recomendación, aprobación y seguimiento.
CREATE TABLE decision (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    servicio_id uuid NOT NULL,
    creada_por uuid NOT NULL,
    tipo tipo_decision NOT NULL,
    titulo varchar(150) NOT NULL,
    estado estado_decision NOT NULL DEFAULT 'EN_ANALISIS',
    peso_contribucion numeric(5,4) NOT NULL DEFAULT 0.40,
    peso_liquidez numeric(5,4) NOT NULL DEFAULT 0.25,
    peso_riesgo numeric(5,4) NOT NULL DEFAULT 0.20,
    peso_facilidad numeric(5,4) NOT NULL DEFAULT 0.15,
    supuestos text NOT NULL,
    recomendacion text,
    escenario_elegido_id uuid,
    aprobada_por uuid,
    aprobada_en timestamptz,
    motivo text,
    valor_esperado numeric(12,2),
    fecha_revision date,
    valor_observado numeric(12,2),
    comentario_revision text,
    CONSTRAINT pk_decision PRIMARY KEY (id),
    CONSTRAINT uq_decision_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_decision_01 CHECK (peso_contribucion + peso_liquidez + peso_riesgo + peso_facilidad = 1),
    CONSTRAINT ck_decision_02 CHECK (least(peso_contribucion, peso_liquidez, peso_riesgo, peso_facilidad) >= 0),
    CONSTRAINT ck_decision_03 CHECK (estado NOT IN ('APROBADA','REVISADA') OR (escenario_elegido_id IS NOT NULL AND aprobada_por IS NOT NULL AND fecha_revision IS NOT NULL))
);

-- Escenario: Alternativa What-If; no modifica ventas.
CREATE TABLE escenario (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    salon_id uuid NOT NULL,
    decision_id uuid NOT NULL,
    nombre varchar(80) NOT NULL,
    precio_lista numeric(12,2) NOT NULL,
    tasa_descuento numeric(5,4) NOT NULL DEFAULT 0,
    tasa_comision numeric(5,4) NOT NULL,
    base_comision base_comision NOT NULL,
    costo_materiales numeric(12,2),
    cantidad_supuesta integer NOT NULL,
    puntaje_contribucion numeric(3,2) NOT NULL,
    puntaje_liquidez numeric(3,2) NOT NULL,
    puntaje_riesgo numeric(3,2) NOT NULL,
    puntaje_facilidad numeric(3,2) NOT NULL,
    CONSTRAINT pk_escenario PRIMARY KEY (id),
    CONSTRAINT uq_escenario_01 UNIQUE (decision_id, nombre),
    CONSTRAINT uq_escenario_02 UNIQUE (salon_id, decision_id, id),
    CONSTRAINT uq_escenario_tenant UNIQUE (salon_id, id),
    CONSTRAINT ck_escenario_01 CHECK (precio_lista >= 0),
    CONSTRAINT ck_escenario_02 CHECK (tasa_descuento BETWEEN 0 AND 1),
    CONSTRAINT ck_escenario_03 CHECK (tasa_comision BETWEEN 0 AND 1),
    CONSTRAINT ck_escenario_04 CHECK (cantidad_supuesta >= 0),
    CONSTRAINT ck_escenario_05 CHECK (least(puntaje_contribucion, puntaje_liquidez, puntaje_riesgo, puntaje_facilidad) >= 1),
    CONSTRAINT ck_escenario_06 CHECK (greatest(puntaje_contribucion, puntaje_liquidez, puntaje_riesgo, puntaje_facilidad) <= 5)
);

-- Claves foráneas. Entre tablas de un salón son compuestas (salon_id, id): impiden cruzar datos entre salones.
ALTER TABLE usuario ADD CONSTRAINT fk_usuario_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE rol_permiso ADD CONSTRAINT fk_rol_permiso_rol_id FOREIGN KEY (rol_id) REFERENCES rol (id);
ALTER TABLE rol_permiso ADD CONSTRAINT fk_rol_permiso_permiso_id FOREIGN KEY (permiso_id) REFERENCES permiso (id);
ALTER TABLE usuario_rol ADD CONSTRAINT fk_usuario_rol_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE usuario_rol ADD CONSTRAINT fk_usuario_rol_usuario_id FOREIGN KEY (salon_id, usuario_id) REFERENCES usuario (salon_id, id);
ALTER TABLE usuario_rol ADD CONSTRAINT fk_usuario_rol_rol_id FOREIGN KEY (rol_id) REFERENCES rol (id);
ALTER TABLE usuario_rol ADD CONSTRAINT fk_usuario_rol_asignado_por FOREIGN KEY (salon_id, asignado_por) REFERENCES usuario (salon_id, id);
ALTER TABLE especialista ADD CONSTRAINT fk_especialista_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE especialista ADD CONSTRAINT fk_especialista_usuario_id FOREIGN KEY (salon_id, usuario_id) REFERENCES usuario (salon_id, id);
ALTER TABLE cliente ADD CONSTRAINT fk_cliente_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE servicio ADD CONSTRAINT fk_servicio_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE regla_comision ADD CONSTRAINT fk_regla_comision_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE regla_comision ADD CONSTRAINT fk_regla_comision_especialista_id FOREIGN KEY (salon_id, especialista_id) REFERENCES especialista (salon_id, id);
ALTER TABLE venta ADD CONSTRAINT fk_venta_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE venta ADD CONSTRAINT fk_venta_cliente_id FOREIGN KEY (salon_id, cliente_id) REFERENCES cliente (salon_id, id);
ALTER TABLE venta ADD CONSTRAINT fk_venta_registrado_por FOREIGN KEY (salon_id, registrado_por) REFERENCES usuario (salon_id, id);
ALTER TABLE linea_venta ADD CONSTRAINT fk_linea_venta_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE linea_venta ADD CONSTRAINT fk_linea_venta_venta_id FOREIGN KEY (salon_id, venta_id) REFERENCES venta (salon_id, id);
ALTER TABLE linea_venta ADD CONSTRAINT fk_linea_venta_servicio_id FOREIGN KEY (salon_id, servicio_id) REFERENCES servicio (salon_id, id);
ALTER TABLE linea_venta ADD CONSTRAINT fk_linea_venta_especialista_id FOREIGN KEY (salon_id, especialista_id) REFERENCES especialista (salon_id, id);
ALTER TABLE linea_venta ADD CONSTRAINT fk_linea_venta_regla_comision_id FOREIGN KEY (salon_id, regla_comision_id) REFERENCES regla_comision (salon_id, id);
ALTER TABLE linea_venta ADD CONSTRAINT fk_linea_venta_liquidacion_id FOREIGN KEY (salon_id, especialista_id, liquidacion_id) REFERENCES liquidacion (salon_id, especialista_id, id);
ALTER TABLE pago ADD CONSTRAINT fk_pago_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE pago ADD CONSTRAINT fk_pago_venta_id FOREIGN KEY (salon_id, venta_id) REFERENCES venta (salon_id, id);
ALTER TABLE cierre_caja ADD CONSTRAINT fk_cierre_caja_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE cierre_caja ADD CONSTRAINT fk_cierre_caja_aprobado_por FOREIGN KEY (salon_id, aprobado_por) REFERENCES usuario (salon_id, id);
ALTER TABLE liquidacion ADD CONSTRAINT fk_liquidacion_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE liquidacion ADD CONSTRAINT fk_liquidacion_especialista_id FOREIGN KEY (salon_id, especialista_id) REFERENCES especialista (salon_id, id);
ALTER TABLE liquidacion ADD CONSTRAINT fk_liquidacion_aprobada_por FOREIGN KEY (salon_id, aprobada_por) REFERENCES usuario (salon_id, id);
ALTER TABLE movimiento_nomina ADD CONSTRAINT fk_movimiento_nomina_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE movimiento_nomina ADD CONSTRAINT fk_movimiento_nomina_especialista_id FOREIGN KEY (salon_id, especialista_id) REFERENCES especialista (salon_id, id);
ALTER TABLE movimiento_nomina ADD CONSTRAINT fk_movimiento_nomina_liquidacion_id FOREIGN KEY (salon_id, especialista_id, liquidacion_id) REFERENCES liquidacion (salon_id, especialista_id, id);
ALTER TABLE importacion ADD CONSTRAINT fk_importacion_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE importacion ADD CONSTRAINT fk_importacion_usuario_id FOREIGN KEY (salon_id, usuario_id) REFERENCES usuario (salon_id, id);
ALTER TABLE fila_importacion ADD CONSTRAINT fk_fila_importacion_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE fila_importacion ADD CONSTRAINT fk_fila_importacion_importacion_id FOREIGN KEY (salon_id, importacion_id) REFERENCES importacion (salon_id, id);
ALTER TABLE fila_importacion ADD CONSTRAINT fk_fila_importacion_servicio_id FOREIGN KEY (salon_id, servicio_id) REFERENCES servicio (salon_id, id);
ALTER TABLE fila_importacion ADD CONSTRAINT fk_fila_importacion_venta_id FOREIGN KEY (salon_id, venta_id) REFERENCES venta (salon_id, id);
ALTER TABLE alerta ADD CONSTRAINT fk_alerta_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE alerta ADD CONSTRAINT fk_alerta_revisada_por FOREIGN KEY (salon_id, revisada_por) REFERENCES usuario (salon_id, id);
ALTER TABLE auditoria ADD CONSTRAINT fk_auditoria_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE auditoria ADD CONSTRAINT fk_auditoria_usuario_id FOREIGN KEY (salon_id, usuario_id) REFERENCES usuario (salon_id, id);
ALTER TABLE auditoria ADD CONSTRAINT fk_auditoria_permiso_id FOREIGN KEY (permiso_id) REFERENCES permiso (id);
ALTER TABLE evento_outbox ADD CONSTRAINT fk_evento_outbox_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE decision ADD CONSTRAINT fk_decision_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE decision ADD CONSTRAINT fk_decision_servicio_id FOREIGN KEY (salon_id, servicio_id) REFERENCES servicio (salon_id, id);
ALTER TABLE decision ADD CONSTRAINT fk_decision_creada_por FOREIGN KEY (salon_id, creada_por) REFERENCES usuario (salon_id, id);
ALTER TABLE decision ADD CONSTRAINT fk_decision_escenario_elegido_id FOREIGN KEY (salon_id, id, escenario_elegido_id) REFERENCES escenario (salon_id, decision_id, id);
ALTER TABLE decision ADD CONSTRAINT fk_decision_aprobada_por FOREIGN KEY (salon_id, aprobada_por) REFERENCES usuario (salon_id, id);
ALTER TABLE escenario ADD CONSTRAINT fk_escenario_salon_id FOREIGN KEY (salon_id) REFERENCES salon (id);
ALTER TABLE escenario ADD CONSTRAINT fk_escenario_decision_id FOREIGN KEY (salon_id, decision_id) REFERENCES decision (salon_id, id);

-- Índices
CREATE INDEX ix_rol_permiso_rol_id ON rol_permiso (rol_id);
CREATE INDEX ix_rol_permiso_permiso_id ON rol_permiso (permiso_id);
CREATE INDEX ix_usuario_rol_usuario_id ON usuario_rol (usuario_id);
CREATE INDEX ix_usuario_rol_rol_id ON usuario_rol (rol_id);
CREATE INDEX ix_usuario_rol_asignado_por ON usuario_rol (asignado_por);
CREATE INDEX ix_especialista_usuario_id ON especialista (usuario_id);
CREATE INDEX ix_regla_comision_especialista_id ON regla_comision (especialista_id);
CREATE INDEX ix_venta_cliente_id ON venta (cliente_id);
CREATE INDEX ix_venta_registrado_por ON venta (registrado_por);
CREATE INDEX ix_linea_venta_venta_id ON linea_venta (venta_id);
CREATE INDEX ix_linea_venta_servicio_id ON linea_venta (servicio_id);
CREATE INDEX ix_linea_venta_especialista_id ON linea_venta (especialista_id);
CREATE INDEX ix_linea_venta_regla_comision_id ON linea_venta (regla_comision_id);
CREATE INDEX ix_linea_venta_liquidacion_id ON linea_venta (liquidacion_id);
CREATE INDEX ix_pago_venta_id ON pago (venta_id);
CREATE INDEX ix_cierre_caja_aprobado_por ON cierre_caja (aprobado_por);
CREATE INDEX ix_liquidacion_especialista_id ON liquidacion (especialista_id);
CREATE INDEX ix_liquidacion_aprobada_por ON liquidacion (aprobada_por);
CREATE INDEX ix_movimiento_nomina_especialista_id ON movimiento_nomina (especialista_id);
CREATE INDEX ix_movimiento_nomina_liquidacion_id ON movimiento_nomina (liquidacion_id);
CREATE INDEX ix_importacion_usuario_id ON importacion (usuario_id);
CREATE INDEX ix_fila_importacion_importacion_id ON fila_importacion (importacion_id);
CREATE INDEX ix_fila_importacion_servicio_id ON fila_importacion (servicio_id);
CREATE INDEX ix_fila_importacion_venta_id ON fila_importacion (venta_id);
CREATE INDEX ix_alerta_revisada_por ON alerta (revisada_por);
CREATE INDEX ix_auditoria_usuario_id ON auditoria (usuario_id);
CREATE INDEX ix_auditoria_permiso_id ON auditoria (permiso_id);
CREATE INDEX ix_decision_servicio_id ON decision (servicio_id);
CREATE INDEX ix_decision_creada_por ON decision (creada_por);
CREATE INDEX ix_decision_escenario_elegido_id ON decision (escenario_elegido_id);
CREATE INDEX ix_decision_aprobada_por ON decision (aprobada_por);
CREATE INDEX ix_escenario_decision_id ON escenario (decision_id);
CREATE INDEX ix_usuario_salon ON usuario (salon_id);
CREATE INDEX ix_usuario_rol_salon ON usuario_rol (salon_id);
CREATE INDEX ix_especialista_salon ON especialista (salon_id);
CREATE INDEX ix_cliente_salon ON cliente (salon_id);
CREATE INDEX ix_servicio_salon ON servicio (salon_id);
CREATE INDEX ix_regla_comision_salon ON regla_comision (salon_id);
CREATE INDEX ix_venta_salon ON venta (salon_id);
CREATE INDEX ix_linea_venta_salon ON linea_venta (salon_id);
CREATE INDEX ix_pago_salon ON pago (salon_id);
CREATE INDEX ix_cierre_caja_salon ON cierre_caja (salon_id);
CREATE INDEX ix_liquidacion_salon ON liquidacion (salon_id);
CREATE INDEX ix_movimiento_nomina_salon ON movimiento_nomina (salon_id);
CREATE INDEX ix_importacion_salon ON importacion (salon_id);
CREATE INDEX ix_fila_importacion_salon ON fila_importacion (salon_id);
CREATE INDEX ix_alerta_salon ON alerta (salon_id);
CREATE INDEX ix_auditoria_salon ON auditoria (salon_id);
CREATE INDEX ix_evento_outbox_salon ON evento_outbox (salon_id);
CREATE INDEX ix_decision_salon ON decision (salon_id);
CREATE INDEX ix_escenario_salon ON escenario (salon_id);
CREATE INDEX ix_venta_fecha ON venta (salon_id, fecha_servicio);
CREATE INDEX ix_auditoria_entidad ON auditoria (salon_id, entidad, entidad_id);
CREATE INDEX ix_outbox_pendiente ON evento_outbox (creado_en) WHERE estado = 'PENDIENTE';

-- Roles, permisos y matriz inicial (se cargan antes de activar la auditoría)
INSERT INTO rol (codigo, nombre) VALUES ('ADMINISTRADORA','Administradora'), ('ESPECIALISTA','Especialista'), ('LECTOR','Contador / lector de reportes');
INSERT INTO permiso (codigo, modulo, descripcion) VALUES
    ('VENTA_REGISTRAR','Ventas','Registrar ventas y servicios'),
    ('VENTA_ANULAR','Ventas','Anular ventas'),
    ('DESCUENTO_APROBAR','Ventas','Autorizar descuentos'),
    ('CATALOGO_GESTIONAR','Catálogo','Modificar servicios y precios'),
    ('COMISION_GESTIONAR','Catálogo','Modificar reglas de comisión'),
    ('CAJA_CERRAR','Caja','Aprobar cierres de caja'),
    ('LIQUIDACION_VER_PROPIA','Nómina','Ver la liquidación propia'),
    ('LIQUIDACION_VER_TODAS','Nómina','Ver todas las liquidaciones'),
    ('LIQUIDACION_APROBAR','Nómina','Aprobar liquidaciones y movimientos'),
    ('IMPORTACION_GESTIONAR','Importación','Importar planillas'),
    ('ALERTA_REVISAR','Control','Revisar alertas'),
    ('DECISION_ANALIZAR','Decisiones','Crear escenarios y comparar'),
    ('DECISION_APROBAR','Decisiones','Aprobar decisiones'),
    ('REPORTE_VER','Reportes','Ver y exportar reportes agregados'),
    ('AUDITORIA_VER','Seguridad','Consultar el historial de acciones'),
    ('USUARIO_GESTIONAR','Seguridad','Gestionar usuarios y roles');
INSERT INTO rol_permiso (rol_id, permiso_id)
    SELECT r.id, p.id FROM rol r, permiso p WHERE r.codigo = 'ADMINISTRADORA' AND p.codigo IN ('VENTA_REGISTRAR', 'VENTA_ANULAR', 'DESCUENTO_APROBAR', 'CATALOGO_GESTIONAR', 'COMISION_GESTIONAR', 'CAJA_CERRAR', 'LIQUIDACION_VER_PROPIA', 'LIQUIDACION_VER_TODAS', 'LIQUIDACION_APROBAR', 'IMPORTACION_GESTIONAR', 'ALERTA_REVISAR', 'DECISION_ANALIZAR', 'DECISION_APROBAR', 'REPORTE_VER', 'AUDITORIA_VER', 'USUARIO_GESTIONAR');
INSERT INTO rol_permiso (rol_id, permiso_id)
    SELECT r.id, p.id FROM rol r, permiso p WHERE r.codigo = 'ESPECIALISTA' AND p.codigo IN ('VENTA_REGISTRAR', 'LIQUIDACION_VER_PROPIA');
INSERT INTO rol_permiso (rol_id, permiso_id)
    SELECT r.id, p.id FROM rol r, permiso p WHERE r.codigo = 'LECTOR' AND p.codigo IN ('REPORTE_VER');

-- Bitácora de solo inserción
CREATE FUNCTION fn_solo_insercion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'La bitácora es de solo inserción';
END $$;
CREATE TRIGGER tg_auditoria BEFORE UPDATE OR DELETE ON auditoria
    FOR EACH ROW EXECUTE FUNCTION fn_solo_insercion();

-- RN-04: en una venta confirmada, los pagos igualan a las líneas
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

-- RN-02: una línea confirmada solo puede asignarse a una liquidación
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

-- RN-05: nada entra ni sale de una liquidación aprobada
CREATE FUNCTION fn_detalle_cerrado() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    anterior uuid;
    nueva uuid;
BEGIN
    IF TG_OP <> 'INSERT' THEN anterior := OLD.liquidacion_id; END IF;
    IF TG_OP <> 'DELETE' THEN nueva := NEW.liquidacion_id; END IF;
    IF EXISTS (SELECT 1 FROM liquidacion WHERE id IN (anterior, nueva) AND estado <> 'BORRADOR') THEN
        RAISE EXCEPTION 'RN-05: la liquidación ya está aprobada';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_linea_liquidada BEFORE INSERT OR UPDATE OR DELETE ON linea_venta
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_cerrado();
CREATE TRIGGER tg_movimiento_liquidado BEFORE INSERT OR UPDATE OR DELETE ON movimiento_nomina
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_cerrado();

CREATE FUNCTION fn_liquidacion_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.estado <> 'BORRADOR' THEN
        IF TG_OP = 'UPDATE' THEN
            -- tras aprobar solo se permite marcar como pagada y adjuntar el PDF
            IF NEW.estado IN (OLD.estado, 'PAGADA')
               AND (OLD.comprobante_url IS NULL OR NEW.comprobante_url = OLD.comprobante_url)
               AND to_jsonb(NEW) - 'estado' - 'comprobante_url' = to_jsonb(OLD) - 'estado' - 'comprobante_url' THEN
                RETURN NEW;
            END IF;
        END IF;
        RAISE EXCEPTION 'RN-05: la liquidación aprobada es inmutable';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_liquidacion BEFORE UPDATE OR DELETE ON liquidacion
    FOR EACH ROW EXECUTE FUNCTION fn_liquidacion_inmutable();

-- DSS-CP07: tras decidir, los escenarios quedan congelados
CREATE FUNCTION fn_escenario_congelado() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE did uuid;
BEGIN
    IF TG_OP = 'INSERT' THEN did := NEW.decision_id; ELSE did := OLD.decision_id; END IF;
    IF EXISTS (SELECT 1 FROM decision WHERE id = did AND estado <> 'EN_ANALISIS') THEN
        RAISE EXCEPTION 'La decisión ya fue tomada; sus escenarios no se modifican';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_escenario BEFORE INSERT OR UPDATE OR DELETE ON escenario
    FOR EACH ROW EXECUTE FUNCTION fn_escenario_congelado();

-- Resultados del simulador: se calculan, no se almacenan
CREATE VIEW v_ranking_escenario WITH (security_invoker = true) AS
SELECT x.*, x.contribucion_unitaria * x.cantidad_supuesta AS contribucion_total
FROM (
    SELECT e.salon_id, e.decision_id, e.id AS escenario_id, e.nombre, e.cantidad_supuesta,
           round(e.precio_lista * (1 - e.tasa_descuento)
                 - e.tasa_comision * CASE e.base_comision WHEN 'PRECIO_LISTA' THEN e.precio_lista
                                          ELSE e.precio_lista * (1 - e.tasa_descuento) END
                 - coalesce(e.costo_materiales, 0), 2) AS contribucion_unitaria,
           e.costo_materiales IS NOT NULL AS datos_completos,
           round(d.peso_contribucion * e.puntaje_contribucion + d.peso_liquidez * e.puntaje_liquidez
                 + d.peso_riesgo * e.puntaje_riesgo + d.peso_facilidad * e.puntaje_facilidad, 2) AS puntaje,
           e.tasa_descuento <= s.descuento_maximo AS elegible
    FROM escenario e
    JOIN decision d ON d.id = e.decision_id
    JOIN salon s ON s.id = e.salon_id
) x;

-- Permisos: consulta que usa la API
CREATE FUNCTION fn_tiene_permiso(p_usuario uuid, p_codigo text) RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM usuario u
        JOIN usuario_rol ur ON ur.usuario_id = u.id
        JOIN rol_permiso rp ON rp.rol_id = ur.rol_id
        JOIN permiso p ON p.id = rp.permiso_id
        WHERE u.id = p_usuario AND u.activo AND p.codigo = p_codigo)
$$;

-- Las aprobaciones exigen el permiso correspondiente
CREATE FUNCTION fn_exigir_permiso() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    nuevo uuid := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
    previo uuid;
BEGIN
    IF TG_OP = 'UPDATE' THEN previo := (to_jsonb(OLD) ->> TG_ARGV[0])::uuid; END IF;
    IF nuevo IS NOT NULL AND nuevo IS DISTINCT FROM previo AND NOT fn_tiene_permiso(nuevo, TG_ARGV[1]) THEN
        RAISE EXCEPTION 'El usuario no tiene el permiso %', TG_ARGV[1];
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER tg_permiso_liquidacion BEFORE INSERT OR UPDATE ON liquidacion
    FOR EACH ROW EXECUTE FUNCTION fn_exigir_permiso('aprobada_por', 'LIQUIDACION_APROBAR');
CREATE TRIGGER tg_permiso_caja BEFORE INSERT OR UPDATE ON cierre_caja
    FOR EACH ROW EXECUTE FUNCTION fn_exigir_permiso('aprobado_por', 'CAJA_CERRAR');
CREATE TRIGGER tg_permiso_decision BEFORE INSERT OR UPDATE ON decision
    FOR EACH ROW EXECUTE FUNCTION fn_exigir_permiso('aprobada_por', 'DECISION_APROBAR');

-- Historial automático. La API ejecuta en cada transacción:
--   SET LOCAL app.salon_id = '<uuid>';  SET LOCAL app.usuario_id = '<uuid>';
CREATE FUNCTION fn_auditar() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    antes jsonb;
    despues jsonb;
    fila jsonb;
    operacion accion_auditoria;
BEGIN
    IF TG_OP <> 'INSERT' THEN antes := to_jsonb(OLD) - 'password_hash'; END IF;
    IF TG_OP <> 'DELETE' THEN despues := to_jsonb(NEW) - 'password_hash'; END IF;
    fila := coalesce(despues, antes);
    operacion := CASE TG_OP WHEN 'INSERT' THEN 'CREAR' WHEN 'UPDATE' THEN 'MODIFICAR' ELSE 'ELIMINAR' END;
    IF TG_OP = 'UPDATE' AND despues ->> 'estado' = 'APROBADA' AND antes ->> 'estado' <> 'APROBADA' THEN
        operacion := 'APROBAR';
    END IF;
    INSERT INTO auditoria (salon_id, usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, direccion_ip)
    VALUES (
        coalesce(CASE WHEN TG_TABLE_NAME = 'salon' THEN fila ->> 'id' ELSE fila ->> 'salon_id' END,
                 nullif(current_setting('app.salon_id', true), ''))::uuid,
        nullif(current_setting('app.usuario_id', true), '')::uuid,
        operacion, TG_TABLE_NAME, (fila ->> 'id')::uuid, antes, despues, inet_client_addr());
    RETURN NULL;
END $$;
DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables
             WHERE schemaname = current_schema() AND tablename NOT IN ('auditoria', 'evento_outbox')
    LOOP
        EXECUTE format('CREATE TRIGGER tg_auditar AFTER INSERT OR UPDATE OR DELETE ON %I '
                       'FOR EACH ROW EXECUTE FUNCTION fn_auditar()', t);
    END LOOP;
END $$;
CREATE TRIGGER tg_auditoria_truncate BEFORE TRUNCATE ON auditoria
    FOR EACH STATEMENT EXECUTE FUNCTION fn_solo_insercion();

-- Historial legible por usuario
CREATE VIEW v_historial_usuario WITH (security_invoker = true) AS
SELECT a.salon_id, a.ocurrido_en, a.usuario_id, coalesce(u.nombre, 'Sistema') AS usuario,
       a.accion, a.entidad, a.entidad_id, a.valor_anterior, a.valor_nuevo, a.direccion_ip
FROM auditoria a
LEFT JOIN usuario u ON u.id = a.usuario_id;

-- Aislamiento por salón (RLS). La aplicación ejecuta: SET app.salon_id = '<uuid>'
ALTER TABLE salon ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON salon USING (id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON usuario USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE usuario_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_rol FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON usuario_rol USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE especialista ENABLE ROW LEVEL SECURITY;
ALTER TABLE especialista FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON especialista USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON cliente USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON servicio USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE regla_comision ENABLE ROW LEVEL SECURITY;
ALTER TABLE regla_comision FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON regla_comision USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON venta USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE linea_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE linea_venta FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON linea_venta USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE pago FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON pago USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE cierre_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierre_caja FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON cierre_caja USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE liquidacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidacion FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON liquidacion USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE movimiento_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_nomina FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON movimiento_nomina USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE importacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE importacion FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON importacion USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE fila_importacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_importacion FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON fila_importacion USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE alerta ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON alerta USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON auditoria USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE evento_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON evento_outbox USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON decision USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);
ALTER TABLE escenario ENABLE ROW LEVEL SECURITY;
ALTER TABLE escenario FORCE ROW LEVEL SECURITY;
CREATE POLICY aislamiento_salon ON escenario USING (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid) WITH CHECK (salon_id = nullif(current_setting('app.salon_id', true), '')::uuid);

COMMIT;
