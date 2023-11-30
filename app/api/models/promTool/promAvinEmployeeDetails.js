const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinEmployeeDetails = sequelize.define(
    'avin_employee_details',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        primaryKey: true,
        unique: true,
        allowNull: false,
        validate: {
          notNull: { msg: 'Resource Employee id is required' },
        },
      },
      email_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { args: true, msg: 'Provide a valid Email address' },
          notNull: { msg: 'Email-ID is required' },
        },
      },
      is_reporting_manager: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: { args: true, msg: 'Provide a valid  is reporting manager option' },
          notEmpty: { msg: 'Is reporting manager selection is required' },
        },
      },
      resource_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: { args: true, msg: 'Resource name is required' },
          notEmpty: { args: true, msg: 'Resource name can not be empty' },
        },
      },
      resource_doj: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: 'Resource doj is required' },
        },
      },
      designation: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: { msg: 'designation is required' },
        },
      },
      reporting_manager: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notNull: { msg: 'reporting manager is required' },
        },
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'location is required' },
        },
      },
      joined_as: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: { msg: 'joined as is required' },
        },
      },
      ctc: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'ctc is required' },
        },
      },
      per_month: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'per month salary is required' },
        },
      },
      stream: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      total_years_exp: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
      },
      resource_status: {
        type: DataTypes.STRING(10),
        defaultValue: 'Active',
        allowNull: false,
        validate: {
          isIn: {
            args: [['Active', 'Inactive', 'Resigned', 'Buffer']],
            msg: 'resource status cannot be other than Active,InActive,Buffer,Resigned',
          },
          notNull: { msg: 'resource status is required' },
        },
      },
      bu_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      resource_lwd: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promAvinEmployeeDetails.associate = (models) => {
    promAvinEmployeeDetails.hasMany(models.promUserRoles, {
      foreignKey: 'resource_emp_id',
      sourceKey: 'resource_emp_id',
      as: 'promUserRoles',
    });

    promAvinEmployeeDetails.hasMany(models.promAvinResourceAllocation, {
      foreignKey: 'supervisor',
      sourceKey: 'resource_emp_id',
      as: 'promAvinResourceAllocation',
    });

    promAvinEmployeeDetails.hasMany(models.promAvinProjectExpenses, {
      sourceKey: 'resource_emp_id',
      foreignKey: 'approver',
      as: 'promAvinProjectExpenses',
    });

    promAvinEmployeeDetails.hasMany(models.promSalaryRevision, {
      sourceKey: 'resource_emp_id',
      foreignKey: 'resource_emp_id',
      as: 'resourceEmpSalaryRevisionForeignKey',
    });

    promAvinEmployeeDetails.hasMany(models.organizationGRPMgmt, {
      sourceKey: 'resource_emp_id',
      foreignKey: 'org_bu_head',
      as: 'organizationHeadEmployeeDetails',
    });

    promAvinEmployeeDetails.belongsTo(models.groupDetails, {
      targetKey: 'bu_name',
      foreignKey: 'bu_name',
      as: 'employeeGroupName',
    });

    promAvinEmployeeDetails.hasOne(models.promAvinEmployeeDetails, {
      sourceKey: 'reporting_manager',
      foreignKey: 'resource_emp_id',
      as: 'reportingManagerDetails',
      foreignKeyConstraint: false,
      constraints: false,
    });
    promAvinEmployeeDetails.hasMany(models.promAvinResourceAllocation, {
      foreignKey: 'resource_emp_id',
      sourceKey: 'resource_emp_id',
      as: 'employeeResourceAllocation',
    });
    promAvinEmployeeDetails.hasMany(models.promAvinProjectDetails, {
      foreignKey: 'project_bu_name',
      sourceKey: 'bu_name',
      as: 'employeeProjects',
      foreignKeyConstraint: false,
      constraints: false,
    });

    promAvinEmployeeDetails.hasMany(models.resourceSkillDetails, {
      sourceKey: 'resource_emp_id',
      foreignKey: 'resource_emp_id',
      as: 'resourceWiseSkillDetails',
    });
    promAvinEmployeeDetails.hasMany(models.resourcePreviousExpDetails, {
      sourceKey: 'resource_emp_id',
      foreignKey: 'resource_emp_id',
      as: 'resourcePreviousCompanyExpDetails',
    });

    promAvinEmployeeDetails.hasMany(models.promAvinProjectDetails, {
      foreignKey: 'project_manager',
      sourceKey: 'resource_emp_id',
      as: 'promAvinProjectDetails',
    });
  };

  return promAvinEmployeeDetails;
};
