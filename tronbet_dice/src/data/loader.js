const fs = require("fs");
const path = require('path');

function readDirSync(_path, arr) {
    let pa = fs.readdirSync(_path);
    pa.forEach(function (ele) {
        let info = fs.statSync(_path + "/" + ele);
        if (info.isDirectory()) {
            //print("dir: " + ele);
            readDirSync(_path + "/" + ele, arr);
        } else if (info.isFile() && ele.endsWith('.json')) {
            //print("file: " + _path + "/" + ele);
            arr.push(_path + "/" + ele);
        }
    });
}

function scan(contractPath) {
    let arr = [];
    //print("contractPath:", contractPath);
    readDirSync(contractPath, arr);
    return arr;
}

module.exports.scan = scan;
