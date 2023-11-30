/* eslint-disable camelcase */
/* eslint-disable arrow-body-style */
const AOPRepo = require('../../repositories/promTool/organizationGroupMgmtRepository');
const { currentYearEndDay, currentYearFirstDay } = require('../../utils/date');
const { validateDuplicateDetailsForSingleField } = require('../../helpers/helperFunctions');

const checkDuplicateAOPDetails = (aopDataFromDb, currentValue) => {
  return aopDataFromDb.find(({ org_bu_name: orgGroupName, aop_month: aopMonth }) => {
    /**
     * check whether same, @var org_bu_name, @var aop_month combination already
     * exist in database, if exist send true else send false
     */
    const duplicateAOPDetails = orgGroupName === currentValue.org_bu_name && JSON.stringify(aopMonth) === JSON.stringify(currentValue.aop_month);
    return duplicateAOPDetails !== false;
  });
};

const compareNewAndExistingGroupAOPDetails = (newAOPData, aopDataFromDb) => {
  return newAOPData.reduce(
    // duplicateAOPData is data already present in org_bu_aop Table,
    // duplicateGroupAOPDataIndexValue is the index of row in Table present in frontend, it used to point
    // which rows is duplicate entry in frontend
    ([duplicateAOPData, duplicateAOPDataIndexValue], currentValue, arrayIndex) => {
      const isDataDuplicate = checkDuplicateAOPDetails(aopDataFromDb, currentValue);
      if (isDataDuplicate) {
        duplicateAOPData.push(currentValue);
        duplicateAOPDataIndexValue.push(arrayIndex);
        return [duplicateAOPData, duplicateAOPDataIndexValue];
      }
      return [duplicateAOPData, duplicateAOPDataIndexValue];
    },
    [[], []],
  );
};

const verifyDuplicateAOPDataWithDatabase = async (aopData) => {
  // get already existing AOP data information from org_bu_aop Table
  const allAOPDataFromDb = await AOPRepo.getAllGroupAOPDataWithoutTimeStamp();

  // compare new Data with existing data in database
  const [duplicateAOPData, duplicateAOPDataIndexValue] = compareNewAndExistingGroupAOPDetails(
    aopData,
    allAOPDataFromDb,
  );
  // if any duplicate Record coming(i.e present already in db) from frontend ,throw 405(method not allow)
  if (duplicateAOPData.length > 0) {
    return {
      duplicateAOPDataPresent: true,
      dataInfo: { duplicateAOPData, duplicateAOPDataIndexValue },
    };
  }
  return {
    duplicateAOPDataPresent: false,
    dataInfo: { newAOPData: aopData },
  };
};

const checkHeadDetailsWithGroupHead = (dataFromFrontend, GroupDataFromDb) => {
  const groupNameAndHead = new Map(GroupDataFromDb.map((ele) => [ele.bu_name, ele.bu_head]));
  const errorDetails = dataFromFrontend
    .map((frontEnd, index) => {
      const orgHeadIsMatching = frontEnd.bu_head === groupNameAndHead.get(frontEnd.bu_name);
      if (!orgHeadIsMatching) {
        return {
          index,
          field: 'org_bu_head',
          errorMessage: "Org BU Head doesn't match with BU Head for the group",
        };
      }
      return false; // false means project Group and head are matching
    })
    .filter((ele) => ele !== false); // filter out element which are needed to be shown as error in frontend
  return errorDetails;
};

const getGRPInfoByName = async (request) => {
  const AOPData = await AOPRepo.getAOPDataByName(request);
  return AOPData;
};

const insertMgmtAOPData = async (AOPData) => {
  const saveAOPMonthWiseDetails = await AOPRepo.insertAOPData(AOPData);
  return saveAOPMonthWiseDetails;
};

const updateMgmtAOPData = async (request) => {
  const aopInfo = await AOPRepo.updateAOPData(request);
  const updatedDataInfo = aopInfo.map((element) => element[0] > 0);
  return { updatedDataInfo, aopInfo };
};

const fetchAllProjGroupNameData = async (request) => {
  const orgmgmtData = await AOPRepo.getGRPInfoByName(request);
  return orgmgmtData;
};

const getAllPromGroupNameInArray = async () => {
  const groupNameArray = await AOPRepo.getAllGroupNameInArray();
  return groupNameArray[0].groupNames;
};
const getAllPromGroupCodesInArray = async () => {
  const groupCodeInArray = await AOPRepo.getAllGroupCodesInArray();
  return groupCodeInArray[0].groupCodes;
};

const createBufferProjectForEachProjectGroup = (requestBody) => {
  return requestBody.map(({ bu_code, bu_name, bu_head }) => {
    return {
      project_code: `${bu_code}_Buffer`,
      project_name: `${bu_name}_Buffer`,
      project_bu_name: bu_name,
      project_bu_head: bu_head,
      project_manager: bu_head,
      project_type: 'Buffer',
      project_start_date: currentYearFirstDay(),
      project_end_date: currentYearEndDay(),
      po_ro_sow_number: 'NA',
      po_ro_sow_value: 0,
      project_status: 'Running',
    };
  });
};
const saveGroupDetailsService = async (requestBody) => {
  const validateGroupCodeDuplicateData = validateDuplicateDetailsForSingleField(requestBody, 'bu_code');
  const validateGroupNameDuplicateData = validateDuplicateDetailsForSingleField(requestBody, 'bu_name');
  if (validateGroupCodeDuplicateData.length > 0 || validateGroupNameDuplicateData.length > 0) {
    return {
      saveSuccess: false,
      validationError: { validateGroupCodeDuplicateData, validateGroupNameDuplicateData },
    };
  }

  const requestBodyTrimmed = requestBody.map((ele) => {
    return {
      bu_code: ele.bu_code.toString().trim() ?? ele.bu_code,
      bu_name: ele.bu_name.toString().trim() ?? ele.bu_name,
      bu_head: ele.bu_head.toString().trim() ?? ele.bu_head,
      remarks: ele.remarks.toString().trim() ?? ele.remarks,
    };
  });
  const bufferProjectForEachGroup = createBufferProjectForEachProjectGroup(requestBodyTrimmed);
  const saveOrgDetails = await AOPRepo.saveGroupDetails(requestBodyTrimmed, bufferProjectForEachGroup);

  return { saveSuccess: true, saveOrgDetails };
};

const updateGroupDetailsService = async (requestBody) => {
  const validateGroupCodeDuplicateData = validateDuplicateDetailsForSingleField(requestBody, 'bu_code');
  const validateGroupNameDuplicateData = validateDuplicateDetailsForSingleField(requestBody, 'bu_name');
  if (validateGroupCodeDuplicateData.length > 0 || validateGroupNameDuplicateData.length > 0) {
    return { saveSuccess: false, validateGroupCodeDuplicateData, validateGroupNameDuplicateData };
  }
  const updateOrgDetails = await AOPRepo.updateGroupDetails(requestBody);
  const updatedDataInfo = updateOrgDetails.map(
    (element) => element.updateProjectHeadInProjectDetails[0] > 0 || element.updatedGroupData[0] > 0,
  );

  return { saveSuccess: true, updatedDataInfo, updateOrgDetails };
};

const getAllGroupDetailsFromDB = async () => {
  const allGroupDetails = await AOPRepo.getAllGroupDetails();
  return allGroupDetails;
};

const getAllOrgAOPDetailsFromDb = async () => {
  const allOrgAOPDetails = await AOPRepo.fetchAllOrgAOPDetails();
  return allOrgAOPDetails;
};

module.exports = {
  getAllOrgAOPDetailsFromDb,
  checkHeadDetailsWithGroupHead,
  getAllGroupDetailsFromDB,
  updateGroupDetailsService,
  saveGroupDetailsService,
  fetchAllProjGroupNameData,
  getGRPInfoByName,
  insertMgmtAOPData,
  updateMgmtAOPData,
  getAllPromGroupNameInArray,
  verifyDuplicateAOPDataWithDatabase,
  getAllPromGroupCodesInArray,
};
