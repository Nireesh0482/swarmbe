/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert({ tableName: 'location_details', schema: 'prom_tool' }, [
      { location: 'Bangalore' },
      { location: 'Pune' },
      { location: 'Frankfurt' },
      { location: 'Hyderabad' },
      { location: 'Japan' },
      { location: 'LLC' },
    ]);
  },
  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('location', null, {});
  },
};
