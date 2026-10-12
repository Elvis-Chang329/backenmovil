import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Límite amplio para recibir fotos en Base64

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor Backend activo y funcionando',
        data: null,
        error: null,
    });
});

// Rutas
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async (retries = 5, delayMs = 3000) => {
    while (retries > 0) {
        try {
            await sequelize.sync({ alter: true });
            console.log('Base de datos sincronizada correctamente');
            app.listen(PORT, () => {
                console.log(`Servidor TypeScript corriendo en el puerto ${PORT}`);
            });
            return;
        } catch (err) {
            retries -= 1;
            console.error(`Error al conectar con la base de datos. Reintentos restantes: ${retries}`);
            if (retries === 0) {
                console.error('No se pudo conectar a la base de datos tras múltiples intentos.');
                process.exit(1);
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
};

startServer();