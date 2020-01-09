const freespins = require('./src/service/freepins')


async function main() {
    await freespins.sendFreepins('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3', 3, 10)
} 


main()