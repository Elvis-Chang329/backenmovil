import { Router } from 'express';
import { 
    createCenso, 
    getCensos, 
    getCensoById, 
    getCensosStats, 
    deleteCenso 
} from '../controllers/censo.controller';

const router = Router();

// Estadísticas de censos (para dashboard del administrador)
router.get('/stats', getCensosStats);

// 2. Capturar información de censo (Censista)
router.post('/', createCenso);

// 3 y 5. Visualizar censos en el mapa / clustering (Administrador)
router.get('/', getCensos);

// 5. Ver detalle de un censo para el diálogo al hacer clic en un marcador
router.get('/:id', getCensoById);

// Eliminar censo
router.delete('/:id', deleteCenso);

export default router;
