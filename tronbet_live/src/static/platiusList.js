const NODE_ENV = process.env.NODE_ENV;
let config = require('../configs/config');
let platiusList = require("./platiusPrd")
if (NODE_ENV === 'test') {
    config = require('../configs/config_test');
    platiusList = require("./platiusTest")
}


const getPlatiusList = function(){
    platiusList.forEach(e=>{
        if(e.category === undefined){
            e.category = e.type
        }
        delete e.type
        e.id = e.gameID
        e.type = 'platius'
        e.thumbnail = e.png
    })
    const platiusSlot = platiusList.filter(e=>e.category === 'slots')
    const platiusTable = platiusList.filter(e=>e.category === 'table')
    return [platiusSlot,platiusTable]
}


module.exports = getPlatiusList