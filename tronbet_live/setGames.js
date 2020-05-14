const db = require("./src/utils/dbUtil");
const getGameData = require("./src/static/main");

const queryBalance = async function (array) {
    const sql = `select a.uid,a.currency,a.addr,a.balance / 1000000000 as balance,b.email from tron_live.live_balance as a left join tron_live.live_account b on a.uid = b.uid where a.uid = b.uid and a.uid = ? and a.currency = ? and a.addr = ? and b.email = ?`
    const a1 = array.length
    let a2 = 0
    for (let e of array) {
        const p = [e.uid, e.currency, e.addr, e.email]
        const a = await db.exec(sql, p)
        if (a.length > 0) {
            a2 += 1
        }
        console.log(sql, JSON.stringify(p), ' and result is', a)
    }
    return a2 === a1
}


const updateAddBalance = async function (array) {
    for (let e of array) {
        const updateSql = "update tron_live.live_balance set balance = balance + ? where uid = ? and currency = ? "
        const params = [e.fix, e.uid, e.currency]
        console.log(updateSql, params)
        await db.exec(updateSql, params);
    }
}

const fixBalance = async function () {
    // const array = [
    //     {
    //         uid: '42869',
    //         addr: "bnb1vheud6fefdfhds3u5qwh6dvt8rdkw0ktxafrr2",
    //         email: 'gfbrown1411@gmail.com',
    //         fix: 16.02 * 1e9,
    //         currency: "BNB"
    //     },
    // ]
    // const ifUpdate = await queryBalance(array)
    // //
    // console.log("ifUpdate: ", ifUpdate)
    // if (ifUpdate) {
    //     console.log("begin ____> update")
    //     await updateAddBalance(array)
    //     //
    //     console.log("------>after is")
    //     await queryBalance(array)
    // } else {
    //     console.log("please check your params")
    // }
}


const raw = async function (updateSql, params) {
    console.log(updateSql, params)
    const t = await db.exec(updateSql, params);
    return t
}

const sendMail = async function (attachments) {
    // const to = mail.split(',').join(',')
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: "welcome@wink.org", // generated ethereal user
            pass: "!Changeme_123" // generated ethereal password
        }
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"welcome@wink.org', // sender address
        to: "andrew.li@tron.network", // list of receivers
        subject: "TronBet Financial Data", // Subject line
        html: "<h2>见附件</h2>", // html body
        attachments: attachments
    });
    return info
}

const main = async function () {
    const child_process = require("child_process");
    let cmd = `ls`
    const a = child_process.execSync(cmd).toString()
    // console.log(a)
    //
    await getGameData()
    //
    let attachments = []
    let attachmentObj = {}
    attachmentObj.filename = `aaaa.txt`
    attachmentObj.path = `h.txt`
    attachments.push(attachmentObj)
    console.log("last attachments is", attachments)
    await sendMail(attachments)
    //
    // const a2 = child_process.execSync("cat h.txt").toString()
    // console.log(a2)
    //delete files
    const fs = require("fs")
    fs.unlinkSync('h.txt')
    console.log("\n\n\n----->last")
    //
    const a1 = child_process.execSync(cmd).toString()
    console.log(a1)
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
