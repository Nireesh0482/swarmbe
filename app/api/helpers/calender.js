/* eslint-disable implicit-arrow-linebreak */
const { writeFile } = require('fs');
const ics = require('ics');
const { dateToArray } = require('../utils/date');
const logger = require('../utils/logger');

const createCalender = async (inviteData, employeeData) => {
  const teamInfo = employeeData.map((ele) => ({
    name: ele.emp_name,
    email: ele.email_id,
    rsvp: true,
    partstat: 'NEED-ACTIONS',
    role: 'REQ-PARTICIPANT',
  }));

  const dateWithTime = (date, time) => `${date} ${time}`;

  const createdCal = ics.createEvent(
    {
      title: 'Meeting',
      description:
        'Meeting has been Scheduled and Please Respond with Accept/Reject to block your Calender for the Meeting',
      busyStatus: 'FREE',
      start: dateToArray(dateWithTime(inviteData.meetingDate, inviteData.meetingStartTime)),
      end: dateToArray(dateWithTime(inviteData.meetingDate, inviteData.meetingEndTime)),
      location: 'teams',
      status: 'CONFIRMED',
      method: 'PUBLISH',
      // organizer: {
      //   name: 'Audit Tool',
      //   email: 'audittoolsupport@avinsystems.com',
      // },
      attendees: teamInfo,
    },
    (error, value) => {
      if (error) {
        logger.info(error);
      }
      writeFile(`${__dirname}/event.ics`, value, (err) => {
        if (err) {
          logger.error(err);
        }
        return value;
      });
    },
  );
  return createdCal;
};

module.exports = {
  createCalender,
};
