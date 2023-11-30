const { DataTypes } = require('sequelize');

const sequelize = require('../../../config/db.config');

module.exports = () => {
  const Users = sequelize.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      full_name: {
        type: DataTypes.STRING,
      },
      email_id: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      emp_id: {
        type: DataTypes.STRING,
        unique: true,
      },
      expiry_date: {
        type: DataTypes.DATE,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  Users.associate = (models) => {
    Users.belongsTo(models.employeeData, {
      foreignKey: 'emp_id',
      as: 'employeeData',
    });
  };

  return Users;
};
