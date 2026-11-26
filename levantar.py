#!/usr/bin/env python3
"""Levanta el backend de Lush Beauty en un entorno virtual.

Pasos:
  1. Crea el entorno virtual en Backend/lushbeauty/.venv (si no existe).
  2. Instala las dependencias de pyproject.toml (con uv si está disponible,
     si no con pip).
  3. Ejecuta las migraciones (opcionalmente makemigrations antes).
  4. Arranca el servidor de desarrollo de Django.

Uso:
  python levantar.py                    # todo y runserver en 127.0.0.1:8000
  python levantar.py --port 9000        # otro puerto
  python levantar.py --makemigrations   # genera migraciones antes de migrar
  python levantar.py --solo-migrar      # prepara entorno y migra, sin servidor
  python levantar.py --recrear          # borra y recrea el .venv
  python levantar.py --frontend         # además levanta el frontend (pnpm dev)

Solo usa la biblioteca estándar, así que se puede correr con el Python del
sistema (>= 3.11 por tomllib; el proyecto pide 3.13).
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tomllib
import venv
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
BACKEND = RAIZ / "Backend" / "lushbeauty"
FRONTEND = RAIZ / "Frontend" / "lushbeauty"
VENV = BACKEND / ".venv"
ES_WINDOWS = os.name == "nt"


def info(msg: str) -> None:
    print(f"\n==> {msg}", flush=True)


def ejecutar(cmd: list[str | Path], cwd: Path = BACKEND, env: dict | None = None) -> None:
    print("   $", " ".join(str(c) for c in cmd), flush=True)
    resultado = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env)
    if resultado.returncode != 0:
        sys.exit(f"\n[error] El comando falló con código {resultado.returncode}.")


def python_del_venv() -> Path:
    if ES_WINDOWS:
        return VENV / "Scripts" / "python.exe"
    return VENV / "bin" / "python"


def version_requerida() -> tuple[int, int] | None:
    archivo = BACKEND / ".python-version"
    if not archivo.exists():
        return None
    partes = archivo.read_text(encoding="utf-8").strip().split(".")
    try:
        return int(partes[0]), int(partes[1])
    except (IndexError, ValueError):
        return None


def crear_venv(recrear: bool, usar_uv: bool) -> None:
    if recrear and VENV.exists():
        info(f"Borrando entorno existente {VENV}")
        shutil.rmtree(VENV)

    if python_del_venv().exists():
        info(f"Entorno virtual ya existe: {VENV}")
        return

    info(f"Creando entorno virtual en {VENV}")
    if usar_uv:
        # uv respeta .python-version y puede descargar el Python correcto.
        ejecutar(["uv", "venv", VENV])
    else:
        requerida = version_requerida()
        if requerida and sys.version_info[:2] < requerida:
            sys.exit(
                f"[error] El proyecto pide Python {requerida[0]}.{requerida[1]}+ y "
                f"estás usando {sys.version.split()[0]}. Ejecuta el script con esa "
                f"versión (ej. 'py -{requerida[0]}.{requerida[1]} levantar.py') o instala uv."
            )
        venv.EnvBuilder(with_pip=True, clear=False).create(VENV)


def instalar_dependencias(usar_uv: bool) -> None:
    info("Instalando dependencias")
    if usar_uv:
        # uv sync usa uv.lock: versiones exactas y reproducibles.
        env = {**os.environ, "UV_PROJECT_ENVIRONMENT": str(VENV)}
        ejecutar(["uv", "sync"], env=env)
        return

    with open(BACKEND / "pyproject.toml", "rb") as f:
        deps = tomllib.load(f).get("project", {}).get("dependencies", [])
    py = python_del_venv()
    ejecutar([py, "-m", "pip", "install", "--upgrade", "pip"])
    if deps:
        ejecutar([py, "-m", "pip", "install", *deps])


def manage(*args: str) -> None:
    ejecutar([python_del_venv(), "manage.py", *args])


def levantar_frontend() -> subprocess.Popen | None:
    pnpm = shutil.which("pnpm")
    if not pnpm:
        print("[aviso] No se encontró pnpm; se omite el frontend.")
        return None
    info("Instalando y levantando el frontend (pnpm dev)")
    subprocess.run([pnpm, "install"], cwd=FRONTEND, check=True)
    return subprocess.Popen([pnpm, "dev"], cwd=FRONTEND)


def main() -> None:
    parser = argparse.ArgumentParser(description="Levanta el backend de Lush Beauty.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default="8000")
    parser.add_argument("--makemigrations", action="store_true",
                        help="Genera migraciones nuevas antes de migrar.")
    parser.add_argument("--solo-migrar", action="store_true",
                        help="No arranca el servidor.")
    parser.add_argument("--recrear", action="store_true",
                        help="Borra y vuelve a crear el entorno virtual.")
    parser.add_argument("--sin-uv", action="store_true",
                        help="Fuerza venv + pip aunque uv esté instalado.")
    parser.add_argument("--frontend", action="store_true",
                        help="Además levanta el frontend con pnpm dev.")
    args = parser.parse_args()

    usar_uv = shutil.which("uv") is not None and not args.sin_uv
    info(f"Usando {'uv' if usar_uv else 'venv + pip'}")

    crear_venv(args.recrear, usar_uv)
    instalar_dependencias(usar_uv)

    info("Verificando el proyecto (manage.py check)")
    manage("check")

    if args.makemigrations:
        info("Generando migraciones")
        manage("makemigrations")

    info("Aplicando migraciones")
    manage("migrate")

    if args.solo_migrar:
        info("Listo. Entorno preparado y migraciones aplicadas.")
        return

    front = levantar_frontend() if args.frontend else None
    info(f"Servidor en http://{args.host}:{args.port}/  (Ctrl+C para detener)")
    try:
        subprocess.run([str(python_del_venv()), "manage.py", "runserver",
                        f"{args.host}:{args.port}"], cwd=BACKEND)
    except KeyboardInterrupt:
        pass
    finally:
        if front and front.poll() is None:
            front.terminate()


if __name__ == "__main__":
    main()
