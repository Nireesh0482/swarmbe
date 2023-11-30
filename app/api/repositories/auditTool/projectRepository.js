/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const { Op } = require('sequelize');
const dbInstance = require('../../models');

const createProjectDB = async (newProjectData, newProjectEmpData) => {
  const result = {
    projectDataCount: 0,
    projectEmpDataCount: 0,
  };

  if (newProjectData.length !== 0) {
    const addedProjectData = await dbInstance.projectData
      .bulkCreate(newProjectData, {
        updateOnDuplicate: ['project_name', 'start_date', 'end_date', 'status', 'project_manager', 'qa', 'type'],
        validate: true,
      })
      .catch((Error) => {
        throw Error;
      });
    result.projectDataCount = addedProjectData.length;
  }

  if (newProjectEmpData !== 0) {
    const addedProjectEmpData = await dbInstance.projectEmpData
      .bulkCreate(newProjectEmpData, {
        updateOnDuplicate: ['pe_id', 'project_id', 'emp_id', 'role', 'project_emp_status'],
        validate: true,
      })
      .catch((Error) => {
        throw Error;
      });
    result.projectEmpDataCount = addedProjectEmpData.length;
  }
  return result;
};

// get all projects
const getAllprojects = async () => {
  const allProjects = await dbInstance.projectData
    .findAll({
      attributes: [
        'project_id',
        'project_name',
        'start_date',
        'end_date',
        'status',
        'project_manager',
        'qa',
        'type',
        'short_project_name',
      ],
      include: [
        {
          model: dbInstance.projectEmpData,
          as: 'projectEmpData',
          attributes: ['emp_id', 'role', 'project_emp_status'],
          include: [
            {
              model: dbInstance.employeeData,
              as: 'employeeData',
              attributes: ['emp_name'],
            },
          ],
        },
      ],
    })
    .then((res) => JSON.parse(JSON.stringify(res)));
  // raw:true and nest:true not Used because to Avoid Separation of data
  return allProjects;
};

// get  projects by name
const getOneProjectByName = async () => {
  const oneProject = await dbInstance.masterAudit.findOne();
  return oneProject;
};

const getProjectData = async () => {
  const allProjectData = await dbInstance.projectData.findAll({ raw: true });
  return allProjectData;
};

const getProjectEmployeeDetails = async () => {
  const allProjectEmployees = await dbInstance.projectEmpData.findAll({
    raw: true,
  });
  return allProjectEmployees;
};

const deleteProject = async (projectEmployee) => {
  // cant use bulk update as it has two condition(project_id,emp_id) to satisfy
  const Delete = [];
  for (const emp of projectEmployee) {
    const deleted = await dbInstance.projectEmpData.update(
      { project_emp_status: 'Inactive' },
      {
        where: {
          [Op.and]: [{ project_id: { [Op.like]: emp.project_id } }, { emp_id: { [Op.eq]: emp.emp_id } }],
        },
      },
    );
    Delete.push(deleted);
  }
  return Delete;
};

const getProjectName = async (projectID) => {
  const projectData = await dbInstance.projectData.findOne({
    attributes: ['project_name', 'short_project_name'],
    where: { project_id: projectID },
    raw: true,
  });
  return projectData;
};

const getAllProjects = async () => {
  const projData = await dbInstance.projectData.findAll({
    attributes: ['project_id', 'project_name'],
    where: { status: 'Active' },
    raw: true,
  });
  return projData;
};

module.exports = {
  createProjectDB,
  getAllprojects,
  getOneProjectByName,
  deleteProject,
  getProjectEmployeeDetails,
  getProjectData,
  getProjectName,
  getAllProjects,
};
