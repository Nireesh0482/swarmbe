/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'audit_roles',
        schema: 'audit_tool',
      },
      [
        { roles: 'President' },
        { roles: 'Business Unit Head' },
        { roles: 'Head, Sales and Marketing' },
        { roles: 'Head, Quality and Safety Assurance' },
        { roles: 'Head, Operations' },
        { roles: 'Delivery Manager' },
        { roles: 'Program Manager' },
        { roles: 'Project Manager' },
        { roles: 'Project Leader' },
        { roles: 'Principal Architect' },
        { roles: 'Senior Architect' },
        { roles: 'Architect' },
        { roles: 'Associate Architect' },
        { roles: 'Senior Technical Leader' },
        { roles: 'Technical Leader' },
        { roles: 'Senior Software Engineer' },
        { roles: 'Software Engineer' },
        { roles: 'Associate Engineer' },
        { roles: 'Associate Project Leader' },
        { roles: 'Manager, HR' },
        { roles: 'Assistant Manager, HR' },
        { roles: 'Senior HR Executive' },
        { roles: 'HR Executive' },
        { roles: 'HR Trainee' },
        { roles: 'Senior Quality Leader' },
        { roles: 'Technical Quality Leader' },
        { roles: 'Process Consultant' },
        { roles: 'Architect and Safety Consultant' },
        { roles: 'Consultant, Quality and Functional Safety' },
        { roles: 'Senior Safety Engineer' },
        { roles: 'Safety Engineer' },
        { roles: 'Sales Manager' },
        { roles: 'Sales Executive' },
        { roles: 'Manager (IT Administration)' },
        { roles: 'Executive (IT Administration)' },
        { roles: 'Manager (Administration)' },
        { roles: 'Executive (Administration)' },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('audit_roles', null, {});
  },
};
