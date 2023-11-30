const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const organizationGRPMgmt = sequelize.define(
    'org_bu_aop',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      org_bu_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: 'orgAOPNameAndMonthCompositeIndex',
        validate: {
          notNull: { msg: 'BU name is required' },
        },
      },
      org_bu_head: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notNull: { msg: 'BU head is required' },
        },
      },
      aop_resource: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'AOP Resource is required' },
        },
      },
      aop_revenue: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'AOP Revenue is required' },
        },
      },
      aop_cost: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'AOP Cost is required' },
        },
      },
      aop_month: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        unique: 'orgAOPNameAndMonthCompositeIndex',
        validate: {
          notNull: { msg: 'AOP month is required' },
        },
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

  organizationGRPMgmt.addScope('removeTimeStamp', {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  });

  organizationGRPMgmt.associate = (models) => {
    organizationGRPMgmt.belongsTo(models.promAvinEmployeeDetails, {
      targetKey: 'resource_emp_id',
      foreignKey: 'org_bu_head',
      as: 'groupHeadEmployeeIdFk',
    });

    organizationGRPMgmt.belongsTo(models.groupDetails, {
      targetKey: 'bu_name',
      foreignKey: 'org_bu_name',
      as: 'organizationAOPandProjectGroup',
    });
  };
  return organizationGRPMgmt;
};
