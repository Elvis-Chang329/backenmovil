import { Request, Response } from 'express';
import Censo from '../models/censo.model';
import User from '../models/user.model';

const sendResponse = (res: Response, statusCode: number, success: boolean, message: string, data: any = null, error: any = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        error,
    });
};

/**
 * 2. Capturar información de un censo (Solo censista)
 * Recibe: nombre, apellido, totalMiembros, cantidadTelevisiones, latitud, longitud
 */
export const createCenso = async (req: Request, res: Response) => {
    try {
        const { 
            nombre, 
            apellido, 
            totalMiembros, 
            cantidadTelevisiones, 
            latitud, 
            longitud, 
            censistaId, 
            origenCarga 
        } = req.body;

        if (!nombre || !apellido || totalMiembros === undefined || cantidadTelevisiones === undefined) {
            return sendResponse(res, 400, false, 'Faltan campos obligatorios del censo (nombre, apellido, totalMiembros, cantidadTelevisiones)', null, 'MISSING_FIELDS');
        }

        if (latitud === undefined || longitud === undefined || isNaN(Number(latitud)) || isNaN(Number(longitud))) {
            return sendResponse(res, 400, false, 'Las coordenadas de Google Maps (latitud y longitud) son obligatorias y deben ser números válidos', null, 'INVALID_COORDINATES');
        }

        const miembrosNum = Number(totalMiembros);
        const tvsNum = Number(cantidadTelevisiones);

        if (miembrosNum < 1) {
            return sendResponse(res, 400, false, 'El total de miembros debe ser al menos 1', null, 'INVALID_MEMBERS');
        }

        if (tvsNum < 0) {
            return sendResponse(res, 400, false, 'La cantidad de televisiones no puede ser negativa', null, 'INVALID_TVS');
        }

        // Si se envía censistaId, verificar que exista
        let validCensistaId = null;
        if (censistaId) {
            const user = await User.findByPk(Number(censistaId));
            if (user) {
                validCensistaId = user.id;
            }
        }

        const nuevoCenso = await Censo.create({
            nombre: String(nombre).trim(),
            apellido: String(apellido).trim(),
            totalMiembros: miembrosNum,
            cantidadTelevisiones: tvsNum,
            latitud: Number(latitud),
            longitud: Number(longitud),
            origenCarga: origenCarga === 'masivo' ? 'masivo' : 'normal',
            censistaId: validCensistaId,
        });

        return sendResponse(res, 201, true, 'Censo registrado exitosamente', nuevoCenso);
    } catch (error: any) {
        console.error('Error en createCenso:', error);
        return sendResponse(res, 500, false, 'Error al registrar el censo', null, error.message);
    }
};

/**
 * 3 y 5. Obtener todos los censos capturados (Para visualización en Google Maps y clustering)
 * Soporta filtro opcional: ?origenCarga=normal o ?origenCarga=masivo
 */
export const getCensos = async (req: Request, res: Response) => {
    try {
        const { origenCarga, limit, offset } = req.query;

        const whereCondition: any = {};
        if (origenCarga && ['normal', 'masivo'].includes(String(origenCarga).toLowerCase())) {
            whereCondition.origenCarga = String(origenCarga).toLowerCase();
        }

        const queryOptions: any = {
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'censista',
                    attributes: ['id', 'nombre', 'apellido', 'usuario', 'rol'],
                }
            ]
        };

        if (limit) queryOptions.limit = Number(limit);
        if (offset) queryOptions.offset = Number(offset);

        const censos = await Censo.findAll(queryOptions);

        return sendResponse(res, 200, true, 'Censos obtenidos exitosamente', censos);
    } catch (error: any) {
        console.error('Error en getCensos:', error);
        return sendResponse(res, 500, false, 'Error al obtener censos', null, error.message);
    }
};

/**
 * 5. Obtener detalle de un censo por ID
 * (Usado cuando se hace clic en un marcador de Google Maps para mostrar el diálogo)
 */
export const getCensoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const censo = await Censo.findByPk(Number(id), {
            include: [
                {
                    model: User,
                    as: 'censista',
                    attributes: ['id', 'nombre', 'apellido', 'usuario', 'rol'],
                }
            ]
        });

        if (!censo) {
            return sendResponse(res, 404, false, 'Censo no encontrado', null, 'CENSO_NOT_FOUND');
        }

        return sendResponse(res, 200, true, 'Detalle del censo obtenido exitosamente', censo);
    } catch (error: any) {
        console.error('Error en getCensoById:', error);
        return sendResponse(res, 500, false, 'Error al obtener detalle del censo', null, error.message);
    }
};

/**
 * Estadísticas generales de los censos (Para el panel de administrador)
 */
export const getCensosStats = async (_req: Request, res: Response) => {
    try {
        const total = await Censo.count();
        const normales = await Censo.count({ where: { origenCarga: 'normal' } });
        const masivos = await Censo.count({ where: { origenCarga: 'masivo' } });

        const sumaMiembros = await Censo.sum('totalMiembros') || 0;
        const sumaTvs = await Censo.sum('cantidadTelevisiones') || 0;

        return sendResponse(res, 200, true, 'Estadísticas de censos obtenidas exitosamente', {
            totalCensos: total,
            censosNormales: normales,
            censosMasivos: masivos,
            totalPersonasCensadas: sumaMiembros,
            totalTelevisiones: sumaTvs,
        });
    } catch (error: any) {
        console.error('Error en getCensosStats:', error);
        return sendResponse(res, 500, false, 'Error al obtener estadísticas', null, error.message);
    }
};

/**
 * Eliminar un censo por ID
 */
export const deleteCenso = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const censo = await Censo.findByPk(Number(id));

        if (!censo) {
            return sendResponse(res, 404, false, 'Censo no encontrado', null, 'CENSO_NOT_FOUND');
        }

        await censo.destroy();

        return sendResponse(res, 200, true, 'Censo eliminado exitosamente', { id: Number(id) });
    } catch (error: any) {
        console.error('Error en deleteCenso:', error);
        return sendResponse(res, 500, false, 'Error al eliminar censo', null, error.message);
    }
};
