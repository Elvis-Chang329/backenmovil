import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

export interface CensoAttributes {
    id: number;
    nombre: string;
    apellido: string;
    totalMiembros: number;
    cantidadTelevisiones: number;
    latitud: number;
    longitud: number;
    origenCarga: 'normal' | 'masivo';
    censistaId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CensoCreationAttributes extends Optional<CensoAttributes, 'id' | 'origenCarga' | 'censistaId'> { }

class Censo extends Model<CensoAttributes, CensoCreationAttributes> implements CensoAttributes {
    declare id: number;
    declare nombre: string;
    declare apellido: string;
    declare totalMiembros: number;
    declare cantidadTelevisiones: number;
    declare latitud: number;
    declare longitud: number;
    declare origenCarga: 'normal' | 'masivo';
    declare censistaId?: number | null;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Censo.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        apellido: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        totalMiembros: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        cantidadTelevisiones: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        latitud: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
            get() {
                const val = this.getDataValue('latitud');
                return val === null ? null : parseFloat(val as any);
            },
        },
        longitud: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
            get() {
                const val = this.getDataValue('longitud');
                return val === null ? null : parseFloat(val as any);
            },
        },
        origenCarga: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'normal',
            validate: {
                isIn: [['normal', 'masivo']],
            },
        },
        censistaId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'usuarios',
                key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        },
    },
    {
        sequelize,
        tableName: 'censos',
        timestamps: true,
    }
);

// Relación opcional
Censo.belongsTo(User, { foreignKey: 'censistaId', as: 'censista' });
User.hasMany(Censo, { foreignKey: 'censistaId', as: 'censos' });

export default Censo;
