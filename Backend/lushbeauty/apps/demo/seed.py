"""Datos sintéticos de desarrollo: dos salones, usuarios por rol, catálogo y unas ventas.

Todo es ficticio (regla del repo: sin datos reales en demos). Idempotente: se puede correr varias veces.
Compone los contratos públicos de identity, catalog y sales; no toca sus tablas.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.db import IntegrityError
from django.utils import timezone

from apps.catalog import contracts as catalogo
from apps.commissions import contracts as comisiones
from apps.identity import contracts as identidad
from apps.sales import contracts as ventas
from shared import tenancy

CLAVE_DEMO = "demo-lush-2026"
_NS = uuid.UUID("5e1c0de0-0000-4000-8000-00000000d3a0")  # espacio de nombres de UUID deterministas

SERVICIOS = [  # categoría, nombre, precio, costo de materiales
    ("Cabello", "Corte de cabello", "80.00", "5.00"),
    ("Cabello", "Tinte completo", "250.00", "90.00"),
    ("Cabello", "Peinado de fiesta", "150.00", "10.00"),
    ("Uñas", "Manicura semipermanente", "120.00", "25.00"),
    ("Uñas", "Pedicura", "100.00", "15.00"),
    ("Rostro", "Limpieza facial", "180.00", "40.00"),
]
CLIENTAS = [("Clienta Ejemplo Uno", "70000001"), ("Clienta Ejemplo Dos", "70000002")]


@dataclass(frozen=True)
class SalonDemo:
    nombre: str
    usuarios: tuple  # (nombre, email, rol)
    especialistas: tuple  # (nombre, sueldo fijo, email del usuario vinculado o None)
    con_ventas: bool


SALONES_DEMO = (
    SalonDemo(
        "Lush Beauty (demo)",
        (("Administradora Demo", "admin@lush.test", identidad.ADMINISTRADORA),
         ("Especialista Demo", "especialista@lush.test", identidad.ESPECIALISTA),
         ("Lector Demo", "lector@lush.test", identidad.LECTOR)),
        (("Especialista Demo", "1500.00", "especialista@lush.test"), ("Especialista Dos", "0.00", None)),
        True,
    ),
    SalonDemo(
        "Otro Salón (demo)",
        (("Administradora Otro", "admin@otro.test", identidad.ADMINISTRADORA),),
        (("Especialista Otro", "0.00", None),),
        False,
    ),
)


def sembrar() -> dict[str, int]:
    """Devuelve cuántos registros nuevos creó (0 si ya estaba todo)."""
    nuevos = {"salones": 0, "usuarios": 0, "servicios": 0, "especialistas": 0, "clientas": 0, "reglas": 0, "ventas": 0}
    for demo in SALONES_DEMO:
        salon_id = uuid.uuid5(_NS, demo.nombre)  # determinista: así se reconoce en la siguiente corrida
        with tenancy.en_salon(salon_id):
            existe = identidad.salon_existe(salon_id)
        if not existe:
            identidad.crear_salon(demo.nombre, salon_id=salon_id)
            nuevos["salones"] += 1
        usuarios = {}
        for nombre, email, rol in demo.usuarios:
            with tenancy.en_salon(salon_id):
                uid = identidad.usuario_id_por_email(email)
            if uid is None:
                uid = identidad.crear_usuario(salon_id, nombre=nombre, email=email, password=CLAVE_DEMO, roles=[rol])
                nuevos["usuarios"] += 1
            usuarios[email] = uid
        admin_id = next(usuarios[e] for _, e, r in demo.usuarios if r == identidad.ADMINISTRADORA)
        with tenancy.en_salon(salon_id, admin_id):
            existentes = {s.nombre for s in catalogo.listar_servicios()}
            for categoria, nombre, precio, costo in SERVICIOS:
                if nombre not in existentes:
                    catalogo.crear_servicio(categoria=categoria, nombre=nombre,
                                            precio_lista=Decimal(precio), costo_materiales=Decimal(costo))
                    nuevos["servicios"] += 1
            ya = {e.nombre for e in catalogo.listar_especialistas()}
            for nombre, sueldo, email in demo.especialistas:
                if nombre not in ya:
                    catalogo.crear_especialista(nombre=nombre, sueldo_fijo=Decimal(sueldo),
                                                usuario_id=usuarios.get(email) if email else None)
                    nuevos["especialistas"] += 1
            nuevos["reglas"] += _sembrar_reglas()
            ya = {c.nombre for c in catalogo.listar_clientes()}
            for nombre, telefono in CLIENTAS:
                if nombre not in ya:
                    catalogo.crear_cliente(nombre=nombre, telefono=telefono)
                    nuevos["clientas"] += 1
            if demo.con_ventas:
                nuevos["ventas"] += _sembrar_ventas(admin_id)
    return nuevos


def _sembrar_reglas() -> int:
    """Política general (35 % sobre lista) y una propia de la segunda especialista (40 % sobre lo cobrado).
    Los porcentajes son de ejemplo, no una decisión de negocio (decisión abierta 2)."""
    if comisiones.listar():
        return 0
    comisiones.crear_version(porcentaje="0.35", base=comisiones.PRECIO_LISTA, desde=date(2026, 1, 1),
                             motivo="Política general de demostración")
    creadas = 1
    segunda = next((e for e in catalogo.listar_especialistas() if e.nombre == "Especialista Dos"), None)
    if segunda is not None:
        comisiones.crear_version(porcentaje="0.40", base=comisiones.PRECIO_COBRADO, desde=date(2026, 1, 1),
                                 motivo="Acuerdo propio de demostración", especialista_id=segunda.id)
        creadas += 1
    return creadas


def _sembrar_ventas(admin_id) -> int:
    """Tres ventas con UUID determinista: un reintento no las duplica (RN-01)."""
    admin = identidad.obtener_usuario(admin_id)
    servicios = {s.nombre: s for s in catalogo.listar_servicios()}
    especialista = next(iter(catalogo.listar_especialistas()))
    clienta = next(iter(catalogo.listar_clientes()))
    plan = [  # clave, servicio, descuento, [(método, monto)]
        ("v1", "Corte de cabello", "0.00", [("EFECTIVO", "80.00")]),
        ("v2", "Manicura semipermanente", "10.00", [("QR", "60.00"), ("EFECTIVO", "50.00")]),
        ("v3", "Tinte completo", "0.00", [("TARJETA", "250.00")]),
    ]
    creadas = 0
    for clave, nombre, descuento, pagos in plan:
        _, creada = ventas.registrar_venta(
            uuid_cliente=uuid.uuid5(_NS, clave), cliente_id=clienta.id, fecha_servicio=timezone.now(),
            lineas=[ventas.LineaEntrada(
                servicio_id=servicios[nombre].id, especialista_id=especialista.id, descuento=Decimal(descuento),
                motivo_descuento="Clienta frecuente (demo)" if Decimal(descuento) else None)],
            pagos=[ventas.PagoEntrada(m, Decimal(x)) for m, x in pagos], usuario=admin,
        )
        creadas += creada
    return creadas
