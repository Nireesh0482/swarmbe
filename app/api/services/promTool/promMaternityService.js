/* eslint-disable arrow-body-style */
/* eslint-disable camelcase */
const promMaternityRepository = require('../../repositories/promTool/promMaternityRepository');
const {
  addResourceToBufferProjectAndUpdateStatus,
} = require('../../repositories/promTool/promResourceAllocationRepository');
const { todayDate, add30DaysToDate } = require('../../utils/date');

const saveMaternityService = async (newMaternityDetails) => {
  const saveMaternityDetails = await promMaternityRepository.saveMaternityDetailsToDatabase(newMaternityDetails);
  return saveMaternityDetails;
};

const updateMaternityDetailsService = async (updateDetails) => {
  const updatedMaternityDetails = await promMaternityRepository.updateMaternityDetailsInDatabase(updateDetails);
  return updatedMaternityDetails;
};

const deleteMaternityDetailsInDatabase = async (rowIdsForDeleting) => {
  const deletedMaternityDetails = await promMaternityRepository.deleteMaternityDetailsFromDatabase(rowIdsForDeleting);
  return deletedMaternityDetails;
};

const fetchAllMaternityDetailsFromDatabase = async (groupName, methodOfRequest) => {
  const allMaternityDetails = await promMaternityRepository.fetchAllMaternityDetails(groupName, methodOfRequest);
  return allMaternityDetails ?? [];
};

const moveToGroupProjectBufferAfterMaternityEndDate = async (req, res) => {
  const fetchMaternityDetails = await promMaternityRepository.getMaternityDetailsLessOrEqualToToday();

  const groupCodeFromMaternityDetails = [...new Set(fetchMaternityDetails.map((ele) => ele.bu_name))];

  const bufferProjectForGroup = await promMaternityRepository.getBufferProjectForGroups(groupCodeFromMaternityDetails);

  const bufferProjectMap = new Map(bufferProjectForGroup.map((ele) => [ele.bu_name, ele.project_code]));

  const currentDate = todayDate();
  const resourceAllocationRowFormationForBuffer = fetchMaternityDetails.map(
    ({ resource_emp_id, bu_name: groupName, reporting_manager: reportingManager }) => {
      return {
        resource_emp_id,
        project_code: bufferProjectMap.get(groupName),
        supervisor: reportingManager,
        resource_status_in_project: 'Buffer',
        start_date: currentDate,
        end_date: add30DaysToDate(currentDate),
        allocation: 1,
        billable_resource: 0,
      };
    },
  );
  const saveToAllocationTableAndUpdate = await addResourceToBufferProjectAndUpdateStatus(
    resourceAllocationRowFormationForBuffer,
  );

  /* once maternity employee are moved to resource allocation under Buffer Project for their group
   * the internal_status column will be update to true which indicates that employee maternity end_date is
   * over and they are moved to Buffer project & that row is now only for reference purpose only
   */
  const updateMaternityDetailsForMovingToBufferProject = saveToAllocationTableAndUpdate.reduce(
    (updateInternalStatusRow, currEle, index) => {
      if (currEle[0] === 1) {
        updateInternalStatusRow.push(fetchMaternityDetails[index].id);
      }
      return updateInternalStatusRow;
    },
    [],
  );

  const updateInternalBusInMainMaternityTable =
    await promMaternityRepository.updateInternalStatusForRowInMaternityTable(
      updateMaternityDetailsForMovingToBufferProject,
    );

  // only for development
  if (req?.method || req?.method === 'POST') {
    return res.send(updateInternalBusInMainMaternityTable).status(200);
  }

  return saveToAllocationTableAndUpdate;
};

module.exports = {
  moveToGroupProjectBufferAfterMaternityEndDate,
  saveMaternityService,
  updateMaternityDetailsService,
  deleteMaternityDetailsInDatabase,
  fetchAllMaternityDetailsFromDatabase,
};
