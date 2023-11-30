const resourceSkillRepo = require('../../repositories/promTool/resourceSkillDetailsRepository');

const fetchAllResourceSkills = async () => {
  const resourceSkillData = await resourceSkillRepo.fetchAllResourceSkills();
  return resourceSkillData;
};

const getResourceSkillsById = async (request) => {
  const resourceSkillList = await resourceSkillRepo.getResourceSkillDataById(request.resource_emp_id);
  return resourceSkillList;
};

const employeeSkillDuplicateCheck = async (employeeData) => {
  const resourceEmpIds = [...new Set(employeeData.map(({ resource_emp_id: resourceEmpId }) => resourceEmpId))];
  const empDetailsFromDb = await resourceSkillRepo.getResourceSkillDataById(resourceEmpIds);
  const verifyEmpSkillArr = [];
  employeeData.map((currElement) => {
    const verifyEmpIdExistORNotInDB = empDetailsFromDb.find(
      (obj) => obj.resource_emp_id === currElement.resource_emp_id && obj.skill === currElement.skill,
    );
    const verifyEmpIdExistORNotInRequest = employeeData.find(
      (obj) => obj.resource_emp_id === currElement.resource_emp_id && obj.skill === currElement.skill,
    );
    if (verifyEmpIdExistORNotInDB !== 'undefined' || verifyEmpIdExistORNotInRequest) {
      const index = employeeData.indexOf(currElement);
      verifyEmpSkillArr.push(index);
    }
  });
  return verifyEmpSkillArr;
};
// const uploadResourceSkillsDetails = async (request) => {
//   const updateRecords = request.some((e) => e.hasOwnProperty('skill_id'));
//   let uploadResourceSkill;
//   let checkResourceSkill;
//   if (updateRecords === true) {
//     uploadResourceSkill = await resourceSkillRepo.updateResourceSkillData(request);
//   } else {
//     checkResourceSkill = await employeeSkillDuplicateCheck(request);
//     if (checkResourceSkill.length < 0) {
//       uploadResourceSkill = await resourceSkillRepo.uploadResourceSkillData(request);
//     }
//   }
//   return { uploadResourceSkill, checkResourceSkill };
// };

const uploadResourceSkillsDetails = async (request) => {
  const resourceEmpIds = [...new Set(request.map(({ resource_emp_id: resourceEmpId }) => resourceEmpId))];
  const empDetailsFromDb = await resourceSkillRepo.getResourceSkillDataById(resourceEmpIds);
  const verifyEmpSkillArr = [];
  const updateRecords = [];
  const insertRecords = [];
  request.map((currElement, idx) => {
    const verifyEmpIdExistORNotInRequest = request.find(
      (obj) => obj.resource_emp_id === currElement.resource_emp_id && obj.skill === currElement.skill,
    );
    const verifyEmpIdIndex = request.findIndex(
      (obj) => obj.resource_emp_id === currElement.resource_emp_id && obj.skill === currElement.skill,
    );
    if (
      (verifyEmpIdExistORNotInRequest !== 'undefined' || verifyEmpIdExistORNotInRequest !== undefined) &&
      verifyEmpIdIndex !== idx
    ) {
      const index = request.indexOf(currElement);
      verifyEmpSkillArr.push(index);
    }
  });

  if (!verifyEmpSkillArr.length) {
    request.map((currElement) => {
      const verifyEmpIdExistORNotInDB = empDetailsFromDb.find(
        (obj) => obj.resource_emp_id === currElement.resource_emp_id && obj.skill === currElement.skill,
      );
      if (typeof verifyEmpIdExistORNotInDB === 'undefined') {
        currElement.skill_id = currElement.resource_emp_id + '_' + currElement.skill;
        // if (verifyEmpIdExistORNotInDB !== 'undefined' || verifyEmpIdExistORNotInDB !== undefined) {
        insertRecords.push(currElement);
      } else {
        if (currElement.hasOwnProperty('skill_id') === true) {
          currElement.skill_id = currElement.skill_id;
        } else currElement.skill_id = currElement.resource_emp_id + '_' + currElement.skill;
        updateRecords.push(currElement);
      }
    });
  }
  let uploadResourceSkill;
  if (updateRecords.length > 0) {
    uploadResourceSkill = await resourceSkillRepo.updateResourceSkillData(updateRecords);
  }
  if (insertRecords.length > 0) {
    uploadResourceSkill = await resourceSkillRepo.uploadResourceSkillData(insertRecords);
  }

  return { uploadResourceSkill, verifyEmpSkillArr };
};
module.exports = {
  fetchAllResourceSkills,
  getResourceSkillsById,
  uploadResourceSkillsDetails,
};
