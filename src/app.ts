import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RekognitionClient, CreateFaceLivenessSessionCommand, GetFaceLivenessSessionResultsCommand } from '@aws-sdk/client-rekognition';
import sequelize from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import censoRoutes from './routes/censo.routes';
import { seedAdminUser } from './utils/seedAdmin';

dotenv.config();

const app = express();

// Inicializamos el cliente de Rekognition (el SDK leerá automáticamente tu .env)
const rekognitionClient = new RekognitionClient({
    region: (process.env.AWS_REGION || "us-east-1").trim(),
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
        }
    } : {})
});

app.use(cors());

// Parseo de bodies con soporte de hasta 50MB para fotos de alta resolución en Base64, byteArray o binario
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw({ type: ['image/*', 'application/octet-stream'], limit: '50mb' }));

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
app.use('/api/users', userRoutes);
app.use('/api/censos', censoRoutes);

// Endpoint que llamará tu app de Android
app.post("/api/liveness/create-session", async (req, res) => {
    try {
        // Comando para crear la sesión de Liveness en AWS
        const command = new CreateFaceLivenessSessionCommand({});
        const response = await rekognitionClient.send(command);
        
        // Devolvemos el SessionId en formato JSON hacia tu app Android
        res.json({
            sessionId: response.SessionId
        });
    } catch (error: any) {
        console.error("Error al crear la sesión de liveness:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para verificar los resultados finales de la sesión de Liveness
app.get("/api/liveness/session-results/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;

        const command = new GetFaceLivenessSessionResultsCommand({
            SessionId: sessionId,
        });

        const response = await rekognitionClient.send(command);

        // Devolvemos el estado de la verificación a tu app Android en formato JSON puro
        res.json({
            status: response.Status, // Ej: SUCCEEDED, FAILED, CREATED, IN_PROGRESS
            confidence: response.Confidence, // Nivel de confianza
            referenceImage: response.ReferenceImage // Imagen de referencia capturada
        });
    } catch (error: any) {
        console.error("Error al obtener los resultados de liveness:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

const startServer = async (retries = 5, delayMs = 3000) => {
    while (retries > 0) {
        try {
            await sequelize.sync({ alter: true });
            console.log('Base de datos sincronizada correctamente');
            
            // Garantizar la existencia del usuario administrador en la base de datos
            await seedAdminUser();

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