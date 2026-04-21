const sequelize = require("../config/database");
const Item = require("./Item");
const ActivityLog = require("./ActivityLog");

const initDb = async () => {
  await sequelize.sync();
};

module.exports = {
  sequelize,
  Item,
  ActivityLog,
  initDb,
};
