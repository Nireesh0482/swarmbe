/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'project_status',
        schema: 'prom_tool',
      },
      [
        {
          project_status: 'ToStart',
        },
        {
          project_status: 'Running',
        },
        {
          project_status: 'Closed',
        },
        {
          project_status: 'Maintenance',
        },
        {
          project_status: 'Acceptance',
        },
        {
          project_status: 'Warranty',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('project_status', null, {});
  },
};
