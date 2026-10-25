-- =========================================================================
-- Procedimiento Anónimo en PostgreSQL para Inserción Masiva de Censos (Punto 4)
-- Inserta N censos ficticios con coordenadas geográficas válidas para Google Maps
-- y marca 'origenCarga' = 'masivo'.
-- =========================================================================

DO $$
DECLARE
    -- Cambiar este valor para la cantidad N de censos a generar
    v_total_censos INT := 200;

    -- Listas de nombres y apellidos típicos
    v_nombres TEXT[] := ARRAY['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofía', 'Pedro', 'Elena', 'Jorge', 'Lucía', 'Miguel', 'Carmen', 'David', 'Andrea', 'Fernando', 'Valeria', 'José', 'Camila', 'Manuel', 'Daniela'];
    v_apellidos TEXT[] := ARRAY['Pérez', 'Gómez', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Morales', 'Ramírez', 'Flores', 'Castillo', 'Vargas', 'Reyes', 'Gutiérrez', 'Hernández', 'Cruz', 'Mendoza', 'Aguilar'];
    
    v_random_nombre TEXT;
    v_random_apellido TEXT;
    v_random_miembros INT;
    v_random_tvs INT;
    v_random_lat NUMERIC(10, 8);
    v_random_lng NUMERIC(11, 8);
    
    -- Centro geográfico (ejemplo: área metropolitana de Guatemala / Centroamérica)
    -- Latitud base: 14.6349, Longitud base: -90.5069
    v_base_lat NUMERIC := 14.634915;
    v_base_lng NUMERIC := -90.506882;
    v_dispersion NUMERIC := 0.15; -- Rango de dispersión (~15km a la redonda)
    
    i INT;
BEGIN
    RAISE NOTICE 'Iniciando inserción masiva de % censos...', v_total_censos;

    FOR i IN 1..v_total_censos LOOP
        -- Seleccionar nombre y apellido aleatorio
        v_random_nombre := v_nombres[1 + floor(random() * array_length(v_nombres, 1))::INT];
        v_random_apellido := v_apellidos[1 + floor(random() * array_length(v_apellidos, 1))::INT];
        
        -- Miembros familiares entre 1 y 8
        v_random_miembros := 1 + floor(random() * 8)::INT;
        
        -- Televisiones entre 0 y 4
        v_random_tvs := floor(random() * 5)::INT;
        
        -- Coordenadas con variación aleatoria alrededor del punto base
        v_random_lat := round((v_base_lat + (random() - 0.5) * v_dispersion)::NUMERIC, 8);
        v_random_lng := round((v_base_lng + (random() - 0.5) * v_dispersion)::NUMERIC, 8);

        -- Inserción en la tabla censos con origenCarga = 'masivo'
        INSERT INTO "censos" (
            "nombre",
            "apellido",
            "totalMiembros",
            "cantidadTelevisiones",
            "latitud",
            "longitud",
            "origenCarga",
            "createdAt",
            "updatedAt"
        ) VALUES (
            v_random_nombre,
            v_random_apellido,
            v_random_miembros,
            v_random_tvs,
            v_random_lat,
            v_random_lng,
            'masivo',
            NOW(),
            NOW()
        );
    END LOOP;

    RAISE NOTICE '¡Carga masiva finalizada exitosamente! Se insertaron % registros marcados como masivo.', v_total_censos;
END $$;
