/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
const employeeRepository = require('../../repositories/auditTool/employeeRepository');

/**
 * compare already existing in database and new data from frontEnd and extract only new Data
 * use empId as comparison key for Difference New and old data
 */
const employeeDataCompareFunction = (newData, existingData, empId) => {
  /**
   * if employee is inActive in database.then update for this employee cannot be done,
   * so save the employee data to @var notInsertedData Array to indicate employee in this list are not updated.
   */
  const notInsertedData = [];

  // if employee is made inactive then use this list to remove permission roles for features
  const inActiveEmployeeList = [];

  const isSameUser = (a, b) => {
    if (a.status === 'Inactive') inActiveEmployeeList.push(a[empId]);
    // b.status === 'Inactive' check is done because to restrict updating Inactive data
    const checkBoolean = a[empId] === b[empId] && b.status === 'Inactive';
    return checkBoolean;
  };

  const onlyInLeft = (left, right, compareFunction) => {
    /**
     * compare new data and existing data in database.
     * @var left is new Data @var right is existing data in database
     */
    const onlyData = left.filter(
      (leftValue) =>
        !right.some((rightValue) => {
          const compareValue = compareFunction(leftValue, rightValue);
          if (compareValue) notInsertedData.push(leftValue); //
          return compareValue;
        }),
    );
    return onlyData;
  };
  const newDataFromExcel = onlyInLeft(newData, existingData, isSameUser);

  return [newDataFromExcel, notInsertedData, inActiveEmployeeList];
};

const validateDuplicateEmployeeData = (employeeDetails, field) => {
  /**
   * @description for @function validateDuplicateEmployeeData
   * @param {Object} currentElement currentElement being compared with Array @var employeeDetails
   * @param {number} indexValue index of currentElement in array @var employeeDetails
   * @returns {Boolean}
   */
  const validateDuplicateEmployeeDetails = (currentElement, indexValue) => {
    const currentField = currentElement[field].trim();
    // checking whether element in the array are unique and doesn't contain repeated values for ( emp_id || email)
    const elementIsUnique = employeeDetails.every((ele, eleIndex) => {
      if (
        ele[field].trim() === currentField &&
        eleIndex === indexValue // main condition to check whether element is compared with itself, then skip it(true)
      ) {
        // As we are checking duplicate object i.e(emp_id||email) with same
        // array,So the same element self(element comparing with itself) checking is skipped and returned as true
        return true;
      }

      return !(ele[field].trim() === currentField);
    });
    return elementIsUnique; // true if element is unique else false
  };

  // main process start here
  const employeeDetailsDuplicateValue = employeeDetails.reduce(
    (employeeDetailDuplicateIndex, currentArrayElement, index) => {
      const isDuplicateProjectData = validateDuplicateEmployeeDetails(currentArrayElement, index);
      if (!isDuplicateProjectData) {
        // if element is duplicate then save its index in array and send it to frontend
        employeeDetailDuplicateIndex.push(index);
        return employeeDetailDuplicateIndex;
      }
      return employeeDetailDuplicateIndex;
    },
    [], // to store index of row present in frontend which are duplicate.
  );
  return employeeDetailsDuplicateValue;
};

const validateDuplicateEmpIdAndEmail = (employeeData) => {
  /**
   * @summary check whether duplicate rows with same data present from frontend request body
   * @var {Array<Object>} employeeData contains all employee details from frontend/excel.
   * @return {Object<Array,Array>} duplicate email or emp_id row index of frontend
   */
  const duplicateEmployeeId = validateDuplicateEmployeeData(employeeData, 'emp_id');
  const duplicateEmail = validateDuplicateEmployeeData(employeeData, 'email_id');
  return { duplicateEmail, duplicateEmployeeId };
};

const verifyManagerDetailsInDb = async (employeeData) => {
  const managerIds = [...new Set(employeeData.map(({ manager_id }) => manager_id))];
  const managerDetailsFromDb = await employeeRepository.findManagerDetails(managerIds);
  const onlyManagerIdFromDb = managerDetailsFromDb.map(({ emp_id }) => emp_id);
  const managersNotInDatabase = managerIds.filter((id) => !onlyManagerIdFromDb.includes(id));
  return managersNotInDatabase;
};

const verifyEmployeeExistInDBb = async (employeeData) => {
  const costCenterIds = [...new Set(employeeData.map(({ cost_center_head: costCenterHeadId }) => costCenterHeadId))];
  const employeeDetailsFromDb = await employeeRepository.findEmployeeDetails(costCenterIds);
  const onlyEmployeeIdThatExistInDb = employeeDetailsFromDb.map(({ emp_id }) => emp_id);
  // filter employee id that do not exist in database
  const employeeNotInDatabase = costCenterIds.filter((id) => !onlyEmployeeIdThatExistInDb.includes(id));
  return employeeNotInDatabase;
};

const employeeDataExtract = (EmployeeData) => {
  const employeeDataFromExcel = EmployeeData.map(
    ({ sl_no, emp_id, emp_name, email_id, department, designation, manager_id, status }) => ({
      sl_no,
      emp_id: emp_id?.toString()?.toUpperCase(),
      emp_name: emp_name?.toString()?.trim(),
      email_id: email_id?.toString()?.toLowerCase().trim(),
      department: department?.toString()?.trim(),
      designation: designation?.toString()?.trim(),
      manager_id: manager_id?.toString()?.trim(),
      status: status?.toString()?.trim(),
    }),
  );
  return employeeDataFromExcel;
};

const createEmpData = async (EmployeeData) => {
  const existingData = await employeeRepository.getEveryEmployeeData();

  // convert the in-coming employee details to snake case,so it can be easily compared
  // with employee details from database which is saved as snake case
  const newEmployeeData = employeeDataExtract(EmployeeData);

  // final Response to controller
  const responseResult = (newData, notInsertedData, addedEmployee) => {
    const response = { newData, notInsertedData, addedEmployee };
    return response;
  };

  // if no data present in database ,then all in-coming data are new data
  // save to database and return
  if (existingData.length === 0) {
    const newEmployees = await employeeRepository.createEmployeeDB(newEmployeeData);
    const response = responseResult(EmployeeData, [], newEmployees.addedToDb);
    return response;
  }

  // if some data exist in database, then compare database employee details and new employee details
  // if new data is coming from frontend add to database, other wise return
  const comparedData = employeeDataCompareFunction(newEmployeeData, existingData, 'emp_id', 'email_id');
  const [newData, notInsertedData, inActiveEmployeeList] = comparedData;

  if (newData.length !== 0) {

    const addedEmployee = await employeeRepository.createEmployeeDB(newData, inActiveEmployeeList);
    const result = responseResult(newData, notInsertedData, addedEmployee.addedToDb);
    return result;
  }
  return responseResult(newData, notInsertedData, 0);
};

const getEmployeeData = async () => {
  const empData = await employeeRepository.getAllEmployeeData();
  return empData;
};

const deleteEmp = async (Data) => {
  const empIds = Data.map(({ 'Emp ID': EmpID }) => EmpID); // get All employee id in array
  const deleteEmpDetails = await employeeRepository.deleteEmpData(empIds); // update employee to Inactive
  return deleteEmpDetails;
};

const employeeNameAndEmails = async (ids) => {
  const employeeDetails = await employeeRepository.empDetails(ids);
  return employeeDetails;
};

const individualEmployeeData = async (teamMemberIds, auditorIds) => {
  const employeeData = await employeeNameAndEmails(teamMemberIds);
  const auditorName = await employeeNameAndEmails(auditorIds).then((ele) => ele.map((element) => element.emp_name));

  const [auditTeamMembersNames, auditTeamMembersEmails] = employeeData.reduce(
    ([teamMemberName, teamMemberEmail], { emp_name: employeeName, email_id: employeeEmail }) => {
      teamMemberName.push(employeeName);
      teamMemberEmail.push(employeeEmail);
      return [teamMemberName, teamMemberEmail];
    },
    [[], []],
  );
  return { auditTeamMembersNames, auditTeamMembersEmails, auditorName, employeeData };
};

const getEmployeeRolesListService = async () => {
  const employeeRolesList = await employeeRepository.getEmployeeRolesList();
  return employeeRolesList;
};

const getEmployeeDesignationListService = async () => {
  const employeeDesignationList = await employeeRepository.getEmployeeDesignationList();
  return employeeDesignationList;
};
module.exports = {
  validateDuplicateEmpIdAndEmail,
  getEmployeeDesignationListService,
  validateDuplicateEmployeeData,
  createEmpData,
  getEmployeeData,
  deleteEmp,
  employeeNameAndEmails,
  individualEmployeeData,
  verifyManagerDetailsInDb,
  verifyEmployeeExistInDBb,
  getEmployeeRolesListService,
};
