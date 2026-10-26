#!/bin/bash
# =========================================================================
# Shell Script para Inserción Masiva de Censos en TODA GUATEMALA (Punto 4)
# Uso: ./scripts/insert_masivo.sh [CANTIDAD]
# Ejemplo: ./scripts/insert_masivo.sh 200
# =========================================================================

CANTIDAD=${1:-100}
DB_NAME=${DB_NAME:-"app_db"}
DB_USER=${DB_USER:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

echo "------------------------------------------------------------------"
echo "  🇬🇹 Inserción Masiva de $CANTIDAD censos en TODA GUATEMALA"
echo "  (Cobertura en los 22 departamentos de la República)"
echo "  Base de datos: $DB_NAME en $DB_HOST:$DB_PORT"
echo "------------------------------------------------------------------"

SQL_CMD="DO \$\$
DECLARE
    v_total_censos INT := $CANTIDAD;
    v_nombres TEXT[] := ARRAY['Juan', 'Carlos', 'Pedro', 'José', 'Luis', 'Miguel', 'Jorge', 'Fernando', 'David', 'Manuel',
                              'María', 'Ana', 'Sofía', 'Elena', 'Lucía', 'Carmen', 'Andrea', 'Valeria', 'Camila', 'Daniela'];
    v_apellidos TEXT[] := ARRAY['López', 'García', 'Morales', 'González', 'Pérez', 'Rodríguez', 'Hernández', 'Ramírez',
                                'Martínez', 'Gómez', 'Castillo', 'Flores', 'Vargas', 'Reyes', 'Gutiérrez', 'Cruz', 'Mendoza', 'Aguilar'];

    -- Puntos geográficos reales en los 22 Departamentos de Guatemala
    v_deptos_lat NUMERIC[] := ARRAY[
        14.634915, 14.558611, 14.661111, 14.854167, 14.300833, 
        14.278333, 14.772500, 14.911389, 14.834722, 14.534167, 
        14.536111, 14.962778, 15.319722, 15.030556, 15.103056, 
        15.470833, 16.924444, 17.222000, 16.331100, 15.727778, 
        15.478900, 14.972222, 14.800000, 14.634722, 14.281667
    ];

    v_deptos_lng NUMERIC[] := ARRAY[
        -90.506882, -90.729444, -90.820833, -90.075000, -90.785000, 
        -90.298889, -91.183333, -91.361111, -91.518056, -91.503333, 
        -91.677778, -91.795833, -91.470833, -91.148889, -90.318056, 
        -90.370833, -89.896667, -89.623000, -89.418600, -88.594444, 
        -88.825600, -89.530556, -89.545833, -89.988889, -89.895833
    ];

    v_random_idx INT;
    v_random_nombre TEXT;
    v_random_apellido TEXT;
    v_random_miembros INT;
    v_random_tvs INT;
    v_random_lat NUMERIC(10, 8);
    v_random_lng NUMERIC(11, 8);
    v_dispersion NUMERIC := 0.04;
    i INT;
BEGIN
    FOR i IN 1..v_total_censos LOOP
        v_random_nombre := v_nombres[1 + floor(random() * array_length(v_nombres, 1))::INT];
        v_random_apellido := v_apellidos[1 + floor(random() * array_length(v_apellidos, 1))::INT];
        v_random_miembros := 1 + floor(random() * 8)::INT;
        v_random_tvs := floor(random() * 5)::INT;

        v_random_idx := 1 + floor(random() * array_length(v_deptos_lat, 1))::INT;
        v_random_lat := round((v_deptos_lat[v_random_idx] + (random() - 0.5) * v_dispersion)::NUMERIC, 8);
        v_random_lng := round((v_deptos_lng[v_random_idx] + (random() - 0.5) * v_dispersion)::NUMERIC, 8);

        INSERT INTO \"censos\" (
            \"nombre\", \"apellido\", \"totalMiembros\", \"cantidadTelevisiones\",
            \"latitud\", \"longitud\", \"origenCarga\", \"createdAt\", \"updatedAt\"
        ) VALUES (
            v_random_nombre, v_random_apellido, v_random_miembros, v_random_tvs,
            v_random_lat, v_random_lng, 'masivo', NOW(), NOW()
        );
    END LOOP;
END \$\$;"

# 1. Si existe contenedor Docker postgres_db en ejecución, usar docker exec
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "postgres_db"; then
    echo "🐳 Ejecutando en contenedor Docker postgres_db..."
    docker exec -i postgres_db psql -U "$DB_USER" -d "$DB_NAME" -c "$SQL_CMD"
# 2. Si se tiene el cliente psql instalado en la máquina virtual
elif command -v psql >/dev/null 2>&1; then
    echo "🐘 Ejecutando via psql local..."
    PGPASSWORD=${DB_PASSWORD:-"postgres"} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$SQL_CMD"
else
    echo "❌ Error: No se encontró ni Docker ('postgres_db') ni el cliente 'psql' instalado."
    echo "   Por favor asegúrate de tener el contenedor corriendo con: docker compose up -d"
    echo "   o instala el cliente psql con: sudo apt install postgresql-client"
    exit 1
fi

echo "✅ Proceso completado exitosamente: Censos insertados en toda Guatemala con origen 'masivo'."
