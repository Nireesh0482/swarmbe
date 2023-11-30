/* eslint-disable camelcase */
const projectRepo = require('../../repositories/auditTool/projectRepository');
const { convertUTCDateToLocalDate } = require('../../utils/date');

const validateDuplicateProjectData = (projectDetails) => {
  /**
   * @description for @function projectDetailsDuplicateValidation
   * @param {Object} currentElement currentElement being compared with Array @var projectDetails
   * @param {number} indexValue index of currentElement in array @var projectDetails
   * @returns {Boolean}
   */
  const projectDetailsDuplicateValidation = (currentElement, indexValue) => {
    const { project_id, emp_id } = currentElement;
    // checking whether element in the array are unique and doesn't contain repeated values for (
    // project_id, emp_id )
    const elementIsUnique = projectDetails.every((ele, eleIndex) => {
      if (
        ele.emp_id === emp_id &&
        ele.project_id === project_id &&
        eleIndex === indexValue // main condition to check whether element is compared with itself, then skip it(true)
      ) {
        // As we are checking duplicate object i.e(project_id, emp_id) with same
        // array,So the same element self(element comparing with itself) checking is skipped and returned as true
        return true;
      }
      return !(ele.emp_id === emp_id && ele.project_id === project_id);
    });
    return elementIsUnique; // true if element is unique else false
  };

  // main process start here
  const projectAndEmployeeDuplicateValue = projectDetails.reduce(
    (projectDetailDuplicateIndex, currentArrayElement, index) => {
      const isDuplicateProjectData = projectDetailsDuplicateValidation(currentArrayElement, index);
      if (!isDuplicateProjectData) {
        // if element is duplicate then save its index in array and send it to frontend
        projectDetailDuplicateIndex.push(index);
        return projectDetailDuplicateIndex;
      }
      return projectDetailDuplicateIndex;
    },
    [], // to store index of row present in frontend which are duplicate.
  );
  return projectAndEmployeeDuplicateValue;
};

const dataDivision = (projectData) => {
  // separate the data for two table(project table and project Emp Table)
  // data is divided according to the requirement of the columns from both table
  const projectLoopArray = [];
  let projectIdMem;
  const [newProjectData, newProjectEmpData] = projectData.reduce(
    (
      [onlyProjectData, onlyProjectEmpData],
      {
        // destructure the each row From excel Data
        project_id,
        project_name,
        start_date,
        end_date,
        status,
        project_manager,
        qa,
        type,
        emp_id,
        role,
        project_emp_status,
        short_project_name,
      },
    ) => {
      const projectId = project_id?.toString().trim();
      if (projectId !== undefined && projectId !== '') {
        // keep projectId in Memory to Generate pe_id for projectEmployeeData Column
        projectIdMem = projectId;
      }
      // remove Duplicate rows because project ID is Primary key and cant have duplicate
      if (!projectLoopArray.includes(projectId) && projectId !== '' && projectId !== undefined) {
        onlyProjectData.push({
          project_id: projectId,
          project_name,
          start_date,
          end_date,
          status,
          short_project_name,
          project_manager: project_manager?.toString()?.toUpperCase(),
          qa,
          type,
        });
        projectLoopArray.push(projectId);
      }
      // generate pe_id(primary key) for project_emp_details Table
      const pe_id = `${projectIdMem}_${emp_id}`;

      // push only required Data to projectEmpData Table
      onlyProjectEmpData.push({
        pe_id,
        project_id: projectIdMem,
        emp_id: emp_id?.toString()?.toUpperCase(),
        role,
        project_emp_status,
      });
      return [onlyProjectData, onlyProjectEmpData];
    },
    [[], []],
  );
  // Divided into Two Data for Two Tables
  return { newProjectData, newProjectEmpData };
};

// Divide ProjectData for two Tables i.e(project_data,project_emp_detials)
const createProjectData = async (projectData) => {
  // new ProjectData for project Table , newProjectEmpData for project Employee data table
  const { newProjectData, newProjectEmpData } = dataDivision(projectData);
  const addedProjectData = await projectRepo.createProjectDB(newProjectData, newProjectEmpData);
  return addedProjectData;
};

const getProjects = async () => {
  const projects = await projectRepo.getAllprojects();

  /**
   * @var projectInfo contains project info
   * @var {Array<Object>} projectEmpData  contains all employee details for that project
   */
  const finalAllProject = projects.map(
    ({ projectEmpData, start_date: startDate, end_date: endDate, ...projectInfo }) => {
      /**
       *@var {Object} employeeData is eager loaded in from sequelize and contains employee name,
       *@example employeeData:{emp_name:"someName"}
       *@var projectEmpDetails contains employee Details except employee name
       */

      const employeeDetails = projectEmpData.map(({ employeeData: { emp_name }, ...projectEmpDetails }) => ({
        emp_name: emp_name ?? null,
        ...projectEmpDetails,
      }));
      return {
        ...projectInfo,
        start_date: convertUTCDateToLocalDate(startDate),
        end_date: convertUTCDateToLocalDate(endDate),
        projectEmpData: employeeDetails,
      };
    },
  );

  /**
   * @returns all Project with their employee Details
   * @example output below
   * {
            "project_id": "PROJECT_!",
            "project_name": "SOME Tool",
            "start_date": "2022-06-05T18:30:00.000Z",
            "end_date": "2022-06-05T18:30:00.000Z",
            "status": "Active",
            "project_manager": "0001",
            "qa": 111,
            "type": "type",
            "projectEmpData": [
                { "emp_name": "employee Name 1","emp_id": "01","role": "SDE","project_emp_status": "Inactive"},
                {"emp_name": "employee 2","emp_id": "483","role": "SDE","project_emp_status": "Inactive"}
            ]
        }
   */

  return finalAllProject;
};

const getProjectsByName = async () => {
  const projectByName = await projectRepo.getOneProjectByName();
  return projectByName;
};

const deleteProjects = async (Data) => {
  // get all project_id and emp_id of employee
  const employeeIds = Data.map(({ 'Project ID': project_id, 'Emp ID': emp_id }) => ({
    project_id,
    emp_id,
  }));

  const projectDeletion = await projectRepo.deleteProject(employeeIds);
  return projectDeletion;
};

const getProjectName = async (projectId) => {
  const projectNameAndShortName = await projectRepo.getProjectName(projectId);
  if (projectNameAndShortName !== null) {
    const { project_name: projName, short_project_name: shortProjectName } = projectNameAndShortName;
    return { projName, shortProjectName };
  }
  return { projName: null, shortProjectName: null };
};

const getAllProjects = async () => {
  const projData = await projectRepo.getAllProjects();
  return projData;
};

module.exports = {
  validateDuplicateProjectData,
  createProjectData,
  getProjects,
  getProjectsByName,
  deleteProjects,
  getProjectName,
  getAllProjects,
};
