const express = require('express');
const router = express.Router();
const middleware = require('../../middleware/validation');
const {uploadProfilePictureToUserTable} = require('../../middleware/upload');

const promUserController = require('../../controllers/promTool/promUserController');
//const promUserService = require('../../services/promTool/promUserService');

router.post('/signup', middleware.signUpValidation, promUserController.createUser); // signup route

router.post('/login', middleware.loginValidation, promUserController.loginUser); // login route

router.post('/forgotPassword', promUserController.forgotPassword); // forgot password route

router.post('/resetPassword', middleware.passwordValidation, promUserController.verifyLink);

router.put(
    '/uploadUserProfilePicture',
    promUserController.verifyUserDetails,
    uploadProfilePictureToUserTable
);   //save profile photo

router.post(
    '/fetchUserProfilePicture',
    promUserController.verifyUserDetails,
    promUserController.getUserProfilePictureFromDatabase
);

module.exports = router;
