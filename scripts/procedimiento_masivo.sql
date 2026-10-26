-- =========================================================================
-- Procedimiento Anónimo en PostgreSQL para Inserción Masiva de Censos (Punto 4)
-- Inserta N censos ficticios distribuidos en los 22 DEPARTAMENTOS DE GUATEMALA
-- Coordenadas reales que cubren TODO el territorio nacional de Guatemala
-- Marca 'origenCarga' = 'masivo'.
-- =========================================================================

DO $$
DECLARE
    -- Cantidad N de censos a generar (puedes cambiarlo al número que necesites)
    v_total_censos INT := 200;

    -- Nombres y apellidos comunes en Guatemala
    v_nombres TEXT[] := ARRAY['Juan', 'Carlos', 'Pedro', 'José', 'Luis', 'Miguel', 'Jorge', 'Fernando', 'David', 'Manuel',
                              'María', 'Ana', 'Sofía', 'Elena', 'Lucía', 'Carmen', 'Andrea', 'Valeria', 'Camila', 'Daniela'];
    v_apellidos TEXT[] := ARRAY['López', 'García', 'Morales', 'González', 'Pérez', 'Rodríguez', 'Hernández', 'Ramírez',
                                'Martínez', 'Gómez', 'Castillo', 'Flores', 'Vargas', 'Reyes', 'Gutiérrez', 'Cruz', 'Mendoza', 'Aguilar'];

    -- Puntos de referencia reales que cubren los 22 DEPARTAMENTOS DE GUATEMALA:
    -- 1.  Guatemala (Ciudad de Guatemala / Metropolitana)
    -- 2.  Sacatepéquez (Antigua Guatemala)
    -- 3.  Chimaltenango
    -- 4.  El Progreso (Guastatoya)
    -- 5.  Escuintla
    -- 6.  Santa Rosa (Cuilapa)
    -- 7.  Sololá (Lago Atitlán)
    -- 8.  Totonicapán
    -- 9.  Quetzaltenango (Xela)
    -- 10. Suchitepéquez (Mazatenango)
    -- 11. Retalhuleu
    -- 12. San Marcos
    -- 13. Huehuetenango
    -- 14. Quiché (Santa Cruz del Quiché)
    -- 15. Baja Verapaz (Salamá)
    -- 16. Alta Verapaz (Cobán)
    -- 17. Petén Centro (Flores / San Benito)
    -- 18. Petén Norte (Tikal / San Andrés)
    -- 19. Petén Sur (Poptún)
    -- 20. Izabal (Puerto Barrios)
    -- 21. Izabal (Morales / Río Dulce)
    -- 22. Zacapa
    -- 23. Chiquimula
    -- 24. Jalapa
    -- 25. Jutiapa
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
    v_dispersion NUMERIC := 0.04; -- Dispersión de ~4km alrededor del departamento

    i INT;
BEGIN
    RAISE NOTICE 'Iniciando inserción masiva de % censos en TODO EL TERRITORIO DE GUATEMALA (22 Departamentos)...', v_total_censos;

    FOR i IN 1..v_total_censos LOOP
        -- Seleccionar nombre y apellido aleatorio
        v_random_nombre := v_nombres[1 + floor(random() * array_length(v_nombres, 1))::INT];
        v_random_apellido := v_apellidos[1 + floor(random() * array_length(v_apellidos, 1))::INT];

        -- Miembros familiares entre 1 y 8
        v_random_miembros := 1 + floor(random() * 8)::INT;

        -- Televisiones entre 0 y 4
        v_random_tvs := floor(random() * 5)::INT;

        -- Seleccionar aleatoriamente uno de los puntos que cubren toda Guatemala
        v_random_idx := 1 + floor(random() * array_length(v_deptos_lat, 1))::INT;

        -- Coordenadas con ligera variación alrededor de la cabecera departamental
        v_random_lat := round((v_deptos_lat[v_random_idx] + (random() - 0.5) * v_dispersion)::NUMERIC, 8);
        v_random_lng := round((v_deptos_lng[v_random_idx] + (random() - 0.5) * v_dispersion)::NUMERIC, 8);

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

    RAISE NOTICE '¡Carga masiva finalizada con éxito! Se insertaron % registros en toda Guatemala con origenCarga = masivo.', v_total_censos;
END $$;
