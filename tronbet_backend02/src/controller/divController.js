const { spawn } = require("child_process");

class DivController {
  static async wintrxRestart(ctx) {
    console.log("====");
    const ls = spawn("pm2", ["restart", "tronbet_auto_dividends_win"]);
    ls.stdout.on("data", data => {
      console.log(`wintrxRestart输出：${data}`);
    });

    ls.stderr.on("data", data => {
      console.log(`wintrxRestart错误：${data}`);
    });

    ls.on("close", code => {
      console.log(`wintrxRestart子进程退出码：${code}`);
    });
    ctx.body = { code: 200, message: "重启成功" };
  }
}

module.exports = DivController;
