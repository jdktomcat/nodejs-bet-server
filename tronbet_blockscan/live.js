const scanLive = require('./scanLive');
const scanLive20 = require('./scanLive20');
const scan_live_divs = require('./scan_live_divs');
const scan_live_divs20 = require('./scan_live_divs20');
const scan_win_divs20 = require('./scan_win_divs20');

function main() {
  scanLive.main();
  scanLive20.main();
  scan_live_divs.main();
  scan_live_divs20.main();
  scan_win_divs20.main();
}

main();
