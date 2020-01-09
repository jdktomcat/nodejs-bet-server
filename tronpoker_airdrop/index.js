const tokens = require('./src/service/index')

let delay = 10000
async function airdropAll() {
    setInterval(async () => {
        for (let token in tokens) {
            let obj = tokens[token]
            if (typeof obj.airdrop == 'function') {
                console.log('start to call ', token, '---------->')
                await obj.airdrop()
            } else {
                console.log('module ', token, ' has no airdrop function')
            }
        }
        console.log('---------------------------------airdrop end-------------------------------')
    }, 180000)
}

async function checkAll() {
    setInterval(async () => {
        for (let token in tokens) {
            let obj = tokens[token]
            if (typeof obj.check == 'function') {
                console.log('start to check ', token, '---------->')
                await obj.check()
            } else {
                console.log('module ', token, ' has no check function')
            }
        }
        console.log('---------------------------------check end-------------------------------')
    }, 120000)
}

async function main() {
    await airdropAll()
    console.log('===================================================================================')
    await checkAll()
}

main()