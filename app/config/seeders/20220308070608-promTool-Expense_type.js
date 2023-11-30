/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'expense_type',
        schema: 'prom_tool',
      },
      [
        {
          expense_type: 'Travel Expense',
        },
        {
          expense_type: 'Cab Expense',
        },
        {
          expense_type: 'Food Expense',
        },
        {
          expense_type: 'Project Equipment Cost',
        },
        {
          expense_type: 'UER',
        },
        {
          expense_type: 'Sales Commission',
        },
        {
          expense_type: 'Consultancy fee',
        },
        {
          expense_type: 'Other',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('expense_type', null, {});
  },
};
