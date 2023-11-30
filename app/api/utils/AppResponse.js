const SUCCESS = 200;
const CREATED = 201;
const CONFLICT = 409;
const NOTFOUND = 404;
const INVALID_CREDENTIALS = 403;
const INTERNAL_SERVER_ERROR = 500;
const RESET_CONTENT = 205;
const BAD_REQUEST = 400;
const GONE = 410;
const METHOD_NOT_ALLOWED = 405;
const NOT_ACCEPTABLE = 406;
const EXPECTATION_FAILED = 417;
const NO_CONTENT_AVAILABLE = 204;
const NOT_MODIFIED = 304;
const NOT_AUTHORIZED = 401;
const SERVER_INTERNAL_CONFIG_ERROR = 506;
const PRECONDITION_FAILED = 412;
const PRECONDITION_REQUIRED = 428;
const UNPROCESSABLE_ENTITY = 422;

// const NOT_INSERTED=400;

const success = (res, message, data) => {
  res.status(SUCCESS).send({ status: 'SUCCESS', message, data });
};

const badRequest = (res, message, data) => {
  res.status(BAD_REQUEST).send({ status: 'FAILURE', message, data });
};

const emailDeliveryFail = (res, message, data) => {
  res.status(GONE).send({ status: 'FAILURE', message, data });
};

const created = (res, message, data) => {
  res.status(CREATED).send({ status: 'SUCCESS', message, data });
};

const conflict = (res, message, data) => {
  res.status(CONFLICT).send({ status: 'FAILURE', message, data });
};

const notFound = (res, message, data) => {
  res.status(NOTFOUND).send({ status: 'FAILURE', message, data });
};

const notInserted = (res, message, data) => {
  res.status(CONFLICT).send({ status: 'FAILURE', message, data });
};

const invalidCredentials = (res, message, data) => {
  res.status(INVALID_CREDENTIALS).send({ status: 'FAILURE', message, data });
};

const invalidInput = (res, message, data) => {
  res.status(RESET_CONTENT).send({ status: 'FAILURE', message, data });
};

const internalServerError = (res, message, data) => {
  res.status(INTERNAL_SERVER_ERROR).send({ status: 'FAILURE', message, data });
};

const methodNotAllowed = (res, message, data) => {
  res.status(METHOD_NOT_ALLOWED).send({ status: 'FAILURE', message, data });
};

const expectationFailed = (res, message, data) => {
  res.status(EXPECTATION_FAILED).send({ status: 'FAILURE', message, data });
};

const notContentForThisRequest = (res, message, data) => {
  res.status(NO_CONTENT_AVAILABLE).send({ status: 'NO CONTENT', message, data });
};

const notUpdated = (res, message, data) => {
  res.status(NOT_MODIFIED).send({ status: 'FAILURE', message, data });
};
const notAuthorized = (res, message, data) => {
  res.status(NOT_AUTHORIZED).send({ status: 'UNAUTHORIZED', message, data });
};

const serverConfigError = (res, message, data) => {
  res.status(SERVER_INTERNAL_CONFIG_ERROR).send({ status: 'FAILURE', message, data });
};

const userNotAuthorizedForThisResource = (res, message, data) => {
  res.status(PRECONDITION_FAILED).send({ status: 'UNAUTHORIZED', message, data });
};

const userRolesNotLoadedToApp = (res, message, data) => {
  res.status(PRECONDITION_REQUIRED).send({ status: 'UNAUTHORIZED', message, data });
};
const unProcessableEntity = (res, message, data) => {
  res.status(UNPROCESSABLE_ENTITY).send({ status: 'FAILURE', message, data });
};
const noDataInDatabase = (res, message, data) => {
  res.status(GONE).send({ status: 'FAILURE', message, data });
};

const multipleDataFoundError = (res, message, data) => {
  res.status(GONE).send({ status: 'FAILURE', message, data });
};
const duplicateElementFound = (res, message, data) => {
  res.status(NOT_ACCEPTABLE).send({ status: 'FAILURE', message, data });
};

module.exports = {
  duplicateElementFound,
  multipleDataFoundError,
  noDataInDatabase,
  success,
  created,
  conflict,
  notFound,
  invalidCredentials,
  notInserted,
  internalServerError,
  invalidInput,
  badRequest,
  methodNotAllowed,
  expectationFailed,
  notContentForThisRequest,
  notUpdated,
  notAuthorized,
  serverConfigError,
  userNotAuthorizedForThisResource,
  userRolesNotLoadedToApp,
  unProcessableEntity,
  emailDeliveryFail,
};
