/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'prom_allocation',
        schema: 'prom_tool',
      },
      [
        {
          allocation: 0.1,
        },
        {
          allocation: 0.2,
        },
        {
          allocation: 0.25,
        },
        {
          allocation: 0.3,
        },
        {
          allocation: 0.4,
        },
        {
          allocation: 0.5,
        },
        {
          allocation: 0.6,
        },
        {
          allocation: 0.7,
        },
        {
          allocation: 0.75,
        },
        {
          allocation: 0.8,
        },
        {
          allocation: 0.9,
        },
        {
          allocation: 1,
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('prom_allocation', null, {});
  },
};
