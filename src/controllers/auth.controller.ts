import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';
import bcrypt from 'bcryptjs';
import { parsePhotoData } from '../utils/photo.util';

const sendResponse = (res: Response, statusCode: number, success: boolean, message: string, data: any = null, error: any = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        error,
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, apellido, email, usuario, contrasena, edad, fechaNacimiento, telefono, foto } = req.body;

        // Soporte por si envían 'password' o 'contraseña'
        const rawPassword = contrasena || req.body['contraseña'] || req.body.password;

        if (!nombre || !apellido || !email || !usuario || !rawPassword || !edad || !fechaNacimiento) {
            return sendResponse(res, 400, false, 'Faltan campos obligatorios para el registro', null, 'MISSING_FIELDS');
        }

        const cleanNombre = String(nombre).trim();
        const cleanApellido = String(apellido).trim();
        const cleanEmail = String(email).trim();
        const cleanUsuario = String(usuario).trim();
        const cleanPassword = String(rawPassword).trim();

        // Verificar si el usuario ya existe (insensible a mayúsculas)
        const existingUser = await User.findOne({ 
            where: { 
                usuario: { [Op.iLike]: cleanUsuario } 
            } 
        });
        if (existingUser) {
            return sendResponse(res, 400, false, 'El nombre de usuario ya está en uso', null, 'USER_EXISTS');
        }

        // Verificar si el correo ya existe (insensible a mayúsculas)
        const existingEmail = await User.findOne({ 
            where: { 
                email: { [Op.iLike]: cleanEmail } 
            } 
        });
        if (existingEmail) {
            return sendResponse(res, 400, false, 'El correo electrónico ya está registrado', null, 'EMAIL_EXISTS');
        }

        // Extraer y normalizar foto si fue enviada (como Base64, byteArray, multipart o raw)
        const parsedPhoto = parsePhotoData(req);
        const fotoFinal = parsedPhoto ? parsedPhoto.base64 : (foto ? String(foto).trim() : null);

        // Guardar directamente en texto plano sin encriptar
        const newUser = await User.create({
            nombre: cleanNombre,
            apellido: cleanApellido,
            email: cleanEmail,
            usuario: cleanUsuario,
            contrasena: cleanPassword,
            edad: Number(edad),
            fechaNacimiento,
            telefono: telefono ? String(telefono).trim() : '',
            foto: fotoFinal,
        });

        const userResponse = newUser.toJSON() as any;
        userResponse.hasFoto = Boolean(userResponse.foto && String(userResponse.foto).trim().length > 0);

        return sendResponse(res, 201, true, 'Usuario registrado exitosamente', userResponse);
    } catch (error: any) {
        console.error('Error en register:', error);
        return sendResponse(res, 500, false, 'Error interno del servidor', null, error.message);
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        console.log('[LOGIN] Body recibido:', JSON.stringify(req.body));

        // Acepta usuario, email o username
        const userIdentifier = req.body.usuario || req.body.email || req.body.username;
        // Acepta contrasena, contraseña o password
        const pass = req.body.contrasena || req.body['contraseña'] || req.body.password;

        if (!userIdentifier || !pass) {
            return sendResponse(res, 400, false, 'Debes proporcionar usuario/correo y contraseña', null, 'MISSING_CREDENTIALS');
        }

        const cleanUser = String(userIdentifier).trim();
        const cleanPass = String(pass).trim();

        // Permite buscar tanto por usuario como por email sin importar mayúsculas/minúsculas (iLike)
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { usuario: { [Op.iLike]: cleanUser } },
                    { email: { [Op.iLike]: cleanUser } }
                ]
            }
        });

        if (!user) {
            console.log(`[LOGIN] Usuario "${cleanUser}" no encontrado en BD.`);
            return sendResponse(res, 404, false, 'Usuario o correo no encontrado', null, 'USER_NOT_FOUND');
        }

        const rawDbPass = user.getDataValue('contrasena') ?? user.contrasena ?? (user as any).dataValues?.contrasena;
        const passwordDB = String(rawDbPass).trim();
        const passwordInput = cleanPass;

        console.log(`[LOGIN] Usuario encontrado: "${user.usuario}" (ID: ${user.id})`);
        console.log(`[LOGIN] Comparando passInput="${passwordInput}" con passDB="${passwordDB}"`);

        // 1. Comparación directa en texto plano
        let isMatch = (passwordDB === passwordInput);

        // 2. Si la contraseña en BD es un hash bcrypt (creado antes), usar bcrypt también
        if (!isMatch && (passwordDB.startsWith('$2a$') || passwordDB.startsWith('$2b$') || passwordDB.startsWith('$2y$'))) {
            try {
                isMatch = bcrypt.compareSync(passwordInput, passwordDB);
            } catch (err) {
                isMatch = false;
            }
        }

        if (!isMatch) {
            console.log(`[LOGIN] Contraseña incorrecta para el usuario: "${user.usuario}"`);
            return sendResponse(res, 401, false, 'Contraseña incorrecta', null, 'INVALID_PASSWORD');
        }

        console.log(`[LOGIN] Login exitoso para el usuario: "${user.usuario}"`);
        const userResponse: any = user.get({ plain: true }) || user.toJSON();
        userResponse.hasFoto = Boolean(userResponse.foto && String(userResponse.foto).trim().length > 0);

        return sendResponse(res, 200, true, 'Login exitoso', userResponse);
    } catch (error: any) {
        console.error('Error en login:', error);
        return sendResponse(res, 500, false, 'Error interno del servidor', null, error.message);
    }
};