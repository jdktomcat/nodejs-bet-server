const config = require('./src/configs/config');
const deleteUtil = require('./src/utils/deleteUtil');

if (config.app.clearLog && config.app.clearLog === true) {
    deleteUtil.deleteFolder(config.app.logPath);
    console.log(">>> clear logs! done!");
}