import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';
import bcrypt from 'bcryptjs';

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

        if (!nombre || !apellido || !email || !usuario || !contrasena || !edad || !fechaNacimiento) {
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const newUser = await User.create({
            nombre,
            apellido,
            email,
            usuario,
            contrasena: hashedPassword,
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
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena) {
            return sendResponse(res, 400, false, 'Debes proporcionar usuario/correo y contraseña', null, 'MISSING_CREDENTIALS');
        }

        // Permite iniciar sesión tanto con el nombre de usuario como con el email
        const user = await User.findOne({
            where: {
                [Op.or]: [{ usuario }, { email: usuario }]
            }
        });

        if (!user) {
            return sendResponse(res, 404, false, 'Usuario o correo no encontrado', null, 'USER_NOT_FOUND');
        }

        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) {
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