-- =========================================================================
-- Script SQL para insertar 6 Administradores con datos completos
-- =========================================================================

INSERT INTO "usuarios" (
    "nombre", "apellido", "email", "usuario", "contrasena",
    "edad", "fechaNacimiento", "telefono", "rol", "foto", "createdAt", "updatedAt"
) VALUES 
(
    'Carlos', 'Ramírez', 'carlos.admin@censos.gob', 'admin', 'admin123',
    35, '1989-03-15', '55551234', 'administrador', NULL, NOW(), NOW()
),
(
    'Elvis', 'Chang', 'elvis.admin@censos.gob', 'admin_elvis', 'admin123',
    25, '2001-01-10', '55554321', 'administrador', NULL, NOW(), NOW()
),
(
    'Sofía', 'Morales', 'sofia.admin@censos.gob', 'admin_sofia', 'admin123',
    32, '1992-07-22', '55559876', 'administrador', NULL, NOW(), NOW()
),
(
    'Fernando', 'López', 'fernando.admin@censos.gob', 'admin_fernando', 'admin123',
    40, '1984-11-05', '55556789', 'administrador', NULL, NOW(), NOW()
),
(
    'Valeria', 'Gómez', 'valeria.admin@censos.gob', 'admin_valeria', 'admin123',
    29, '1995-09-18', '55552468', 'administrador', NULL, NOW(), NOW()
),
(
    'Miguel Ángel', 'Castillo', 'miguel.admin@censos.gob', 'admin_miguel', 'admin123',
    38, '1986-04-30', '55551357', 'administrador', NULL, NOW(), NOW()
)
ON CONFLICT ("usuario") DO UPDATE 
SET "rol" = 'administrador',
    "updatedAt" = NOW();
