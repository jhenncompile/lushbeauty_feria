"""Documentos de nómina: comprobante PDF por especialista y resumen XLSX. Sin base de datos propia: recibe datos ya leídos."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ESTADOS = {"BORRADOR": "Borrador", "APROBADA": "Aprobada", "PAGADA": "Pagada"}


def bs(valor) -> str:
    return f"Bs {Decimal(valor):,.2f}".replace(",", " ")


def _texto_seguro(valor) -> str:
    """Una celda que empieza con = + - @ se tomaría como fórmula al abrirla en Excel."""
    texto = "" if valor is None else str(valor)
    return "'" + texto if texto[:1] in ("=", "+", "-", "@") else texto


def comprobante_pdf(*, salon: str, especialista: str, liquidacion, lineas, movimientos, servicios: dict,
                    generado_en: datetime | None = None) -> bytes:
    """Comprobante de una liquidación para su destinataria. Sin compresión de página: el documento es
    corto y así su contenido se puede verificar en las pruebas."""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4, pageCompression=0)
    pdf.setTitle(f"Liquidación {liquidacion.periodo_inicio} a {liquidacion.periodo_fin}")
    ancho, alto = A4
    x, y = 20 * mm, alto - 22 * mm

    def linea(texto, tam=10, negrita=False, sangria=0, avance=6 * mm):
        nonlocal y
        if y < 25 * mm:
            pdf.showPage()
            y = alto - 22 * mm
        pdf.setFont("Helvetica-Bold" if negrita else "Helvetica", tam)
        pdf.drawString(x + sangria, y, texto)
        y -= avance

    def fila(etiqueta, valor, negrita=False):
        nonlocal y
        pdf.setFont("Helvetica-Bold" if negrita else "Helvetica", 10)
        pdf.drawString(x + 4 * mm, y, etiqueta)
        pdf.drawRightString(ancho - 20 * mm, y, valor)
        y -= 6 * mm

    linea(salon, 16, True, avance=8 * mm)
    linea("Comprobante de liquidación semanal", 12, avance=9 * mm)
    linea(f"Especialista: {especialista}", 11)
    linea(f"Período: {liquidacion.periodo_inicio:%d/%m/%Y} al {liquidacion.periodo_fin:%d/%m/%Y}", 11)
    linea(f"Estado: {ESTADOS.get(liquidacion.estado, liquidacion.estado)}", 11, avance=9 * mm)

    linea("Resumen", 11, True)
    fila("Sueldo fijo", bs(liquidacion.sueldo_fijo))
    fila("Comisión", bs(liquidacion.total_comision))
    fila("Propinas", bs(liquidacion.total_propina))
    fila("Deducciones y ajustes", bs(liquidacion.total_movimientos))
    if liquidacion.excedente > 0:
        fila("Excedente que pasa a la semana siguiente", bs(liquidacion.excedente))
    fila("Neto a pagar", bs(liquidacion.neto), negrita=True)
    y -= 4 * mm

    if movimientos:
        linea("Deducciones y ajustes", 11, True)
        for m in movimientos:
            linea(f"{m.fecha:%d/%m} · {m.tipo.capitalize()} · {m.motivo}"[:95] + f"   {bs(m.monto)}", 9, sangria=4 * mm, avance=5 * mm)
        y -= 3 * mm
    if lineas:
        linea("Servicios del período", 11, True)
        for l in lineas:
            nombre = servicios.get(l.servicio_id, "Servicio")
            comision = "—" if l.comision is None else bs(l.comision)
            extra = f" · propina {bs(l.propina)}" if l.propina else ""
            linea(f"{l.dia:%d/%m} · {nombre} · cobrado {bs(l.importe_cobrado)} · comisión {comision}{extra}"[:110],
                  9, sangria=4 * mm, avance=5 * mm)
    y -= 6 * mm
    pie = f"Documento personal. Generado el {(generado_en or datetime.now()):%d/%m/%Y %H:%M}."
    linea(pie, 8, avance=4 * mm)
    pdf.save()
    return buffer.getvalue()


def resumen_xlsx(liquidaciones, nombres: dict) -> bytes:
    """Una fila por liquidación. Los importes van como números (no texto) para poder sumarlos en Excel."""
    libro = Workbook()
    hoja = libro.active
    hoja.title = "Liquidaciones"
    hoja.append(["Especialista", "Inicio", "Fin", "Estado", "Sueldo fijo", "Comisión", "Propina", "Movimientos",
                 "Excedente", "Neto"])
    for celda in hoja[1]:
        celda.font = Font(bold=True)
    for l in liquidaciones:
        hoja.append([_texto_seguro(nombres.get(l.especialista_id, "")), l.periodo_inicio, l.periodo_fin,
                     ESTADOS.get(l.estado, l.estado), l.sueldo_fijo, l.total_comision, l.total_propina,
                     l.total_movimientos, l.excedente, l.neto])
    for fila in hoja.iter_rows(min_row=2, min_col=5, max_col=10):
        for celda in fila:
            celda.number_format = "0.00"
    for fila in hoja.iter_rows(min_row=2, min_col=2, max_col=3):
        for celda in fila:
            celda.number_format = "yyyy-mm-dd"
    hoja.column_dimensions["A"].width = 28
    buffer = BytesIO()
    libro.save(buffer)
    return buffer.getvalue()
