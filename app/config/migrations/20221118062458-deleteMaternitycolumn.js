/* eslint-disable implicit-arrow-linebreak */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      queryInterface.sequelize.transaction(async (t) => {
        await queryInterface.removeColumn(
          { tableName: 'maternity_details', schema: 'prom_tool' },
          'extended_end_date',
          {
            logging: console.log,
            transaction: t,
          },
        );
        await queryInterface.removeColumn({ tableName: 'maternity_details', schema: 'prom_tool' }, 'status', {
          logging: console.log,
          transaction: t,
        });
      });
    } catch (error) {
      console.log(error);
      throw new Error('Transaction Error');
    }
  },
  async down(queryInterface, Sequelize) { },
};
