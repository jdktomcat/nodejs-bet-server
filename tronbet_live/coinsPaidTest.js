const db = require("./src/utils/dbUtil");
const userinfo = require("./src/model/userinfo");

async function deposit(params) {
  let conn = null;
  try {
    conn = await db.getConnection();
    if (conn == null) {
      console.log("conn == null");
      process.exit(0);
    }
    conn.beginTransaction();
    for (let param of params) {
      await userinfo.depositSuccess(param, conn);
    }
    conn.commit();
  } catch (error) {
    console.error(error);
    if (conn) conn.release();
    if (error.code === "ER_DUP_ENTRY") {
      console.log("ER_DUP_ENTRY success");
    } else {
      console.log("error");
    }
  } finally {
    if (conn) conn.release();
  }
  console.log("success");
}

async function main() {
  console.log("coinsPaidTest Done");
  process.exit(0);
}

// main();
