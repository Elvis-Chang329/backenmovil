import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';
import { parsePhotoData, detectMimeType } from '../utils/photo.util';

const sendResponse = (res: Response, statusCode: number, success: boolean, message: string, data: any = null, error: any = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        error,
    });
};

/**
 * Busca un usuario por ID numérico o nombre de usuario
 */
const findUserByIdOrUsername = async (identifier: string | number) => {
    const idNum = Number(identifier);
    if (!isNaN(idNum) && idNum > 0) {
        const user = await User.findByPk(idNum);
        if (user) return user;
    }

    return await User.findOne({
        where: {
            [Op.or]: [
                { usuario: { [Op.iLike]: String(identifier).trim() } },
                { email: { [Op.iLike]: String(identifier).trim() } },
            ]
        }
    });
};

/**
 * Obtener un usuario por ID o nombre de usuario
 * Si ya tiene foto, la devuelve en el campo 'foto' y activa 'hasFoto: true'
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdOrUsername(id);

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario no encontrado', null, 'USER_NOT_FOUND');
        }

        const userJson = user.toJSON() as any;
        const hasFoto = Boolean(userJson.foto && String(userJson.foto).trim().length > 0);

        return sendResponse(res, 200, true, 'Usuario obtenido exitosamente', {
            ...userJson,
            hasFoto,
        });
    } catch (error: any) {
        console.error('Error en getUserById:', error);
        return sendResponse(res, 500, false, 'Error al obtener usuario', null, error.message);
    }
};

/**
 * Listar todos los usuarios
 */
export const getUsers = async (_req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['contrasena'] }
        });

        const usersFormatted = users.map(u => {
            const json = u.toJSON() as any;
            return {
                ...json,
                hasFoto: Boolean(json.foto && String(json.foto).trim().length > 0),
            };
        });

        return sendResponse(res, 200, true, 'Lista de usuarios obtenida exitosamente', usersFormatted);
    } catch (error: any) {
        console.error('Error en getUsers:', error);
        return sendResponse(res, 500, false, 'Error al obtener usuarios', null, error.message);
    }
};

/**
 * Actualizar datos de un usuario (incluyendo opción de foto)
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdOrUsername(id);

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario no encontrado', null, 'USER_NOT_FOUND');
        }

        const { nombre, apellido, email, telefono, edad, fechaNacimiento } = req.body;

        // Si enviaron foto o byteArray en la actualización
        const parsedPhoto = parsePhotoData(req);
        const updateData: any = {};

        if (nombre !== undefined) updateData.nombre = String(nombre).trim();
        if (apellido !== undefined) updateData.apellido = String(apellido).trim();
        if (email !== undefined) updateData.email = String(email).trim();
        if (telefono !== undefined) updateData.telefono = String(telefono).trim();
        if (edad !== undefined) updateData.edad = Number(edad);
        if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
        if (parsedPhoto) updateData.foto = parsedPhoto.base64;

        await user.update(updateData);

        const updatedJson = user.toJSON() as any;
        return sendResponse(res, 200, true, 'Usuario actualizado exitosamente', {
            ...updatedJson,
            hasFoto: Boolean(updatedJson.foto && String(updatedJson.foto).trim().length > 0),
        });
    } catch (error: any) {
        console.error('Error en updateUser:', error);
        return sendResponse(res, 500, false, 'Error al actualizar usuario', null, error.message);
    }
};

/**
 * 3. Api backend que permita guardar la foto (byteArray)
 * Permite guardar/actualizar la foto de un usuario enviada como:
 * - ByteArray (arreglo de números en JSON)
 * - Base64 en String
 * - Archivo binario directo (octet-stream / image)
 * - Multipart (form-data)
 */
export const uploadUserPhoto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdOrUsername(id);

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario no encontrado', null, 'USER_NOT_FOUND');
        }

        const parsedPhoto = parsePhotoData(req);

        if (!parsedPhoto) {
            return sendResponse(
                res, 
                400, 
                false, 
                'No se proporcionó ninguna foto o byteArray válido. Puedes enviarla como campo "foto", "byteArray", archivo multipart o binario.', 
                null, 
                'PHOTO_REQUIRED'
            );
        }

        // Guardar la foto en base64 en la base de datos
        await user.update({ foto: parsedPhoto.base64 });

        return sendResponse(res, 200, true, 'Foto guardada exitosamente en el backend', {
            id: user.id,
            usuario: user.usuario,
            nombre: user.nombre,
            apellido: user.apellido,
            hasFoto: true,
            foto: parsedPhoto.base64,
            byteArrayLength: parsedPhoto.buffer.length,
        });
    } catch (error: any) {
        console.error('Error en uploadUserPhoto:', error);
        return sendResponse(res, 500, false, 'Error al guardar la foto del usuario', null, error.message);
    }
};

/**
 * 4. Si ya hay una foto en backend setear la foto de backend
 * Endpoint para consultar la foto del usuario:
 * - Devuelve JSON con 'foto' (Base64) y 'byteArray' (arreglo de números)
 * - O si se envía ?raw=true o Accept: image/*, devuelve el binario de la imagen directamente
 */
export const getUserPhoto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdOrUsername(id);

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario no encontrado', null, 'USER_NOT_FOUND');
        }

        if (!user.foto || String(user.foto).trim().length === 0) {
            return sendResponse(res, 404, false, 'El usuario no tiene una foto registrada en el backend', {
                id: user.id,
                usuario: user.usuario,
                hasFoto: false,
                foto: null,
                byteArray: null,
            }, 'NO_PHOTO');
        }

        let cleanBase64 = String(user.foto).trim();
        if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1].trim();
        }

        const buffer = Buffer.from(cleanBase64, 'base64');
        const isRawRequested = req.query.raw === 'true' || 
                              req.headers.accept?.includes('image/') || 
                              req.path.endsWith('/raw');

        // Si se pide la imagen directa en binario (para Glide, Coil o BitmapFactory)
        if (isRawRequested) {
            const mimeType = detectMimeType(buffer);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', buffer.length);
            return res.send(buffer);
        }

        // Si se pide en formato JSON (con Base64 y ByteArray listo para Kotlin)
        return sendResponse(res, 200, true, 'Foto del backend obtenida exitosamente', {
            id: user.id,
            usuario: user.usuario,
            hasFoto: true,
            foto: cleanBase64,
            byteArray: Array.from(buffer),
            size: buffer.length,
        });
    } catch (error: any) {
        console.error('Error en getUserPhoto:', error);
        return sendResponse(res, 500, false, 'Error al obtener la foto del usuario', null, error.message);
    }
};

/**
 * Devuelve directamente el binario de la imagen (raw)
 * Ideal para cargar con Glide/Coil: `load("http://.../api/users/1/foto/raw")`
 * o con Retrofit `Response<ResponseBody>`
 */
export const getUserPhotoRaw = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdOrUsername(id);

        if (!user || !user.foto || String(user.foto).trim().length === 0) {
            return res.status(404).send('Foto no encontrada');
        }

        let cleanBase64 = String(user.foto).trim();
        if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1].trim();
        }

        const buffer = Buffer.from(cleanBase64, 'base64');
        const mimeType = detectMimeType(buffer);

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    } catch (error: any) {
        console.error('Error en getUserPhotoRaw:', error);
        return res.status(500).send('Error interno');
    }
};

/**
 * Eliminar foto del usuario
 */
export const deleteUserPhoto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdOrUsername(id);

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario no encontrado', null, 'USER_NOT_FOUND');
        }

        await user.update({ foto: null as any });

        return sendResponse(res, 200, true, 'Foto eliminada exitosamente del backend', {
            id: user.id,
            usuario: user.usuario,
            hasFoto: false,
            foto: null,
        });
    } catch (error: any) {
        console.error('Error en deleteUserPhoto:', error);
        return sendResponse(res, 500, false, 'Error al eliminar la foto', null, error.message);
    }
};
