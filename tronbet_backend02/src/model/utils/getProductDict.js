const fs = require("fs")
const path = require("path")

const gethubProName = function(gameId){
    const p = path.resolve(__dirname,"./hub88.json")
    const rawPro = fs.readFileSync(p).toString("utf8")
    const proDict = JSON.parse(rawPro) || {}
    return proDict[gameId] || ""
}

const getSportDict = function(){
    const p = path.resolve(__dirname,"./sportId.json")
    const rawPro = fs.readFileSync(p).toString("utf8")
    const proDict = JSON.parse(rawPro) || {}
    return proDict
}



module.exports = {
    gethubProName,
    getSportDict
}

