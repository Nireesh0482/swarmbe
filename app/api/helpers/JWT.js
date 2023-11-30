// const { nanoid } = require('nanoid');
const jwt = require('jsonwebtoken');
const { accessTokenKey, refreshTokenKey, resetSecret } = require('../../config/config');
const appResponse = require('../utils/AppResponse');
const constants = require('../utils/constants');
const logger = require('../utils/logger');

const verifyAccessToken = (req, res, next) => {
  if (
    !req.headers?.authorization ||
    (req.headers.authorization === 'Bearer' && req.headers.authorization.length === 6)
  ) {
    // remove logging in production
    logger.warn(`no Token present, url access = ${req.originalUrl}, auth-value = ${req.headers?.authorization}`);
    // if No Token present Return 500
    return appResponse.internalServerError(res, { message: constants.NO_TOKEN }, { tokenPresent: false });
  }
  // destructure the Second value (Token) From array
  const [, token] = req.headers.authorization.split(' ');

  jwt.verify(token, accessTokenKey, (err, decodedResult) => {
    if (err) {
      // remove the if case in production if not needed
      if (err?.name === 'TokenExpiredError') {
        const decodedValue = jwt.decode(token);
        logger.warn(
          `Route-accessing at ${req.originalUrl}, Email=${decodedValue.email},
           expired Time= ${err.expiredAt} for access token`,
        );
      }

      // if token expired then return 403
      return appResponse.invalidCredentials(res, { message: constants.TOKEN_FAIL });
    }

    // set the response (res.locals) with email and employeeId ,this values are modified and
    //  it is only available during that request / response cycle.
    res.locals.email = decodedResult.email;
    res.locals.employeeId = decodedResult.employeeId;

    // go to Next Middleware in the stack
    next();
  });
};

const generateAccessToken = (email, employeeId) => {
  // embed email and employeeId into token ,use it check user authentication in middleware for resource access
  const user = { email, employeeId };
  const accessToken = jwt.sign(user, accessTokenKey, { expiresIn: '180m' }); // access token valid for 180minutes
  return accessToken;
};

const generateRefreshToken = (email, employeeId) => {
  // embed email and employeeId into token ,use it check User authentication in middleware for resource access
  const user = { email, employeeId };
  const refreshToken = jwt.sign(user, refreshTokenKey, {
    expiresIn: '1d', // refresh token valid for 1 day
  });
  return refreshToken;
};

const generateTokens = (req, res) => {
  // using refresh token to generate new access token
  if (!req.cookies?.refreshToken) {
    // if refresh token not present return internal server error
    return appResponse.internalServerError(res, { message: constants.NO_COOKIE }, { tokenPresent: false });
  }
  const refreshToken = jwt.verify(req.cookies.refreshToken, refreshTokenKey, (err) => {
    if (err) return false;
    return true;
  });

  if (!refreshToken) {
    return appResponse.internalServerError(res, { message: constants.TOKEN_GEN_FAIL }, { tokenVerify: false });
  }
  const accessToken = generateAccessToken(req.body.email, req.body.employeeId);
  return appResponse.success(res, { message: constants.TOKEN_GENERATED }, { accessToken });
};

const logoutUser = (req, res) => {
  const setCookieData = req.cookies?.refreshToken;
  if (!setCookieData) {
    return appResponse.internalServerError(res, { message: constants.NO_COOKIE }, { tokenPresent: false });
  }

  // remove in production if Not Needed, checking who logged out
  const requestFromTool = req.baseUrl.toString().split('/')[1];
  const decodedValue = jwt.decode(setCookieData);
  logger.info(`${decodedValue.email}, EmpId =${decodedValue.employeeId} logged out of ${requestFromTool}`);

  // immediately Remove Cookies from Browser
  res.cookie('refreshToken', '', { maxAge: -1, overwrite: true });
  return appResponse.success(res, { message: constants.DELETE_SUCCESSFUL });
};

const verifyToken = async (token, res) => {
  const tokenVerify = jwt.verify(token, resetSecret, (err, decoded) => {
    if (err) {
      throw new Error('Invalid Token', { cause: err });
    }
    const { email_id: email, secret } = decoded;
    return { email, secret };
  });

  return tokenVerify;
};

module.exports = {
  verifyAccessToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  logoutUser,
  verifyToken,
};
