/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'audit_designation',
        schema: 'audit_tool',
      },
      [
        { designation: 'Associate Engineer' },
        { designation: 'Software Engineer' },
        { designation: 'Safety Engineer' },
        { designation: 'Process Consultant' },
        { designation: 'Senior Software Engineer' },
        { designation: 'Sr. Software Engineer' },
        { designation: 'Associate Technical Leader' },
        { designation: 'Technical Leader' },
        { designation: 'Sr. Technical Leader' },
        { designation: 'Associate Project Leader' },
        { designation: 'Sr. Safety Engineer' },
        { designation: 'Sr. Process Consultant' },
        { designation: 'Quality Leader' },
        { designation: 'Project Leader' },
        { designation: 'Safety Consultant' },
        { designation: 'Sr. Quality Leader' },
        { designation: 'Associate Architect' },
        { designation: 'Sr. Safety Consultant' },
        { designation: 'Quality Manager' },
        { designation: 'Architect' },
        { designation: 'Senior Architect' },
        { designation: 'Principal Architect' },
        { designation: 'Project Manager' },
        { designation: 'Program Manager' },
        { designation: 'Sr. Program Manager' },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('audit_designation', null, {});
  },
};
