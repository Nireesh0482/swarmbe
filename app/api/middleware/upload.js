//const multer = require('multer');
const logger = require('../utils/logger');
const appResponse = require('../utils/AppResponse');
const constants = require('../utils/constants');

//const { saveImagesToDatabase, updateUserProfilePictureToDatabase } = require('../../repositories/promTool/promUserRepository');
const { updateUserProfilePictureToDatabase } = require('../repositories/promTool/promUserRepository');

const uploadProfilePictureToUserTable = async (req, res) => {
    // try {
    //   const storage = multer.memoryStorage();
    //   const uploadImages = multer({ storage }).single('profilePicture');

    /**
     * @function uploadImages => this wil be called to upload images to user directory(but here it
     * will store in memory) if any error in uploading images to user directory,
     * then return bad request else success
     */
    //   uploadImages(req, res, async (err) => {
    //     if (err) {
    //       logger.error(err);
    //       return appResponse.badRequest(res, constants.UPLOAD_FAIL);
    // }
    try {
        const savedToDatabase = await updateUserProfilePictureToDatabase({
            resourceEmpId: req.body.resourceEmpId,
            image: Buffer.from(req.body.image, 'base64')
        });
        //console.log(savedToDatabase, 'saved To Database');

        if (savedToDatabase) {
            return appResponse.success(res, constants.UPLOAD_SUCCESS);
        }
    } catch (error) {
        logger.error(error);
        return appResponse.internalServerError(res, constants.UPLOAD_FAIL);
        // }
        //   });
        // } catch (error) {
        //   logger.error(error);
        //   return appResponse.internalServerError(res, constants.UPLOAD_FAIL);
    }
};

module.exports = {
    uploadProfilePictureToUserTable,
};