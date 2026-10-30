import { Router } from 'express';
import multer from 'multer';
import {
    getUsers,
    getUserById,
    updateUser,
    uploadUserPhoto,
    getUserPhoto,
    getUserPhotoRaw,
    deleteUserPhoto
} from '../controllers/user.controller';
import { register, login } from '../controllers/auth.controller';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const router = Router();

// Soporte retrocompatible para registro y login bajo /api/users
router.post('/register', register);
router.post('/login', login);
router.post('/', register);

// CRUD de usuarios
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', upload.any(), updateUser);

// 3. API backend que permita guardar la foto (byteArray)
router.post('/:id/foto', upload.any(), uploadUserPhoto);
router.put('/:id/foto', upload.any(), uploadUserPhoto);
router.post('/:id/photo', upload.any(), uploadUserPhoto);
router.put('/:id/photo', upload.any(), uploadUserPhoto);

// 4. Si ya hay una foto en backend setear la foto de backend
router.get('/:id/foto', getUserPhoto);
router.get('/:id/photo', getUserPhoto);
router.get('/:id/foto/raw', getUserPhotoRaw);
router.get('/:id/photo/raw', getUserPhotoRaw);
router.delete('/:id/foto', deleteUserPhoto);
router.delete('/:id/photo', deleteUserPhoto);

export default router;
