import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../src/config/database';
import Censo from '../src/models/censo.model';

const NOMBRES = [
    'Juan', 'Carlos', 'Pedro', 'José', 'Luis', 'Miguel', 'Jorge', 'Fernando', 'David', 'Manuel',
    'María', 'Ana', 'Sofía', 'Elena', 'Lucía', 'Carmen', 'Andrea', 'Valeria', 'Camila', 'Daniela'
];
const APELLIDOS = [
    'López', 'García', 'Morales', 'González', 'Pérez', 'Rodríguez', 'Hernández', 'Ramírez',
    'Martínez', 'Gómez', 'Castillo', 'Flores', 'Vargas', 'Reyes', 'Gutiérrez', 'Cruz', 'Mendoza', 'Aguilar'
];

// Puntos geográficos reales cubriendo los 22 DEPARTAMENTOS DE GUATEMALA
const DEPARTAMENTOS_GUATEMALA = [
    { depto: 'Guatemala (Metropolitana)', lat: 14.634915, lng: -90.506882 },
    { depto: 'Sacatepéquez (Antigua Guatemala)', lat: 14.558611, lng: -90.729444 },
    { depto: 'Chimaltenango', lat: 14.661111, lng: -90.820833 },
    { depto: 'El Progreso (Guastatoya)', lat: 14.854167, lng: -90.075000 },
    { depto: 'Escuintla', lat: 14.300833, lng: -90.785000 },
    { depto: 'Santa Rosa (Cuilapa)', lat: 14.278333, lng: -90.298889 },
    { depto: 'Sololá (Atitlán)', lat: 14.772500, lng: -91.183333 },
    { depto: 'Totonicapán', lat: 14.911389, lng: -91.361111 },
    { depto: 'Quetzaltenango (Xela)', lat: 14.834722, lng: -91.518056 },
    { depto: 'Suchitepéquez (Mazatenango)', lat: 14.534167, lng: -91.503333 },
    { depto: 'Retalhuleu', lat: 14.536111, lng: -91.677778 },
    { depto: 'San Marcos', lat: 14.962778, lng: -91.795833 },
    { depto: 'Huehuetenango', lat: 15.319722, lng: -91.470833 },
    { depto: 'Quiché (Santa Cruz)', lat: 15.030556, lng: -91.148889 },
    { depto: 'Baja Verapaz (Salamá)', lat: 15.103056, lng: -90.318056 },
    { depto: 'Alta Verapaz (Cobán)', lat: 15.470833, lng: -90.370833 },
    { depto: 'Petén Centro (Flores)', lat: 16.924444, lng: -89.896667 },
    { depto: 'Petén Norte (Tikal)', lat: 17.222000, lng: -89.623000 },
    { depto: 'Petén Sur (Poptún)', lat: 16.331100, lng: -89.418600 },
    { depto: 'Izabal (Puerto Barrios)', lat: 15.727778, lng: -88.594444 },
    { depto: 'Izabal (Morales)', lat: 15.478900, lng: -88.825600 },
    { depto: 'Zacapa', lat: 14.972222, lng: -89.530556 },
    { depto: 'Chiquimula', lat: 14.800000, lng: -89.545833 },
    { depto: 'Jalapa', lat: 14.634722, lng: -89.988889 },
    { depto: 'Jutiapa', lat: 14.281667, lng: -89.895833 }
];

const DISPERSION = 0.04; // ~4km alrededor de la cabecera departamental

const runBulkInsert = async () => {
    try {
        const args = process.argv.slice(2);
        const count = args[0] ? parseInt(args[0], 10) : 100;

        console.log(`\n🇬🇹 Iniciando inserción masiva de ${count} censos en TODA GUATEMALA (22 Departamentos)...`);
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        const records = [];
        for (let i = 0; i < count; i++) {
            const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
            const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
            const totalMiembros = Math.floor(Math.random() * 8) + 1; // 1 a 8
            const cantidadTelevisiones = Math.floor(Math.random() * 5); // 0 a 4

            const lugar = DEPARTAMENTOS_GUATEMALA[Math.floor(Math.random() * DEPARTAMENTOS_GUATEMALA.length)];
            const latitud = Number((lugar.lat + (Math.random() - 0.5) * DISPERSION).toFixed(8));
            const longitud = Number((lugar.lng + (Math.random() - 0.5) * DISPERSION).toFixed(8));

            records.push({
                nombre,
                apellido,
                totalMiembros,
                cantidadTelevisiones,
                latitud,
                longitud,
                origenCarga: 'masivo' as const,
            });
        }

        await Censo.bulkCreate(records);

        console.log(`✅ ¡Éxito! Se insertaron ${count} censos en TODA GUATEMALA marcados como 'masivo'.\n`);
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error al ejecutar inserción masiva:', error.message);
        process.exit(1);
    }
};

runBulkInsert();
