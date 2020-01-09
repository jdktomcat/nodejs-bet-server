const statistics = require('./statistics');
const scan = require('./scan');

async function app() {
    await statistics.init();
    await scan.init();
}

app();