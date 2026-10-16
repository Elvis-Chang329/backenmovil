import { Router } from 'express';
import multer from 'multer';
import { register, login } from '../controllers/auth.controller';
import { getUserById, getUserPhoto, getUserPhotoRaw, uploadUserPhoto, deleteUserPhoto } from '../controllers/user.controller';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const router = Router();

router.post('/', register);
router.post('/register', register);
router.post('/login', login);

// Rutas complementarias para compatibilidad con la app móvil
router.get('/user/:id', getUserById);
router.get('/:id', getUserById);
router.post('/:id/foto', upload.any(), uploadUserPhoto);
router.put('/:id/foto', upload.any(), uploadUserPhoto);
router.post('/:id/photo', upload.any(), uploadUserPhoto);
router.put('/:id/photo', upload.any(), uploadUserPhoto);
router.get('/:id/foto', getUserPhoto);
router.get('/:id/photo', getUserPhoto);
router.get('/:id/foto/raw', getUserPhotoRaw);
router.get('/:id/photo/raw', getUserPhotoRaw);
router.delete('/:id/foto', deleteUserPhoto);
router.delete('/:id/photo', deleteUserPhoto);

export default router;