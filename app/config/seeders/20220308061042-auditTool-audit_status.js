/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'audit_status',
        schema: 'audit_tool',
      },
      [
        {
          status: 'To Start',
        },
        {
          status: 'Initiated',
        },
        {
          status: 'In Progress',
        },
        {
          status: 'Findings Submission',
        },
        {
          status: 'Findings Resolved',
        },
        {
          status: 'Pending',
        },
        {
          status: 'Cancelled',
        },
        {
          status: 'Closed',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('audit_status', null, {});
  },
};
