const tronConf = require('../configs/config').tronConfig
const tronUtil = require('../utils/tronUtil')
const redisUtil = require('../utils/redisUtil')
const _ = require('lodash')._
const common = require('../utils/common')

const redisStakersKey = 'aridrop:stakers'

async function syncStakers() {
    let maxHolderIndex = await tronUtil.tronQuery(tronConf.anteStkerAddr,'getMaxHolderIndex()', 5e6, 0, []).catch((err) => {
        console.log(err)
        return
    })

    maxHolderIndex = tronUtil.hexStringToBigNumber(maxHolderIndex).toNumber()

    console.log('=========maxHolderIndex=======>', maxHolderIndex)

    if (maxHolderIndex > 0) {
        for (let index = 0; index <= maxHolderIndex; index ++ ) {
            let data = await tronUtil.tronQuery(tronConf.anteStkerAddr,'getWinAmountByIndex(uint256)', 5e6, 0, [{type: 'uint256', value : index}]).catch((err) => {
                console.log(err)
                return
            })
            if (!_.isEmpty(data)) {
                let addr = tronUtil.hexStringToTronAddress(data.substr(24,40))
                let anteAmount  = tronUtil.hexStringToBigNumber(data.substr(64,64)).toNumber() / 1e6
                console.log('------addr,anteAmount ===>', addr,anteAmount)
                await redisUtil.hset(redisStakersKey, addr, anteAmount)
            }
            // console.log(data)
            await common.sleep(5)
        }
    }
}

setInterval( async () => {
    await syncStakers()
}, 36000000);