const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promUsers = sequelize.define(
    'prom_users',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      full_name: {
        type: DataTypes.STRING(50),
      },
      email_id: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        unique: true,
      },
      profile_picture: {
        type: DataTypes.BLOB(),
        allowNull: true
      },
      expiry_date: {
        type: DataTypes.DATE,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promUsers.associate = (models) => {
    promUsers.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
  };

  return promUsers;
};
