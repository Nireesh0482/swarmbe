/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'stream_details',
        schema: 'prom_tool',
      },
      [
        {
          stream: 'Embedded',
        },
        {
          stream: 'Tool',
        },
        {
          stream: 'HR_SYS',
        },
        {
          stream: 'Process Consultant',
        },
        {
          stream: 'Functional Safety',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('stream_details', null, {});
  },
};
