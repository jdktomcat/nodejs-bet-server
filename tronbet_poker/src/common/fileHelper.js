'use strict';
const fs = require('graceful-fs');
const config = require('../configs/config');
const pageSize = 500;
const path = config.app.logPath;
function checkDir(dir, cb) {
    if (fs.existsSync(dir)) {
        // 文件夹存在
    } else {
        // 文件夹不存在
        fs.mkdirSync(dir);
    }
    cb(null);
}
function toMyLog(id, idx, content) {
    let start_idx = parseInt(idx / pageSize) * pageSize;
    let end_idx = start_idx + pageSize;
    let dir = path + "/" + id;
    checkDir(dir, (err) => {
        if (err == null) {
            let fileName = dir + "/" + start_idx + "-" + end_idx + ".log";
            fs.appendFile(fileName, content + "\r\n", function (err) {
                if (err) {
                    console.error(err);
                } else {
                    // console.log('ok.');
                }
            });
        } else {
            console.error(err)
        }
    })
}

module.exports.toMyLog = toMyLog;

// for (let no = 0; no < 1; no++) {
//     toMyLog(901001, no, "\r\nhi" + no);
// }