#!/usr/bin/env python3
"""Levanta Lush Beauty en desarrollo: backend, frontend o ambos.

Modos:
  back   Crea/usa el .venv de Backend/lushbeauty, instala dependencias,
         migra y arranca Django.
  front  Instala dependencias del frontend (pnpm, lockfile congelado) y
         arranca Vite.
  todo   Las dos cosas a la vez.
  Sin modo, muestra un menú para elegir (y los puertos, Enter = por defecto).

Puertos fijos y propios del proyecto, para no confundirlo con otro que use
los puertos por defecto (5173 de Vite, 8000 de Django). Si el puerto está
ocupado, el script se detiene en vez de saltar a otro en silencio.

Uso:
  python levantar.py                      # menú para elegir
  python levantar.py todo                 # back + front, sin preguntar
  python levantar.py back                 # solo backend  -> http://127.0.0.1:8010
  python levantar.py front                # solo frontend -> http://127.0.0.1:5180
  python levantar.py todo --front-port 5190 --back-port 8020
  python levantar.py back --makemigrations
  python levantar.py back --solo-migrar   # prepara entorno y migra, sin servidor
  python levantar.py back --recrear       # borra y recrea el .venv
  python levantar.py front --sin-instalar # no corre pnpm install

Solo usa la biblioteca estándar, así que se puede correr con el Python del
sistema (>= 3.11 por tomllib; el proyecto pide 3.13).
"""

from __future__ import annotations

import argparse
import os
import shutil
import socket
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

HOST = "127.0.0.1"
PUERTO_BACK = 8010
PUERTO_FRONT = 5180
# El pnpm-lock.yaml es lockfileVersion 9.0.
PNPM_RESPALDO = "pnpm@9"


def info(msg: str) -> None:
    print(f"\n==> {msg}", flush=True)


def ejecutar(cmd: list[str | Path], cwd: Path = BACKEND, env: dict | None = None) -> None:
    print("   $", " ".join(str(c) for c in cmd), flush=True)
    resultado = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env)
    if resultado.returncode != 0:
        sys.exit(f"\n[error] El comando falló con código {resultado.returncode}.")


def puerto_libre(host: str, puerto: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, puerto)) != 0


def exigir_puerto_libre(host: str, puerto: int, quien: str, opcion: str) -> None:
    if not puerto_libre(host, puerto):
        sys.exit(
            f"[error] El puerto {puerto} ({quien}) ya está en uso en {host}. "
            f"Cierra lo que lo ocupa o usa {opcion} <otro>."
        )


# ---------------------------------------------------------------- backend


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
    info("Instalando dependencias del backend")
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


def preparar_backend(args: argparse.Namespace) -> None:
    usar_uv = shutil.which("uv") is not None and not args.sin_uv
    info(f"Backend: usando {'uv' if usar_uv else 'venv + pip'}")

    crear_venv(args.recrear, usar_uv)
    instalar_dependencias(usar_uv)

    info("Verificando el proyecto (manage.py check)")
    manage("check")

    if args.makemigrations:
        info("Generando migraciones")
        manage("makemigrations")

    info("Aplicando migraciones")
    manage("migrate")


def comando_backend(args: argparse.Namespace) -> list[str]:
    return [str(python_del_venv()), "manage.py", "runserver", f"{args.host}:{args.back_port}"]


# --------------------------------------------------------------- frontend


def candidatos_pnpm() -> list[str]:
    """Todos los pnpm del PATH, en orden (shutil.which solo devuelve el primero)."""
    encontrados: list[str] = []
    for carpeta in os.environ.get("PATH", "").split(os.pathsep):
        if not carpeta:
            continue
        ruta = shutil.which("pnpm", path=carpeta)
        if ruta and ruta not in encontrados:
            encontrados.append(ruta)
    return encontrados


def comando_pnpm() -> list[str]:
    """El primer pnpm del PATH que responda; si ninguno, el de npx (pnpm 9).

    En Windows el pnpm de Corepack (C:\\Program Files\\nodejs) suele ir primero
    y fallar con Corepack viejo; por eso se prueban todos.
    """
    for pnpm in candidatos_pnpm():
        prueba = subprocess.run([pnpm, "--version"], capture_output=True, text=True)
        if prueba.returncode == 0:
            return [pnpm]
        print(f"[aviso] {pnpm} no responde; se prueba el siguiente.")
    print("[aviso] Ningún pnpm instalado responde; se usa npx.")
    npx = shutil.which("npx")
    if not npx:
        sys.exit("[error] No se encontró pnpm ni npx. Instala Node.js (incluye npx).")
    return [npx, "-y", PNPM_RESPALDO]


def preparar_frontend(args: argparse.Namespace) -> list[str]:
    pnpm = comando_pnpm()
    if not args.sin_instalar:
        info("Instalando dependencias del frontend (pnpm install --frozen-lockfile)")
        ejecutar([*pnpm, "install", "--frozen-lockfile"], cwd=FRONTEND)
    # --strictPort: si el puerto está ocupado Vite falla en vez de usar otro.
    return [*pnpm, "exec", "vite", "--host", args.host,
            "--port", str(args.front_port), "--strictPort"]


# ------------------------------------------------------------------- main


def detener(proceso: subprocess.Popen) -> None:
    """Cierra el proceso y sus hijos (en Windows pnpm.cmd deja a Vite huérfano)."""
    if proceso.poll() is not None:
        return
    if ES_WINDOWS:
        subprocess.run(["taskkill", "/PID", str(proceso.pid), "/T", "/F"],
                       capture_output=True)
    else:
        proceso.terminate()
    try:
        proceso.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proceso.kill()



def leer_argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Levanta Lush Beauty en desarrollo (backend, frontend o ambos).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Ejemplos:\n"
               "  python levantar.py            (menú)\n"
               "  python levantar.py todo\n"
               "  python levantar.py back --makemigrations\n"
               "  python levantar.py front --front-port 5190",
    )
    parser.add_argument("modo", nargs="?", choices=["back", "front", "todo"], default=None,
                        help="Qué levantar. Sin modo muestra un menú para elegir "
                             "(o levanta todo si no hay terminal interactiva).")
    parser.add_argument("--host", default=HOST)
    parser.add_argument("--back-port", "--port", type=int, default=PUERTO_BACK,
                        help=f"Puerto de Django (por defecto {PUERTO_BACK}).")
    parser.add_argument("--front-port", type=int, default=PUERTO_FRONT,
                        help=f"Puerto de Vite (por defecto {PUERTO_FRONT}).")

    back = parser.add_argument_group("backend")
    back.add_argument("--makemigrations", action="store_true",
                      help="Genera migraciones nuevas antes de migrar.")
    back.add_argument("--solo-migrar", action="store_true",
                      help="Prepara el entorno y migra, sin arrancar servidores.")
    back.add_argument("--recrear", action="store_true",
                      help="Borra y vuelve a crear el entorno virtual.")
    back.add_argument("--sin-uv", action="store_true",
                      help="Fuerza venv + pip aunque uv esté instalado.")

    front = parser.add_argument_group("frontend")
    front.add_argument("--sin-instalar", action="store_true",
                       help="No ejecuta pnpm install antes de arrancar.")
    return parser.parse_args()


MENU = [
    ("Todo (backend + frontend)", "todo", False),
    ("Solo backend", "back", False),
    ("Solo frontend", "front", False),
    ("Backend: solo preparar y migrar (sin servidor)", "back", True),
]


def preguntar(texto: str, defecto: str) -> str:
    try:
        respuesta = input(f"{texto} [{defecto}]: ").strip()
    except EOFError:
        respuesta = ""
    return respuesta or defecto


def preguntar_puerto(texto: str, defecto: int) -> int:
    while True:
        valor = preguntar(texto, str(defecto))
        if valor.isdigit() and 0 < int(valor) < 65536:
            return int(valor)
        print("   Escribe un número de puerto válido (1-65535).")


def elegir_con_menu(args: argparse.Namespace) -> None:
    print("\nLush Beauty · ¿qué quieres levantar?")
    for i, (texto, _, _) in enumerate(MENU, start=1):
        print(f"  {i}) {texto}")
    print("  0) Salir")
    while True:
        opcion = preguntar("Opción", "1")
        if opcion == "0":
            sys.exit(0)
        if opcion.isdigit() and 1 <= int(opcion) <= len(MENU):
            break
        print(f"   Elige un número del 0 al {len(MENU)}.")
    _, args.modo, solo_migrar = MENU[int(opcion) - 1]
    args.solo_migrar = args.solo_migrar or solo_migrar

    if args.modo in ("front", "todo"):
        args.front_port = preguntar_puerto("Puerto del frontend", args.front_port)
    if args.modo in ("back", "todo") and not args.solo_migrar:
        args.back_port = preguntar_puerto("Puerto del backend", args.back_port)


def main() -> None:
    args = leer_argumentos()
    if args.modo is None:
        if sys.stdin.isatty():
            elegir_con_menu(args)
        else:
            args.modo = "todo"
    con_back = args.modo in ("back", "todo")
    con_front = args.modo in ("front", "todo") and not args.solo_migrar

    if con_back and not args.solo_migrar:
        exigir_puerto_libre(args.host, args.back_port, "backend", "--back-port")
    if con_front:
        exigir_puerto_libre(args.host, args.front_port, "frontend", "--front-port")

    if con_back:
        preparar_backend(args)
        if args.solo_migrar:
            info("Listo. Entorno preparado y migraciones aplicadas.")
            return

    procesos: list[subprocess.Popen] = []
    cmd_front = preparar_frontend(args) if con_front else None

    info("Arrancando (Ctrl+C para detener)")
    if con_back:
        print(f"   Backend:  http://{args.host}:{args.back_port}/", flush=True)
    if con_front:
        print(f"   Frontend: http://{args.host}:{args.front_port}/", flush=True)

    try:
        if cmd_front:
            procesos.append(subprocess.Popen(cmd_front, cwd=FRONTEND))
        if con_back:
            procesos.append(subprocess.Popen(comando_backend(args), cwd=BACKEND))
        # Espera hasta que alguno termine (o Ctrl+C).
        while all(p.poll() is None for p in procesos):
            try:
                procesos[0].wait(timeout=1)
            except subprocess.TimeoutExpired:
                pass
    except KeyboardInterrupt:
        pass
    finally:
        for p in procesos:
            detener(p)


if __name__ == "__main__":
    main()
