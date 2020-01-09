const scanDice = require('./scanDice')
// const scanDiceNew = require('./scanDiceNew')
const scanMoon = require('./scanMoon')
const scanRing = require('./scanRing')
const scanTrc10Dice = require('./scanTrc10Dice')
const scanTrc20Dice = require('./scanTrc20Dice')

function main() {
    scanDice.main()
    // scanDiceNew.main()
    scanMoon.main()
    scanRing.main()
    scanTrc10Dice.main()
    scanTrc20Dice.main()
}

main()