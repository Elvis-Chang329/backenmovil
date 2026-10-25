#!/bin/bash
# =========================================================================
# Shell Script para Inserción Masiva de Censos (Punto 4 del proyecto)
# Uso: ./scripts/insert_masivo.sh [CANTIDAD]
# Ejemplo: ./scripts/insert_masivo.sh 200
# =========================================================================

CANTIDAD=${1:-100}
DB_NAME=${DB_NAME:-"app_db"}
DB_USER=${DB_USER:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

echo "--------------------------------------------------------"
echo "  Ejecutando Inserción Masiva de $CANTIDAD censos...   "
echo "  Base de datos: $DB_NAME en $DB_HOST:$DB_PORT         "
echo "--------------------------------------------------------"

SQL_CMD="DO \$\$
DECLARE
    v_total_censos INT := $CANTIDAD;
    v_nombres TEXT[] := ARRAY['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofía', 'Pedro', 'Elena', 'Jorge', 'Lucía', 'Miguel', 'Carmen', 'David', 'Andrea', 'Fernando', 'Valeria', 'José', 'Camila', 'Manuel', 'Daniela'];
    v_apellidos TEXT[] := ARRAY['Pérez', 'Gómez', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Morales', 'Ramírez', 'Flores', 'Castillo', 'Vargas', 'Reyes', 'Gutiérrez', 'Hernández', 'Cruz', 'Mendoza', 'Aguilar'];
    v_random_nombre TEXT;
    v_random_apellido TEXT;
    v_random_miembros INT;
    v_random_tvs INT;
    v_random_lat NUMERIC(10, 8);
    v_random_lng NUMERIC(11, 8);
    v_base_lat NUMERIC := 14.634915;
    v_base_lng NUMERIC := -90.506882;
    v_dispersion NUMERIC := 0.15;
    i INT;
BEGIN
    FOR i IN 1..v_total_censos LOOP
        v_random_nombre := v_nombres[1 + floor(random() * array_length(v_nombres, 1))::INT];
        v_random_apellido := v_apellidos[1 + floor(random() * array_length(v_apellidos, 1))::INT];
        v_random_miembros := 1 + floor(random() * 8)::INT;
        v_random_tvs := floor(random() * 5)::INT;
        v_random_lat := round((v_base_lat + (random() - 0.5) * v_dispersion)::NUMERIC, 8);
        v_random_lng := round((v_base_lng + (random() - 0.5) * v_dispersion)::NUMERIC, 8);

        INSERT INTO \"censos\" (
            \"nombre\", \"apellido\", \"totalMiembros\", \"cantidadTelevisiones\",
            \"latitud\", \"longitud\", \"origenCarga\", \"createdAt\", \"updatedAt\"
        ) VALUES (
            v_random_nombre, v_random_apellido, v_random_miembros, v_random_tvs,
            v_random_lat, v_random_lng, 'masivo', NOW(), NOW()
        );
    END LOOP;
END \$\$;"

# Intenta primero via docker exec si el contenedor existe, o via psql local
if docker ps --format '{{.Names}}' | grep -q "postgres_db"; then
    echo "Ejecutando en contenedor Docker postgres_db..."
    docker exec -i postgres_db psql -U "$DB_USER" -d "$DB_NAME" -c "$SQL_CMD"
else
    echo "Ejecutando via psql local..."
    PGPASSWORD=${DB_PASSWORD:-"postgres"} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$SQL_CMD"
fi

echo "✅ Proceso completado exitosamente."
