/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'project_types',
        schema: 'prom_tool',
      },
      [
        {
          project_type: 'T&M',
        },
        {
          project_type: 'Fixed',
        },
        {
          project_type: 'Other',
        },
        {
          project_type: 'Buffer',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('project_types', null, {});
  },
};
