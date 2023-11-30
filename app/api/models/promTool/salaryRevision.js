const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promSalaryRevision = sequelize.define(
    'prom_salary_revision',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        allowNull: false,
        validate: { notNull: { msg: 'resource_emp_id is required' } },
      },
      revision_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { notNull: { msg: 'revision start date is required' } },
      },
      revision_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      ctc: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: { notNull: { msg: 'ctc is required' } },
      },
      remarks: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promSalaryRevision.addScope('removeTimeStamp', {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  });

  promSalaryRevision.associate = (models) => {
    promSalaryRevision.belongsTo(models.promAvinEmployeeDetails, {
      targetKey: 'resource_emp_id',
      foreignKey: 'resource_emp_id',
      as: 'promSalaryRevisionEmployeeFk',
    });
  };
  return promSalaryRevision;
};
