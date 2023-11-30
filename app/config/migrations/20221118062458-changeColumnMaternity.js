/* eslint-disable implicit-arrow-linebreak */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      queryInterface.sequelize.transaction(async (t) => {
        await queryInterface.addColumn(
          { tableName: 'maternity_details', schema: 'prom_tool' },
          'internal_status', // column name
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          {
            logging: console.log,
            transaction: t,
          },
        );
      });
    } catch (error) {
      console.log(error);
      throw new Error('Transaction Error');
    }
  },
  async down(queryInterface, Sequelize) { },
};
