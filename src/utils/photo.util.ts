import { Request } from 'express';

export interface ParsedPhoto {
    base64: string;
    buffer: Buffer;
    byteArray: number[];
}

/**
 * Detecta el tipo MIME de una imagen basándose en los magic bytes del buffer
 */
export function detectMimeType(buffer: Buffer): string {
    if (buffer && buffer.length >= 4) {
        // PNG: 89 50 4E 47
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            return 'image/png';
        }
        // JPEG: FF D8 FF
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return 'image/jpeg';
        }
        // GIF: GIF8
        if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
            return 'image/gif';
        }
        // WEBP: RIFF...WEBP
        if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            return 'image/webp';
        }
    }
    return 'image/jpeg';
}

/**
 * Convierte un arreglo de números (bytes firmados o no firmados) en Buffer
 */
function numberArrayToBuffer(arr: any[]): Buffer {
    const uint8 = new Uint8Array(arr.map((val: any) => {
        const n = Number(val);
        // Si viene con signo (-128 a 127 habitual en Kotlin/Java Byte), convertir a unsigned (0 a 255)
        return n < 0 ? (n + 256) % 256 : n % 256;
    }));
    return Buffer.from(uint8);
}

/**
 * Extrae la foto de la petición HTTP, soportando:
 * 1. Multer (multipart/form-data)
 * 2. Raw binary buffer (application/octet-stream, image/*)
 * 3. Array de bytes directo en req.body ([137, 80, ...])
 * 4. Propiedades JSON: foto, byteArray, photo, image, bytes (en Base64 o arreglo de bytes)
 */
export function parsePhotoData(req: Request): ParsedPhoto | null {
    try {
        // 1. Archivo subido con Multer
        const file = (req as any).file || ((req as any).files && (req as any).files[0]);
        if (file && file.buffer && Buffer.isBuffer(file.buffer) && file.buffer.length > 0) {
            return {
                base64: file.buffer.toString('base64'),
                buffer: file.buffer,
                byteArray: Array.from(file.buffer)
            };
        }

        // 2. Buffer binario directo (express.raw)
        if (Buffer.isBuffer(req.body) && req.body.length > 0) {
            return {
                base64: req.body.toString('base64'),
                buffer: req.body,
                byteArray: Array.from(req.body)
            };
        }

        // 3. Array de bytes directo en req.body (ej: Gson serializando ByteArray como lista de enteros)
        if (Array.isArray(req.body) && req.body.length > 0) {
            const buffer = numberArrayToBuffer(req.body);
            return {
                base64: buffer.toString('base64'),
                buffer,
                byteArray: Array.from(buffer)
            };
        }

        // 4. Objeto JSON en req.body
        if (req.body && typeof req.body === 'object') {
            const candidate = req.body.byteArray ??
                req.body.foto ??
                req.body.photo ??
                req.body.image ??
                req.body.bytes ??
                req.body.data;

            if (candidate !== undefined && candidate !== null) {
                // Si es un arreglo de números
                if (Array.isArray(candidate) && candidate.length > 0) {
                    const buffer = numberArrayToBuffer(candidate);
                    return {
                        base64: buffer.toString('base64'),
                        buffer,
                        byteArray: Array.from(buffer)
                    };
                }

                // Si es un string (Base64 o data URL)
                if (typeof candidate === 'string' && candidate.trim().length > 0) {
                    let clean = candidate.trim();
                    if (clean.includes(',')) {
                        clean = clean.split(',')[1].trim();
                    }
                    const buffer = Buffer.from(clean, 'base64');
                    return {
                        base64: clean,
                        buffer,
                        byteArray: Array.from(buffer)
                    };
                }

                // Si es un objeto tipo Buffer serializado { type: 'Buffer', data: [...] }
                if (typeof candidate === 'object' && Array.isArray(candidate.data)) {
                    const buffer = numberArrayToBuffer(candidate.data);
                    return {
                        base64: buffer.toString('base64'),
                        buffer,
                        byteArray: Array.from(buffer)
                    };
                }
            }
        }

        return null;
    } catch (err) {
        console.error('Error al parsear datos de la foto:', err);
        return null;
    }
}
