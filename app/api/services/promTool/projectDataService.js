/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable object-curly-newline */
/* eslint-disable no-unused-vars */
/* eslint-disable arrow-body-style */
const projectRepo = require('../../repositories/promTool/projectDataRepository');

const projectNameDuplicareCheck = async (projectData) => {
  const projectNames = [...new Set(projectData.map(({ project_name: projectName }) => projectName))];
  const projectNamesFromDb = await projectRepo.projectNameVerify(projectNames);

  const dbprojectNames = [...new Set(projectNamesFromDb.map(({ project_name: projectName }) => projectName))];
  const verifyProjectNamesArr = [];
  if (dbprojectNames.length > 0) {
    projectNames.map((currElement) => {
      const verifyProjectNamesExistORNot = dbprojectNames.find((obj) => obj.project_name === currElement);
      if (verifyProjectNamesExistORNot !== 'undefined') {
        const index = projectData.findIndex((obj) => obj.project_name === currElement);
        verifyProjectNamesArr.push(index);
      }
    });
  }
  return verifyProjectNamesArr;
};

const getProjectByID = async (request) => {
  let projectInfo = [];
  const insertRecords = [];
  const updateRecords = [];
  await Promise.all(
    request.map(async (projectCodeArr) => {
      const getprojectData = await projectRepo.getProjectByID(projectCodeArr.project_code);
      if (getprojectData) {
        updateRecords.push({
          project_code: projectCodeArr.project_code?.toString()?.trim(),
          project_name: projectCodeArr.project_name?.toString()?.trim(),
          project_bu_name: projectCodeArr.project_bu_name?.toString()?.trim(),
          project_bu_head: projectCodeArr.project_bu_head?.toString()?.trim(),
          project_manager: projectCodeArr.project_manager?.toString()?.trim(),
          project_type: projectCodeArr.project_type?.toString()?.trim(),
          project_start_date: projectCodeArr.project_start_date?.toString()?.trim(),
          project_end_date: projectCodeArr.project_end_date?.toString()?.trim(),
          po_ro_sow_number: projectCodeArr.po_ro_sow_number?.toString()?.trim(),
          po_ro_sow_value: projectCodeArr.po_ro_sow_value?.toString()?.trim(),
          project_status: projectCodeArr.project_status?.toString()?.trim(),
        });
      } else {
        insertRecords.push({
          project_code: projectCodeArr.project_code?.toString()?.trim(),
          project_name: projectCodeArr.project_name?.toString()?.trim(),
          project_bu_name: projectCodeArr.project_bu_name?.toString()?.trim(),
          project_bu_head: projectCodeArr.project_bu_head?.toString()?.trim(),
          project_manager: projectCodeArr.project_manager?.toString()?.trim(),
          project_type: projectCodeArr.project_type?.toString()?.trim(),
          project_start_date: projectCodeArr.project_start_date?.toString()?.trim(),
          project_end_date: projectCodeArr.project_end_date?.toString()?.trim(),
          po_ro_sow_number: projectCodeArr.po_ro_sow_number?.toString()?.trim(),
          po_ro_sow_value: projectCodeArr.po_ro_sow_value?.toString()?.trim(),
          project_status: projectCodeArr.project_status?.toString()?.trim(),
        });
      }
    }),
  );

  let projectName = [];
  if (updateRecords.length > 0) {
    projectInfo = await projectRepo.updateProjectData(updateRecords);
  }
  if (insertRecords.length > 0) {
    projectName = await projectNameDuplicareCheck(insertRecords);
    if (!projectName.length) {
      projectInfo = await projectRepo.insertAllProjData(insertRecords);
    }
  }
  return { projectInfo, projectName };
};

const fetchAllProjects = async () => {
  const projectData = await projectRepo.fetchAllProjects();
  return projectData;
};

const fetchAllProjectAndTheirEmployee = async () => {
  const projectDetailsWithEmployee = await projectRepo.fetchAllProjectWithTheirEmployeeFromDb();
  projectDetailsWithEmployee.forEach((projectDetailsWithGroup) => {
    const projectDetailsWithoutGroup = projectDetailsWithGroup;
    const projectEmployees = projectDetailsWithGroup?.projectGroupDetails?.groupEmployees ?? [];
    projectDetailsWithoutGroup.projectEmployees = projectEmployees;
    delete projectDetailsWithoutGroup.projectGroupDetails;
  });
  return projectDetailsWithEmployee;
};

const getProjectById = async (request) => {
  const projectData = await projectRepo.getAllProjectDataById(request);
  return projectData;
};

const fetchAllProjStatusData = async () => {
  const projStatusData = await projectRepo.fetchAllProjStatusData();
  return projStatusData;
};

const fetchAllProjTypesData = async () => {
  const projTypesData = await projectRepo.fetchAllProjTypesData();
  return projTypesData;
};

const insertProjectDetails = async (request) => {
  const updateRecords = [];
  const insertProjRecords = [];
  let projectInfo = [];
  await Promise.all(
    request.map(async (projectCodeArr) => {
      const getprojectData = await projectRepo.getProjectByID(projectCodeArr.project_code);
      if (getprojectData) {
        updateRecords.push(projectCodeArr.project_code);
      } else {
        insertProjRecords.push({
          project_code: projectCodeArr.project_code?.toString()?.trim(),
          project_name: projectCodeArr.project_name?.toString()?.trim(),
          project_bu_name: projectCodeArr.project_bu_name?.toString()?.trim(),
          project_bu_head: projectCodeArr.project_bu_head?.toString()?.trim(),
          project_manager: projectCodeArr.project_manager?.toString()?.trim(),
          project_type: projectCodeArr.project_type?.toString()?.trim(),
          project_start_date: projectCodeArr.project_start_date?.toString()?.trim(),
          project_end_date: projectCodeArr.project_end_date?.toString()?.trim(),
          po_ro_sow_number: projectCodeArr.po_ro_sow_number?.toString()?.trim(),
          po_ro_sow_value: projectCodeArr.po_ro_sow_value?.toString()?.trim(),
          project_status: projectCodeArr.project_status?.toString()?.trim(),
        });
      }
    }),
  );
  let insertProject = [];
  let projectName = [];
  if (insertProjRecords.length > 0) {
    projectName = await projectNameDuplicareCheck(insertProjRecords);
    if (!projectName.length) {
      insertProject = await projectRepo.insertAllProjData(insertProjRecords);
    }
  }
  return { insertProject, updateRecords, projectInfo, projectName };
};

const deleteProjects = async (request) => {
  const projectData = await projectRepo.deleteProjectDataById(request);
  return projectData;
};

const groupHeadAndNameValidation = async (bodyDataFromFrontEnd) => {
  // get all group head and group name(combination is unique in table) from database.
  const groupNameAndHeadFromDb = await projectRepo.getOrganizationGroupHeadEmployeeIds();

  // filter out the elements from frontend array where group head and name combination doesn't match with database.
  const groupNameAndHeadNotInDatabase = bodyDataFromFrontEnd.filter(
    ({ project_bu_name: groupName, project_bu_head: groupHead }) => {
      const findGroupNameAndHeadInDb = groupNameAndHeadFromDb.find(({ orgGroupName, orgGroupHead }) => {
        return orgGroupName === groupName && orgGroupHead === groupHead;
      });
      return findGroupNameAndHeadInDb === undefined;
    },
  );
  return groupNameAndHeadNotInDatabase.map(({ project_code }) => project_code);
};

const fetchAllProjGroupNameData = async () => {
  const projGroupNameData = await projectRepo.fetchAllProjGroupNameData();
  return projGroupNameData;
};

const fetchAllPromProjectCodeInArray = async () => {
  const projectCodesInArray = await projectRepo.getAllPromProjectCodeInArray();
  return projectCodesInArray;
};

const fetchAllProjGroupNameDataforAvgEngg = async () => {
  const projGroupNameData = await projectRepo.fetchAllProjGroupNameData();
  return projGroupNameData;
};

module.exports = {
  fetchAllPromProjectCodeInArray,
  groupHeadAndNameValidation,
  fetchAllProjStatusData,
  fetchAllProjTypesData,
  getProjectByID,
  fetchAllProjects,
  getProjectById,
  insertProjectDetails,
  deleteProjects,
  fetchAllProjGroupNameData,
  fetchAllProjectAndTheirEmployee,
  fetchAllProjGroupNameDataforAvgEngg,
};
