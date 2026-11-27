"""Casos de uso sobre las versiones de comisión del salón activo."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.catalog import contracts as catalogo
from apps.commissions.domain import comision as dominio
from apps.commissions.persistence.models import ReglaComision
from shared import tenancy


def _a_dominio(r: ReglaComision) -> dominio.Regla:
    return dominio.Regla(r.id, r.especialista_id, r.porcentaje, r.base, r.vigente_desde, r.vigente_hasta)


def listar(*, especialista_id=None, solo_generales: bool = False):
    qs = ReglaComision.objects.order_by("especialista_id", "-vigente_desde")
    if solo_generales:
        qs = qs.filter(especialista_id__isnull=True)
    elif especialista_id is not None:
        qs = qs.filter(especialista_id=especialista_id)
    return list(qs)


def crear_version(*, porcentaje, base: str, desde: date, motivo: str, especialista_id=None,
                  hoy: date | None = None) -> ReglaComision:
    """Publica una versión nueva y cierra la abierta del mismo ámbito, sin tocar lo ya aplicado."""
    if especialista_id is not None and not catalogo.especialista_activa_existe(especialista_id):
        raise dominio.ErrorDeComision("La especialista no existe o está inactiva.")
    with transaction.atomic():
        del_ambito = ReglaComision.objects.select_for_update().filter(especialista_id=especialista_id)
        existentes = [_a_dominio(r) for r in del_ambito]
        plan = dominio.planificar_version(
            existentes, porcentaje=Decimal(str(porcentaje)), base=base, desde=desde, motivo=motivo,
            hoy=hoy or timezone.localdate(),
        )
        if plan.cerrar_id is not None:
            ReglaComision.objects.filter(id=plan.cerrar_id).update(vigente_hasta=plan.cerrar_hasta)
        return ReglaComision.objects.create(
            salon_id=tenancy.salon_actual(), especialista_id=especialista_id, porcentaje=Decimal(str(porcentaje)),
            base=base, vigente_desde=desde, motivo=motivo.strip(), creada_por=tenancy.usuario_actual(),
        )


def comision_de_linea(*, especialista_id, dia: date, precio_lista: Decimal, cantidad: int,
                      importe_cobrado: Decimal) -> dominio.ComisionCalculada:
    """Elige la regla vigente el día del servicio y calcula. Lanza `SinReglaVigente` si no hay."""
    reglas = [_a_dominio(r) for r in ReglaComision.objects.filter(
        Q(especialista_id=especialista_id) | Q(especialista_id__isnull=True)).order_by("-vigente_desde")]
    regla = dominio.seleccionar(reglas, especialista_id, dia)
    return dominio.calcular(regla, precio_lista=precio_lista, cantidad=cantidad, importe_cobrado=importe_cobrado)

