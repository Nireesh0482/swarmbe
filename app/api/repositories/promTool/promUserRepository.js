const dbInstance = require('../../models');

const createUserInDB = async (user) => {
  const userCreate = await dbInstance.promUsers.create(user);
  return userCreate;
};

const verifyPromUserEmailAndGetUserRoles = async (email) => {
  const emailExist = await dbInstance.promUsers.findOne({
    where: { email_id: email },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promAvinEmployeeDetails',
        attributes: ['resource_emp_id', 'resource_status', 'bu_name'],
        include: [{ model: dbInstance.promUserRoles, as: 'promUserRoles', attributes: ['role_group'] }],
      },
    ],
  });

  return JSON.parse(JSON.stringify(emailExist));
};

const resetPassword = async (email, hashedPassword) => {
  const updatePassword = await dbInstance.promUsers.update(
    { password: hashedPassword },
    { where: { email_id: email } },
  );
  return updatePassword;
};

const findUserDetailsByUniqueId = async (resourceEmpId) => {
  const userDetailsById = await dbInstance.promUsers.findAll({ where: { resource_emp_id: resourceEmpId }, raw: true });
  return userDetailsById;
};

const updateUserProfilePictureToDatabase = async ({ resourceEmpId, image }) => {
  const savedProfilePicture = await dbInstance.promUsers.update(
    { profile_picture: image },
    { where: { resource_emp_id: resourceEmpId }, returning: true },
  );
  return savedProfilePicture;
};

const getUserProfilePictureFromDatabase = async (resourceEmpId) => {
  const userProfilePicture = await dbInstance.promUsers.findOne({
    where: { resource_emp_id: resourceEmpId },
    raw: true,
    attributes: [
      [dbInstance.sequelize.fn('encode', dbInstance.sequelize.col('profile_picture'), 'base64'), 'profile_picture'],
      ],
  });
  return userProfilePicture;
};

module.exports = {
  createUserInDB,
  verifyPromUserEmailAndGetUserRoles,
  resetPassword,
  findUserDetailsByUniqueId,
  updateUserProfilePictureToDatabase,
  getUserProfilePictureFromDatabase,
};
