/* eslint-disable no-unused-vars */

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'features_access_level',
        schema: 'audit_tool',
      },
      [
        {
          feature: 'Employee Data',
          value: '101',
        },
        {
          feature: 'Project Data',
          value: '102',
        },
        {
          feature: 'Cost Center',
          value: '109',
        },
        {
          feature: 'Role Allocation',
          value: '103',
        },
        {
          feature: 'Role Group Management',
          value: '104',
        },
        {
          feature: 'Dashboard',
          value: '105',
        },
        {
          feature: 'Initiation',
          value: '106',
        },
        {
          feature: 'Manage Audit',
          value: '107',
        },
        {
          feature: 'Reports',
          value: '108',
        },
      ],
      {
        // logging: console.log,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete(
      {
        tableName: 'features_access_level',
        schema: 'audit_tool',
      },
      null,
      {
        // logging: console.log,
      },
    );
  },
};
