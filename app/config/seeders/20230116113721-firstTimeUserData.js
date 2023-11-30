module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      queryInterface.sequelize.transaction(async (t) => {
        const currentDateWithTime = new Date();
        Promise.all([
          // create initial group
          await queryInterface.bulkInsert(
            {
              tableName: 'bu_details',
              schema: 'prom_tool',
            },
            [
              {
                bu_code: 'S0001',
                bu_name: 'Support',
                bu_head: '0251',
                remarks: '',
              },
            ],
            { logging: console.log, transaction: t },
          ),

          // create array of employee at initial stage here itself
          await queryInterface.bulkInsert(
            {
              tableName: 'avin_employee_details',
              schema: 'prom_tool',
            },
            [
              {
                bu_name: 'Support',
                resource_emp_id: '0251',
                email_id: 'sharath.hj@avinsystems.com',
                is_reporting_manager: 'Yes',
                resource_name: 'Sharath H J',
                resource_doj: '2019-09-09',
                designation: 'Software Engineer',
                reporting_manager: '0251',
                location: 'Bangalore',
                joined_as: 'Lateral',
                ctc: 1000000,
                per_month: 83333.33,
                stream: 'HR_SYS',
                // skill_data: ['CAN Stack'],
                total_years_exp: '4',
                resource_status: 'Active',
                resource_lwd: null,
                createdAt: currentDateWithTime,
                updatedAt: currentDateWithTime,
              },
            ],
            { logging: console.log, transaction: t },
          ),

          await queryInterface.bulkInsert(
            {
              tableName: 'resource_previous_exp_details',
              schema: 'prom_tool',
            },
            [
              {
                resource_emp_id: '0251',
                years_of_exp: 4,
                previous_company_details: 'AVIN systems private limited',
                joining_date: '2019-09-09',
                last_working_date: null,
              },
            ],
            { logging: console.log, transaction: t },
          ),

          await queryInterface.bulkInsert(
            {
              tableName: 'avin_project_details',
              schema: 'prom_tool',
            },
            [
              {
                project_code: 'SP0001_Buffer',
                project_name: 'Support_Buffer',
                project_bu_name: 'Support',
                project_bu_head: '0251',
                project_manager: '0251',
                project_type: 'Buffer',
                project_start_date: '2023-01-01',
                project_end_date: '2023-12-31',
                po_ro_sow_number: null,
                po_ro_sow_value: 0,
                project_status: 'Running',
                createdAt: currentDateWithTime,
                updatedAt: currentDateWithTime,
              },
            ],
            { logging: console.log, transaction: t },
          ),

          // create Roles and Responsibility for Prom tool
          await queryInterface.bulkInsert(
            {
              tableName: 'prom_avin_roles_responsibilities',
              schema: 'prom_tool',
            },
            [
              {
                role_group: 'Admin',
                features_permission: [
                  201, 229, 230, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 228, 214, 215, 216, 217,
                  218, 219, 220, 221, 222, 223, 224, 225, 226, 227,
                ],
                createdAt: currentDateWithTime,
                updatedAt: currentDateWithTime,
              },
            ],
            { logging: console.log, transaction: t },
          ),

          // create initial salary here for the employee from above data
          await queryInterface.bulkInsert(
            {
              tableName: 'prom_salary_revision',
              schema: 'prom_tool',
            },
            [
              {
                resource_emp_id: '0251',
                revision_start_date: '2019-09-09',
                revision_end_date: null,
                ctc: 100000,
                remarks: '',
                createdAt: currentDateWithTime,
                updatedAt: currentDateWithTime,
              },
            ],
            { logging: console.log, transaction: t },
          ),

          // create Admin role for Prom tool - only edit if necessary
          await queryInterface.bulkInsert(
            {
              tableName: 'prom_avin_roles',
              schema: 'prom_tool',
            },
            [{ resource_emp_id: '0251', role_group: 'Admin' }],
            { logging: console.log, transaction: t },
          ),
        ]);
      });
    } catch (error) {
      console.log(error, 'error OCCured');
      throw new Error('Transaction Error');
    }
  },
  async down(queryInterface, Sequelize) { },
};
