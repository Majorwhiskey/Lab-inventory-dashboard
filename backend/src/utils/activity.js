const { ActivityLog } = require("../models");

const logActivity = async ({ userName, action, details }) => {
  await ActivityLog.create({ userName, action, details });
};

module.exports = { logActivity };
