/* eslint-disable no-unused-vars */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert(
      {
        tableName: 'prom_features_access_level',
        schema: 'prom_tool',
      },
      [
        {
          feature: 'Resource Management',
          value: '201',
        },
        {
          feature: 'Resource Skill Data',
          value: '229',
        },
        {
          feature: 'Resource Experience Data',
          value: '230',
        },
        {
          feature: 'Role Allocation',
          value: '202',
        },
        {
          feature: 'Role Group Management',
          value: '203',
        },
        {
          feature: 'Salary Revision',
          value: '204',
        },
        {
          feature: 'BU Details',
          value: '205',
        },
        {
          feature: 'BU & Operational Plan',
          value: '206',
        },
        {
          feature: 'Maternity Group',
          value: '207',
        },
        {
          feature: 'Project Data',
          value: '208',
        },
        {
          feature: 'Resource Allocation',
          value: '209',
        },
        {
          feature: 'Timelog',
          value: '210',
        },
        {
          feature: 'Revenue',
          value: '211',
        },
        {
          feature: 'Average Engg. Cost',
          value: '212',
        },
        {
          feature: 'Claims',
          value: '213',
        },
        {
          feature: 'Computations',
          value: '228',
        },
        {
          feature: 'Resource Utilization - Organization Level',
          value: '214',
        },
        {
          feature: 'Resource Utilization - Resource Level',
          value: '215',
        },
        {
          feature: 'Cost Utilization - Cost Summary',
          value: '216',
        },
        {
          feature: 'Cost Utilization -Cost Analysis',
          value: '217',
        },
        {
          feature: 'Resource & Cost Utilization',
          value: '218',
        },
        {
          feature: 'Revenue - BU Revenue',
          value: '219',
        },
        {
          feature: 'Revenue - Project Revenue',
          value: '220',
        },
        {
          feature: 'Contribution - BU Contribution',
          value: '221',
        },
        {
          feature: 'Contribution - Project Contribution',
          value: '222',
        },
        {
          feature: 'Contribution - Revenue & Cost',
          value: '223',
        },
        {
          feature: 'Claims Report',
          value: '224',
        },
        {
          feature: 'Generic Reports',
          value: '225',
        },
        {
          feature: 'Operational Reports - Resource Utilization',
          value: '226',
        },
        {
          feature: 'Monthly Average Engg. Cost',
          value: '227',
        },
      ],
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('prom_features_access_level', null, {});
  },
};
