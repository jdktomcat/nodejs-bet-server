const { spawn } = require("child_process");

async function wintrc20Restart(ctx) {
  console.log("====");
  const ls = spawn("pm2", ["restart", "tronbet_dividends_win_trc20"]);
  ls.stdout.on("data", data => {
    console.log(`wintrc20Restart 输出：${data}`);
  });

  ls.stderr.on("data", data => {
    console.log(`wintrc20Restart 错误：${data}`);
  });

  ls.on("close", code => {
    console.log(`wintrc20Restart 子进程退出码：${code}`);
  });
  ctx.body = { code: 200, message: "重启成功" };
}

async function livetrc20Restart(ctx) {
  console.log("====");
  const ls = spawn("pm2", ["restart", "tronlive_dividends_trc20"]);
  ls.stdout.on("data", data => {
    console.log(`livetrc20Restart 输出：${data}`);
  });

  ls.stderr.on("data", data => {
    console.log(`livetrc20Restart 错误：${data}`);
  });

  ls.on("close", code => {
    console.log(`livetrc20Restart 子进程退出码：${code}`);
  });
  ctx.body = { code: 200, message: "重启成功" };
}

module.exports = {
  wintrc20Restart: wintrc20Restart,
  livetrc20Restart: livetrc20Restart
};
