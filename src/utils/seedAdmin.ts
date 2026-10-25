import User from '../models/user.model';

const ADMINISTRADORES = [
    {
        nombre: 'Carlos',
        apellido: 'Ramírez',
        email: 'carlos.admin@censos.gob',
        usuario: 'admin',
        contrasena: 'admin123',
        edad: 35,
        fechaNacimiento: '1989-03-15',
        telefono: '55551234',
        rol: 'administrador',
        foto: null
    },
    {
        nombre: 'Elvis',
        apellido: 'Chang',
        email: 'elvis.admin@censos.gob',
        usuario: 'admin_elvis',
        contrasena: 'admin123',
        edad: 25,
        fechaNacimiento: '2001-01-10',
        telefono: '55554321',
        rol: 'administrador',
        foto: null
    },
    {
        nombre: 'Sofía',
        apellido: 'Morales',
        email: 'sofia.admin@censos.gob',
        usuario: 'admin_sofia',
        contrasena: 'admin123',
        edad: 32,
        fechaNacimiento: '1992-07-22',
        telefono: '55559876',
        rol: 'administrador',
        foto: null
    },
    {
        nombre: 'Fernando',
        apellido: 'López',
        email: 'fernando.admin@censos.gob',
        usuario: 'admin_fernando',
        contrasena: 'admin123',
        edad: 40,
        fechaNacimiento: '1984-11-05',
        telefono: '55556789',
        rol: 'administrador',
        foto: null
    },
    {
        nombre: 'Valeria',
        apellido: 'Gómez',
        email: 'valeria.admin@censos.gob',
        usuario: 'admin_valeria',
        contrasena: 'admin123',
        edad: 29,
        fechaNacimiento: '1995-09-18',
        telefono: '55552468',
        rol: 'administrador',
        foto: null
    },
    {
        nombre: 'Miguel Ángel',
        apellido: 'Castillo',
        email: 'miguel.admin@censos.gob',
        usuario: 'admin_miguel',
        contrasena: 'admin123',
        edad: 38,
        fechaNacimiento: '1986-04-30',
        telefono: '55551357',
        rol: 'administrador',
        foto: null
    }
];

/**
 * Asegura que los administradores por defecto existan en la base de datos (mínimo 6)
 */
export const seedAdminUser = async () => {
    try {
        for (const adminData of ADMINISTRADORES) {
            const existingUser = await User.findOne({
                where: { usuario: adminData.usuario }
            });

            if (!existingUser) {
                await User.create(adminData);
                console.log(`✅ Administrador creado: ${adminData.usuario} (${adminData.nombre} ${adminData.apellido})`);
            } else {
                if (existingUser.rol !== 'administrador') {
                    await existingUser.update({ rol: 'administrador' });
                    console.log(`ℹ️ Rol del usuario ${adminData.usuario} actualizado a administrador`);
                }
            }
        }
        console.log(`✅ Verificación de ${ADMINISTRADORES.length} administradores completada.`);
    } catch (error: any) {
        console.error('⚠️ Error al verificar/crear los usuarios Administradores:', error.message);
    }
};
