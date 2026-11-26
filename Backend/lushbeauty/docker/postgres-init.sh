#!/bin/sh
# Crea el rol de la aplicación SIN superusuario: un superusuario ignora RLS,
# y sin RLS el aislamiento por salón no se sostiene en la base de datos.
set -e
psql -v ON_ERROR_STOP=1 -v app_user="$APP_DB_USER" -v app_pass="$APP_DB_PASSWORD" -v app_db="$APP_DB_NAME" \
     --username "$POSTGRES_USER" --dbname postgres <<'SQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_pass' NOSUPERUSER NOBYPASSRLS CREATEDB;
CREATE DATABASE :"app_db" OWNER :"app_user";
SQL
