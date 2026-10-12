import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    usuario: string;
    contrasena: string;
    edad: number;
    fechaNacimiento: string;
    telefono: string;
    foto?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public nombre!: string;
    public apellido!: string;
    public email!: string;
    public usuario!: string;
    public contrasena!: string;
    public edad!: number;
    public fechaNacimiento!: string;
    public telefono!: string;
    public foto?: string;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        apellido: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        usuario: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        contrasena: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        edad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fechaNacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        telefono: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        foto: {
            type: DataTypes.TEXT, // Soporta Base64 para la foto de la cámara/galería
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'usuarios',
        timestamps: true,
    }
);

export default User;