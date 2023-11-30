/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'resource_status',
        schema: 'prom_tool',
      },
      [
        {
          resource_status: 'Active',
        },
        {
          resource_status: 'Buffer',
        },
        {
          resource_status: 'Resigned',
        },
        {
          resource_status: 'Inactive',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('resource_status', null, {});
  },
};
