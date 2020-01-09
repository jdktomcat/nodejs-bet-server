const redisUtil = require("./src/utils/redisUtil");

async function getAddition(info) {
  try {
    let multi = await redisUtil.hget("tronlive:sport:addition", "" + info.type);
    console.log("tronlive:sport:addition", multi);
    if (!multi) return 1;
    return Number(multi);
  } catch (error) {
    console.log(error);
    return 1;
  }
}

async function setAddition(info) {
  let redisRes = await redisUtil.hset(
    "tronlive:sport:addition",
    "" + info.type,
    info.num
  );
  console.log("redisRes", info.type, redisRes);
}

let info = {};
info.type = "all";
info.num = 1.5;
async function main() {
  await setAddition(info);
  await getAddition(info);
  process.exit(0);
}

main();
