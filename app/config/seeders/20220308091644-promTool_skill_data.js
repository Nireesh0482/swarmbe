/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'skill_details',
        schema: 'prom_tool',
      },
      [
        {
          skill: 'ASR Stack',
        },
        {
          skill: 'CAN Stack',
        },
        {
          skill: 'Adaptive AUTOSAR',
        },
        {
          skill: 'Diag Stack',
        },
        {
          skill: 'Bootloader',
        },
        {
          skill: 'Tools',
        },
        {
          skill: 'Unit Testing',
        },
        {
          skill: 'Functional Safety',
        },
        {
          skill: 'OS',
        },
        {
          skill: 'EA Tool',
        },
        {
          skill: 'Process Consultant',
        },
        {
          skill: 'Diagnostics',
        },
        {
          skill: 'CAN',
        },
        {
          skill: 'XCP',
        },
        {
          skill: 'LIN',
        },
        {
          skill: 'SomeIpTp',
        },
        {
          skill: 'LdCom',
        },
        // {
        //   skill: 'Diagnostics, CAN, XCP, LIN',
        // },
        // {
        //   skill: 'SomeIpTp, LdCom, XCP, LIN',
        // },
        {
          skill: 'ADAS',
        },
        {
          skill: 'CAN and Diag Stack',
        },
        {
          skill: 'SW-C Editor',
        },
        {
          skill: 'Socket Adapter',
        },
        {
          skill: 'Code Generator',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('skill_details', null, {});
  },
};
