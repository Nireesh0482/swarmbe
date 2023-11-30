const claimsRepo = require('../../repositories/promTool/claimsRepository');
const { sendMail } = require('../../utils/email');
const { sendIAprrovalRequestMail } = require('../../utils/EmailSchema');
const promAvinEmployeeDetailsRepository = require('../../repositories/promTool/resourceManagementRepository');
const projectRepo = require('../../repositories/promTool/projectDataRepository');
const { convertTZtoLocal } = require('../../utils/date');

const fetchAllClaims = async () => {
  const claimData = await claimsRepo.fetchAllClaims();
  return claimData;
};

const getClaimsById = async (request) => {
  const claimList = await claimsRepo.getClaimDataById(request);
  return claimList;
};

const insertClaimsDetails = async (ClaimData) => {
  const insertClaim = await claimsRepo.insertClaimData(ClaimData);
  return insertClaim;
};

const fetchAllExpenseTypeData = async () => {
  const expenseData = await claimsRepo.fetchAllExpenseTypeData();
  return expenseData;
};

const getResourceByProject = async () => {
  const getAllResourceIDs = await claimsRepo.getAllResourceByProject();
  // get only unique projects with assigned resource
  const getresourceData = getAllResourceIDs.reduce((unique, resource) => {
    if (
      !unique.some(
        (obj) => obj.project_code === resource.project_code && obj.resource_emp_id === resource.resource_emp_id,
      )
    ) {
      unique.push(resource);
    }
    return unique;
  }, []);
  return getresourceData;
};

const getResourceByEmpId = async () => {
  const getresourceData = [];
  const allProjCode = await projectRepo.getResourceandProjectInfo();
  allProjCode.flatMap((element) => {
    const resourceNamesArr = [];
    element.promAvinResourceAllocation.flatMap((ele1) => {
      resourceNamesArr.push({
        resource_emp_id: ele1.promAvinEmployeeDetails.resource_emp,
        resource_name: ele1.promAvinEmployeeDetails.resource_nam,
      });
    });
    const resourceList = resourceNamesArr.reduce((unique, o) => {
      if (!unique.some((obj) => obj.resource_emp_id === o.resource_emp_id && obj.resource_name === o.resource_name)) {
        unique.push(o);
      }
      return unique;
    }, []);
    getresourceData.push({
      project_name: element.project_name,
      project_code: element.project_code,
      resourceNames: resourceList,
    });
  });
  return getresourceData;
};

const getClaimsByApproverId = async (request) => {
  const claimList = await claimsRepo.getClaimsByApproverId(request);
  const claimsArr = await Promise.all(
    claimList.map(async (projectCodeArr) => {
      const getEmpName = await promAvinEmployeeDetailsRepository.verifyEmpEmail(projectCodeArr.resource_emp_id);
      const getAproverName = await promAvinEmployeeDetailsRepository.verifyEmpEmail(projectCodeArr.approver);
      const getProjName = await projectRepo.getProjectByID(projectCodeArr.project_code);
      projectCodeArr.resource_name = getEmpName.resource_name;
      projectCodeArr.approverName = getAproverName.resource_name;
      projectCodeArr.project_name = getProjName.project_name;
      const claimDate = await convertTZtoLocal(projectCodeArr.date);
      projectCodeArr.date = claimDate;
      return projectCodeArr;
    }),
  );
  return claimsArr;
};

// send claims approval reuquest  Mail to manager
const sendApprovalRequestMail = async (request) => {
  let approvalMail;
  await Promise.all(
    request.map(async (projectCodeArr) => {
      const getApprover = await promAvinEmployeeDetailsRepository.verifyEmpEmail(projectCodeArr.approver);
      const approverEmail = getApprover.email_id;
      const getEmpName = await promAvinEmployeeDetailsRepository.verifyEmpEmail(projectCodeArr.resource_emp_id);
      const getProjName = await projectRepo.getProjectByID(projectCodeArr.project_code);
      projectCodeArr.claimStatus = 'Raised';
      projectCodeArr.employeeName = getEmpName.resource_name;
      projectCodeArr.projName = getProjName.project_name;
      const mailingData = sendIAprrovalRequestMail(projectCodeArr);
      approvalMail = await sendMail(mailingData.subject, mailingData.text, mailingData.html, approverEmail);
    }),
  );

  return approvalMail;
};

// claims approved or rejected mail to employee
const updateApprovedStatus = async (request) => {
  let approvedInfo;
  const approvalReqIDList = request.pe_id;
  await Promise.all(
    approvalReqIDList.map(async (projectCodeArr) => {
      const getClaimData = await claimsRepo.getApprover(projectCodeArr);
      const getApprover = await promAvinEmployeeDetailsRepository.verifyEmpEmail(getClaimData.resource_emp_id);
      const approverEmail = getApprover.email_id;
      const getProjName = await projectRepo.getProjectByID(getClaimData.project_code);
      const mailObj = {
        project_code: getClaimData.project_code,
        projName: getProjName.project_name,
        resource_emp_id: getClaimData.resource_emp_id,
        employeeName: getApprover.resource_name,
        expense_type: getClaimData.expense_type,
        date: getClaimData.date,
        amount: getClaimData.amount,
      };
      if (request.claimStatusKey === 'Approved') {
        mailObj.claimStatus = 'Approved';
        const mailingData = sendIAprrovalRequestMail(mailObj);
        await sendMail(mailingData.subject, mailingData.text, mailingData.html, approverEmail);
        approvedInfo = await claimsRepo.updateApprovedStatusDate(projectCodeArr);
      } else {
        mailObj.claimStatus = 'Rejected';
        const mailingData = sendIAprrovalRequestMail(mailObj);
        await sendMail(mailingData.subject, mailingData.text, mailingData.html, approverEmail);
        approvedInfo = await claimsRepo.updateApprovedStatus(projectCodeArr);
      }
    }),
  );

  return approvedInfo;
};

const uploadClaimsDetails = async (claimData) => {
  const claimDataArray = claimData.map(
    ({ project_code: projectCode, resource_emp_id: resEmpId, approver, ...allClaimData }) => ({
      ...allClaimData,
      project_code: projectCode?.toString().trim(),
      resource_emp_id: resEmpId?.toString().trim(),
      approver: approver?.toString().trim(),
      claim_status: 'Approved',
      approved_date: new Date(),
    }),
  );
  const uploadClaim = await claimsRepo.uploadClaimData(claimDataArray);
  return uploadClaim;
};

module.exports = {
  fetchAllClaims,
  getClaimsById,
  insertClaimsDetails,
  fetchAllExpenseTypeData,
  getResourceByProject,
  getResourceByEmpId,
  getClaimsByApproverId,
  sendApprovalRequestMail,
  updateApprovedStatus,
  uploadClaimsDetails,
};
