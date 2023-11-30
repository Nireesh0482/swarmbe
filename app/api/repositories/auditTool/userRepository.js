const dbInstance = require('../../models');

const createUserInDB = async (user) => {
  const userCreate = await dbInstance.users.create(user);
  return userCreate;
};

const verifyUserEmailAndGetUserRoles = async (email) => {
  const emailExist = await dbInstance.users.findOne({
    where: { email_id: email },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: ['emp_id'],
        include: [
          {
            model: dbInstance.userRoles,
            as: 'userRoles',
            attributes: { exclude: ['id', 'emp_id'] },
            include: [
              {
                model: dbInstance.roleAndResponsibility,
                as: 'roleAndResponsibility',
                attributes: [['features_permission', 'features']],
              },
            ],
          },
        ],
      },
    ],
  });

  return JSON.parse(JSON.stringify(emailExist));
};

const resetPassword = async (email, hashedPassword) => {
  const updatePassword = await dbInstance.users.update({ password: hashedPassword }, { where: { email_id: email } });
  return updatePassword;
};

module.exports = {
  createUserInDB,
  verifyUserEmailAndGetUserRoles,
  resetPassword,
};
