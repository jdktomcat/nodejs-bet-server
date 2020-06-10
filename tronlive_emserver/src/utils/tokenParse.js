const CryptoJS = require("crypto-js");
const key = CryptoJS.enc.Utf8.parse("function Common('eAxDWwTCWbwQYqbhWNEJkJLa9dm36w3O')");


function decrypt(message) {
    try {
        var plaintext = CryptoJS.DES.decrypt(message, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        })
        return plaintext.toString(CryptoJS.enc.Utf8)
    } catch (e) {
        // console.log(e);
        return ""
    }
}

function checkToken(session) {
    let info = {
        error: true,
        info: {},
    }
    try {
        console.log(`${new Date()},session `, session)
        const tmp = decodeURIComponent(session)
        const msg = decrypt(tmp)
        console.log("msg is ", msg)
        const [time, addr, currency] = msg.split("-")
        //
        // 30 hours
        const timeStr = Date.now() - time - 30 * 60 * 60 * 1000
        if (timeStr > 0) {
            return info
        } else {
            const success = {
                error: true,
                info: {
                    addr: addr,
                    currency: currency,
                },
            }
            return success
        }
    } catch (e) {
        console.log("token parse error ---> ", e)
        return info
    }
}


module.exports = checkToken