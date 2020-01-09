const _ = require("lodash")._;

let c = -1;
let count = 0;
for(let i=0;i<1000;i++){
    let r = _.random(0,1);
    if(r === c){
        count = count + 1;
    }else{
        count = 0;
        c = r;
    }
    if(count >= 8){
        console.log("biu",i,c);
    }
}