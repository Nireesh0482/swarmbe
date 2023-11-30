module.exports = {
  async up(queryInterface) {
    return queryInterface.bulkInsert(
      {
        tableName: 'check_list_type',
        schema: 'audit_tool',
      },
      [
        {
          type: 'Quality',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: 'CM',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: 'Safety',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    );
  },

  async down(queryInterface) {
    return queryInterface.bulkDelete('check_list_type', null, {});
  },
};
