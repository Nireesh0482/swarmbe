/* eslint-disable implicit-arrow-linebreak */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      queryInterface.sequelize.transaction(async (t) => {
        Promise.all([
          await queryInterface.addConstraint(
            { tableName: 'avin_employee_details', schema: 'prom_tool' },
            {
              fields: ['reporting_manager'],
              type: 'foreign key',
              name: 'reportingManagerDetails', // optional
              references: {
                table: { tableName: 'avin_employee_details', schema: 'prom_tool' },
                field: 'resource_emp_id',
              },
              logging: console.log,
              transaction: t,
            },
          ),
        ]);
      });
    } catch (error) {
      console.log(error);
      throw new Error('Transaction Error');
    }
  },
  async down(queryInterface, Sequelize) {},
};
