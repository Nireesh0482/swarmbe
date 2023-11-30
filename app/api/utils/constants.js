module.exports = Object.freeze({
  // successful messages
  INSERTED_SUCCESSFULLY: 'Data inserted successfully',
  SUCCESSFULLY_FETCHED: 'fetched data Successfully',
  DELETE_SUCCESSFUL: 'Deleted successfully',
  DATA_UPDATED: 'Data updated successfully',
  FOUND: 'Found data successFully',
  USER_CREATED: 'User created successfully',
  EMAIL_SENT: 'Email sent successfully',
  TOKEN_GENERATED: 'Token generated successfully',
  LOGGED_IN: 'Logged in successfully',

  // partial Success or failure messages
  PARTIAL_DATA: 'only Partial Data Added',
  CANNOT_BE_EMPTY: 'fields cant be Empty',
  MANAGER_NOT_IN_DB: 'Manager details not present in database.',
  EMPLOYEE_NOT_IN_DB: 'Employee details not present in database',
  PROJECT_DETAILS_NOT_IN_DB: 'Project details not present in database',
  EMPLOYEE_DETAILS_DOES_NOT_MATCH: "employee details doesn't match with database details.",
  MULTIPLE_BUFFER: 'Multiple buffer project found,please contact admin',
  ALLOCATION_CROSSED: "employee's Allocation exceeded more than 1",

  // failure messages
  NO_AVERAGE_COST: 'No average engineering cost present.please add it in average engineering cost page',
  SERVER_ROLE_NOT_LOADED: 'Server role not initialized',
  USER_ROLES_NOT_LOADED:
    'No roles are assigned to users,please contact admin .if roles are assigned then please try login again',
  NO_TOKEN: 'No Token provided',
  ROLES_ASSIGN_FAIL: 'Roles not assigned',
  ROLES_NOT_ASSIGNED: 'Roles cannot be assigned,internal Server Error, Please contact admin',
  TOKEN_FAIL: 'Token authentication failed.',
  NO_REQUEST_BODY: 'No request body',
  DUPLICATE_ENTRIES: 'Duplicate entries has been found',
  DUPLICATE_RECORD: 'Duplicate record has been found',
  NO_RECORD_FOUND: 'No record found',
  INVALID_CREDENTIALS: 'Please check the credentials',
  INVALID_INPUT: 'Invalid,please provide a Valid input',
  CANNOT_FETCH: 'Cannot fetch Data',
  NOT_INSERTED: 'Data not inserted properly',
  UPDATE_FAIL: 'failed to update data',
  USER_NOT_CREATED: 'User creation unsuccessful',
  EMAIL_FAIL: 'Email not sent',
  PASS_INCORRECT: 'password is incorrect,please provide a valid password',
  NO_COOKIE: 'Cookies not found',
  TOKEN_GEN_FAIL: 'Token generation failed',
  DATA_NOT_SAVED: 'Data not saved',
  EMP_NOT_EXIST: 'User not the member of selected audit',
  EMAIL_NOT_EXIST: 'Email does not exist',
  PASSWORD_UPDATE: 'Password Updated successfully',
  PASSWORD_NOT_UPDATE: 'Failed to update password',
  INVALID_TOKEN: 'Invalid token',
  CHECKS_OPEN: 'Please close all opened checks before closing Audit',
  INVALID_DATE: 'Please provide a Valid Date',
  NOT_AUTHORIZED_TO_RESOURCE: 'User is Not Authorized to Access the Current Resource',
  NO_MANAGER_NOT_SAVED: 'Data not saved,No Manager for given employees from list',
  NO_DUPLICATE_RECORD_FOUND: 'No duplicate records',
  USER_NOT_AUTHORIZED: 'User is Not Authorized ,Please contact admin',
  DUPLICATE_BUFFER_PROJECT: 'Buffer project already existed',
});