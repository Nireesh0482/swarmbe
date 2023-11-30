const dbInstance = require('../../models');

const fetchAllResourceSkills = async () => {
  const resourceSkillData = await dbInstance.resourceSkillDetails.findAll({
    raw: true,
  });
  return resourceSkillData;
};

const getResourceSkillDataById = async (request) => {
  const resourceSkillData = await dbInstance.resourceSkillDetails.findAll({
    where: { resource_emp_id: request },
    raw: true,
  });
  return resourceSkillData;
};

const uploadResourceSkillData = async (resourceSkillData) => {
  const insertedResourceSkillData = await dbInstance.resourceSkillDetails.bulkCreate(resourceSkillData);
  return insertedResourceSkillData;
};

const updateResourceSkillData = async (request) => {
  const updatedData = await dbInstance.resourceSkillDetails.bulkCreate(request, {
    updateOnDuplicate: ['skill_id', 'resource_emp_id', 'skill', 'relevant_exp', 'competency_level'],
  });
  return updatedData;
};

module.exports = {
  fetchAllResourceSkills,
  getResourceSkillDataById,
  uploadResourceSkillData,
  updateResourceSkillData,
};
