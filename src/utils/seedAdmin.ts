import User from '../models/user.model';

/**
 * Asegura que el usuario administrador por defecto exista en la base de datos
 */
export const seedAdminUser = async () => {
    try {
        const adminUser = await User.findOne({
            where: { usuario: 'admin' }
        });

        if (!adminUser) {
            await User.create({
                nombre: 'Administrador',
                apellido: 'Sistema',
                email: 'admin@censos.gob',
                usuario: 'admin',
                contrasena: 'admin123',
                edad: 30,
                fechaNacimiento: '1994-01-01',
                telefono: '12345678',
                rol: 'administrador',
                foto: null
            });
            console.log('✅ Usuario Administrador inicial creado con éxito (usuario: admin / pass: admin123)');
        } else {
            // Asegurar que tenga rol administrador
            if (adminUser.rol !== 'administrador') {
                await adminUser.update({ rol: 'administrador' });
                console.log('ℹ️ Rol del usuario admin actualizado a administrador');
            }
        }
    } catch (error: any) {
        console.error('⚠️ Error al verificar/crear el usuario Administrador:', error.message);
    }
};
