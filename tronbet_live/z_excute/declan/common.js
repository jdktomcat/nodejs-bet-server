const Db = require("../../src/utils/dbUtil");

function Log(fmt, ...args) {
    console.log("%s " + fmt, new Date(), ...args);
}

async function DbDo(sql, params) {
    Log("DbDo begin: sql: %s, params: %s", sql, params);
    const res = await Db.query(sql, params);
    Log("DbDo end: %s\n", + JSON.stringify(res));
    return res;
}

module.exports = {
    Log,
    DbDo,
};
