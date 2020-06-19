const nodemailer = require("nodemailer");
const conf = require('../configs/config')

const sendMail = async function (params) {
    console.log(params)
    const {mail, attachments, title} = params
    const to = mail.join(',')
    let transporter = nodemailer.createTransport({
        host: conf.mail.host,
        port: conf.mail.port,
        secure: true,
        auth: {
            user: conf.mail.user,
            pass: conf.mail.pass
        }
    });
    let info = await transporter.sendMail({
        from: conf.mail.from, // sender address
        to: to, // list of receivers
        subject: title, // Subject line
        html: "<h2>见附件</h2>", // html body
        attachments: attachments
        // attachments: [
        //     {
        //         filename: 'testabc.txt',
        //         path: './1111.txt'
        //     }
        // ]
    });
    return info
}

module.exports = {
    sendMail
}