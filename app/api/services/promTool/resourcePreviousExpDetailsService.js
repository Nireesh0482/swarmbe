const { set } = require('date-fns');
const resourcePreviousExpRepo = require('../../repositories/promTool/resourcePreviousExpDetailsRepository');
const { areDatesEqual } = require('../../utils/date');

const employeeExpDuplicateCheck = async (employeeData) => {
  const resourceEmpIds = [...new Set(employeeData.map(({ resource_emp_id: resourceEmpId }) => resourceEmpId))];
  const empDetailsFromDb = await resourcePreviousExpRepo.getResourceExpDataById(resourceEmpIds);
  const verifyEmpExpArr = [];

  employeeData.forEach((currElement, index) => {
    const isDuplicateInDB = empDetailsFromDb.some(
      (obj) => obj.resource_emp_id === currElement.resource_emp_id && areDatesEqual(obj.joining_date, currElement.joining_date)
    );
    const isDuplicateInRequest = employeeData.slice(0, index).concat(employeeData.slice(index + 1)).some(
      (obj) => obj.resource_emp_id === currElement.resource_emp_id && areDatesEqual(obj.joining_date, currElement.joining_date)
    );
    if (isDuplicateInDB || isDuplicateInRequest) {
      verifyEmpExpArr.push(index);
    }
  });
  return verifyEmpExpArr;
};

const fetchAllResourcePreviousExpDetails = async () => {
  const resourcePreviousExpData = await resourcePreviousExpRepo.fetchAllResourcePreviousExpDetails();
  return resourcePreviousExpData;
};

const getResourcePreviousExpDetailsById = async (request) => {
  const resourcePreviousExpList = await resourcePreviousExpRepo.getResourcePreviousExpDetailsById(request);
  return resourcePreviousExpList;
};

const uploadResourcePreviousExpDetailsDetails = async (request) => {
  const updateRecords = request.some((e) => e.hasOwnProperty('res_previous_exp_id'));
  let uploadResourcePreviousExp;
  let checkResourceExp
  if (updateRecords === true) {
    uploadResourcePreviousExp = await resourcePreviousExpRepo.updateResourcePreviousExpData(request);
  } else {
    checkResourceExp = await employeeExpDuplicateCheck(request);
    if (checkResourceExp.length === 0) {
      uploadResourcePreviousExp = await resourcePreviousExpRepo.uploadResourcePreviousExpDetailsDetails(request);
    }
  }
  return { uploadResourcePreviousExp, checkResourceExp };
};

module.exports = {
  fetchAllResourcePreviousExpDetails,
  getResourcePreviousExpDetailsById,
  uploadResourcePreviousExpDetailsDetails,
};
