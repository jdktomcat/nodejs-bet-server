const CryptoJS = require("crypto-js");
const key = CryptoJS.enc.Utf8.parse("function Common('eAxDWwTCWbwQYqbhWNEJkJLa9dm36w3O')");
const {redis} = require("./redisUtil")

function encrypt(message) {
    var encrypted = CryptoJS.DES.encrypt(message, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

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

async function checkToken(session) {
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
            // 更新redis
            console.log("refresh token")
            const emRedisKey = addr + "_em_key_" + currency
            const obj = Date.now() + "-" + addr + '-' + currency
            const s = encrypt(obj)
            const s2 = encodeURIComponent(s)
            /**
             *
             * @type {string | undefined}
             */
            await redis.set(emRedisKey, s2)
            await redis.expire(emRedisKey, 24 * 3600) // 设置过期时间为1天
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