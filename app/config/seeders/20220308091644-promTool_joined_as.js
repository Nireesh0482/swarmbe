/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'joined_as',
        schema: 'prom_tool',
      },
      [
        {
          joined_as: 'Fresher',
        },
        {
          joined_as: 'Lateral',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('joined_as', null, {});
  },
};
