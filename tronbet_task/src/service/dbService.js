const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

async function getPreRoundInfo(_ver, conn) {
    let sql = "select * from ante_ver_v1 where ver = ? limit 1;"
    let params = [_ver];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

module.exports.getPreRoundInfo = getPreRoundInfo;