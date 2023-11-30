const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const stream = sequelize.define(
    'stream_details',
    {
      stream_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      stream: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  return stream;
};
