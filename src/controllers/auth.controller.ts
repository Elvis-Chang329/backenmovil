import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';

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
        const passwordToSave = contrasena || req.body['contraseña'] || req.body.password;

        if (!nombre || !apellido || !email || !usuario || !passwordToSave || !edad || !fechaNacimiento) {
            return sendResponse(res, 400, false, 'Faltan campos obligatorios para el registro', null, 'MISSING_FIELDS');
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ where: { usuario } });
        if (existingUser) {
            return sendResponse(res, 400, false, 'El nombre de usuario ya está en uso', null, 'USER_EXISTS');
        }

        // Verificar si el correo ya existe
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return sendResponse(res, 400, false, 'El correo electrónico ya está registrado', null, 'EMAIL_EXISTS');
        }

        // Guardar directamente en texto plano sin encriptar
        const newUser = await User.create({
            nombre,
            apellido,
            email,
            usuario,
            contrasena: passwordToSave,
            edad,
            fechaNacimiento,
            telefono,
            foto,
        });

        const userResponse = newUser.toJSON() as any;
        delete userResponse.contrasena;

        return sendResponse(res, 201, true, 'Usuario registrado exitosamente', userResponse);
    } catch (error: any) {
        console.error('Error en register:', error);
        return sendResponse(res, 500, false, 'Error interno del servidor', null, error.message);
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        // Acepta usuario, email o username
        const userIdentifier = req.body.usuario || req.body.email || req.body.username;
        // Acepta contrasena, contraseña o password
        const pass = req.body.contrasena || req.body['contraseña'] || req.body.password;

        if (!userIdentifier || !pass) {
            return sendResponse(res, 400, false, 'Debes proporcionar usuario/correo y contraseña', null, 'MISSING_CREDENTIALS');
        }

        // Permite iniciar sesión tanto con el nombre de usuario como con el email
        const user = await User.findOne({
            where: {
                [Op.or]: [{ usuario: userIdentifier }, { email: userIdentifier }]
            }
        });

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario o correo no encontrado', null, 'USER_NOT_FOUND');
        }

        // Comparación directa en texto plano (sin encriptación)
        if (user.contrasena !== pass) {
            return sendResponse(res, 401, false, 'Contraseña incorrecta', null, 'INVALID_PASSWORD');
        }

        const userResponse = user.toJSON() as any;
        delete userResponse.contrasena;

        return sendResponse(res, 200, true, 'Login exitoso', userResponse);
    } catch (error: any) {
        console.error('Error en login:', error);
        return sendResponse(res, 500, false, 'Error interno del servidor', null, error.message);
    }
};