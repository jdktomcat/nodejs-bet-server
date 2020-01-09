#!/bin/sh

printNums(){
  num=$(cat $1)
  var="echo $num > $1"
  echo $var
}

# back01
printNums "./tronbet_blockscan/scanDice.blocknum"
printNums "./tronbet_blockscan/scanMoon.blocknum"
printNums "./tronbet_blockscan/scanRing.blocknum"
printNums "./tronbet_blockscan/scanTrc10Dice.blocknum"
printNums "./tronbet_blockscan/scanTrc20Dice.blocknum"
printNums "./tronbet_ring/solo.blocknum"

# back02
printNums "./tronbet_blockscan/scanLive.blocknum"
printNums "./tronbet_blockscan/scanLive20.blocknum"
printNums "./tronbet_blockscan/scan_live_divs.blocknum"
printNums "./tronbet_blockscan/scan_live_divs20.blocknum"
printNums "./tronbet_blockscan/scan_win_divs20.blocknum"
printNums "./tronbet_blockscan/scanRake.blocknum"
printNums "./tronlive_airdrop/scanBlock.blocknum"
printNums "./tronpoker_jackpot/scanSolidity.blocknum"
printNums "./tronpoker_jackpot/scanFull.blocknum"

# in file
# tronbet_blockscan    startBlockNum
# tronbet_ring         startBlockNum
# tronlive_airdrop     startBlockNum
# tronpoker_jackpot    startBlockNum

# in db
# tronbet_scan_dice    beginBlockNumber
# tronbet_poker        beginBlockNumber
