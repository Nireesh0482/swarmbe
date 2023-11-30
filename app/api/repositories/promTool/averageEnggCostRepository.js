const { Op } = require('sequelize');
const dbInstance = require('../../models');

const insertEnggCostData = async (enggCostData) => {
  const insertedEnggCostData = await dbInstance.avinAverageEnggCost.bulkCreate(enggCostData);
  return insertedEnggCostData;
};

const fetchAllEnggCost = async () => {
  const enggCostData = await dbInstance.avinAverageEnggCost.findAll({
    raw: true,
  });
  return enggCostData;
};

const getProjectPlannedActualResourceCount = async (
  { currentMonthStartDate, currentMonthEndDate },
  currentMonthYear,
) => {
  const projectPlannedActualData = await dbInstance.groupDetails.findAll({
    attributes: ['bu_name', 'bu_head'],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        where: {
          project_bu_name: { [Op.eq]: dbInstance.Sequelize.col('bu_details.bu_name') },
          project_type: { [Op.ne]: 'Buffer' },
        },
        attributes: ['project_code', 'project_name', 'project_manager'],
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetails',
            where: { resource_emp_id: { [Op.eq]: dbInstance.Sequelize.col('projectGroupFk.project_manager') } },
            attributes: ['resource_emp_id', 'email_id', 'resource_name'],
          },
          {
            model: dbInstance.promAvinResourceAllocation,
            as: 'promAvinResourceAllocation',
            attributes: [
              'project_code',
              'resource_emp_id',
              [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
              [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
              'allocation',
            ],
            where: dbInstance.sequelize.literal(
              `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
                currentMonthStartDate,
              )}, ${dbInstance.sequelize.escape(currentMonthEndDate)})`,
            ),
          },
          {
            model: dbInstance.promAvinProjectResourceAndCostPlan,
            as: 'promAvinProjectResourceAndCostPlan',
            where: { month_year: currentMonthYear },
            attributes: ['project_code', 'month_year', ['planned_resource', 'planned_resou']],
          },
        ],
      },
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'groupEmployees',
        where: { resource_emp_id: { [Op.eq]: dbInstance.Sequelize.col('bu_details.bu_head') } },
        attributes: ['resource_emp_id', 'email_id'],
      },
    ],
  });
  return JSON.parse(JSON.stringify(projectPlannedActualData));
};

const getEnggCostDataById = async (request) => {
  const enggCostData = await dbInstance.avinAverageEnggCost.findOne({
    where: { un_id: request.un_id },
    raw: true,
  });
  return enggCostData;
};

const updateEnggCostData = async (request) => {
  // first update the average engineering cost in averageEnggCost table for the month
  const updatedAverageEnggCostData = await dbInstance.avinAverageEnggCost.update(
    { average_engg_date: request[0].average_engg_date, average_engg_cost: request[0].average_engg_cost },
    {
      where: { un_id: request[0].un_id },
    },
  );

  // update the planned_cost column in project_resource_cost_plan table.
  // formula : planned_cost = (planned_resource * average_engg_cost) for the particular month(average_engg_date)
  const updatePlannedCost = await dbInstance.promAvinProjectResourceAndCostPlan.update(
    {
      planned_cost: dbInstance.sequelize.fn(
        `${request[0].average_engg_cost} * `,
        dbInstance.sequelize.col('avin_project_resource_cost_plan.planned_resource'),
      ),
    },
    {
      where: { month_year: request[0].average_engg_date },
    },
  );

  return { updatedAverageEnggCostData, updatePlannedCost };
};

const getEnggCostDataByMonth = async (request) => {
  const filterCondition = request.bu_name === 'All' ? {} : request.bu_name;
  const enggCostData = await dbInstance.avinAverageEnggCost.findAll({
    where: {
      bu_name: filterCondition,
      average_engg_date: {
        [Op.between]: [request.start_date, request.end_date],
      },
    },
    raw: true,
  });
  return enggCostData;
};

const getTotalAvgEnggCost = async (request) => {
  const reportData = await dbInstance.avinAverageEnggCost.findOne({
    attributes: [[dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('average_engg_cost')), 'totalAvgEnggCost']],
    where: {
      bu_name: request.bu_name,
      average_engg_date: {
        [Op.between]: [request.start_date, request.end_date],
      },
    },
    raw: true,
  });
  return reportData;
};

module.exports = {
  insertEnggCostData,
  fetchAllEnggCost,
  getEnggCostDataById,
  updateEnggCostData,
  getEnggCostDataByMonth,
  getTotalAvgEnggCost,
  getProjectPlannedActualResourceCount,
};
