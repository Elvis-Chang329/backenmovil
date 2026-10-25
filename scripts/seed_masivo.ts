import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../src/config/database';
import Censo from '../src/models/censo.model';

const NOMBRES = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofía', 'Pedro', 'Elena', 'Jorge', 'Lucía', 'Miguel', 'Carmen', 'David', 'Andrea', 'Fernando', 'Valeria', 'José', 'Camila', 'Manuel', 'Daniela'];
const APELLIDOS = ['Pérez', 'Gómez', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Morales', 'Ramírez', 'Flores', 'Castillo', 'Vargas', 'Reyes', 'Gutiérrez', 'Hernández', 'Cruz', 'Mendoza', 'Aguilar'];

// Coordenadas base (Área metropolitana)
const BASE_LAT = 14.634915;
const BASE_LNG = -90.506882;
const DISPERSION = 0.15; // ~15km a la redonda

const runBulkInsert = async () => {
    try {
        const args = process.argv.slice(2);
        const count = args[0] ? parseInt(args[0], 10) : 100;

        console.log(`\n🚀 Iniciando inserción masiva de ${count} censos...`);
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        const records = [];
        for (let i = 0; i < count; i++) {
            const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
            const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
            const totalMiembros = Math.floor(Math.random() * 8) + 1; // 1 a 8
            const cantidadTelevisiones = Math.floor(Math.random() * 5); // 0 a 4

            // Variación aleatoria alrededor de la coordenada base
            const latitud = Number((BASE_LAT + (Math.random() - 0.5) * DISPERSION).toFixed(8));
            const longitud = Number((BASE_LNG + (Math.random() - 0.5) * DISPERSION).toFixed(8));

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

        console.log(`✅ ¡Éxito! Se insertaron ${count} censos marcados como 'masivo' con coordenadas para Google Maps.\n`);
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error al ejecutar inserción masiva:', error.message);
        process.exit(1);
    }
};

runBulkInsert();
