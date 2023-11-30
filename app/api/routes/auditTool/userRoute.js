const express = require('express');

const router = express.Router();
const middleware = require('../../middleware/validation');

const userController = require('../../controllers/auditTool/userController');

router.post('/signup', middleware.signUpValidation, userController.createUser); // signup route

router.post('/login', middleware.loginValidation, userController.loginUser); // login route

router.post('/forgotPassword', userController.forgotPassword); // forgot password route

router.post('/resetPassword', middleware.passwordValidation, userController.verifyLink);

module.exports = router;
