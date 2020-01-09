
function hextoString(hex) {
    const arr = hex.split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        let tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(tmp);
    }
    return out;
}
let x  = "6f74686572206572726f72203a2063616e6e6f742063616c6c20636f6e7374616e74206d6574686f6420"

console.log(hextoString(x));
