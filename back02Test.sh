#!/bin/sh

# same server
# cd tronbet_dice && pm2 start npm --name tronbet_dice -- run test && cd ..
# cd tronbet_moon && pm2 start npm --name tronbet_moon -- run test && cd ..
# cd tronbet_ring && pm2 start npm --name tronbet_ring -- run test && cd ..
# cd tronbet_backend && pm2 start npm --name tronbet_backend -- run test && cd ..
# cd tronbet_profile && pm2 start npm --name tronbet_profile -- run test && cd ..
# cd tronbet_rank && pm2 start npm --name tronbet_rank -- run test && cd ..
# cd tronbet_task && pm2 start npm --name tronbet_task -- run test && cd ..
# end

cd tronbet_live && pm2 start npm --name tronbet_live -- run test && cd ..
cd tronlive_airdrop && pm2 start npm --name tronlive_airdrop -- run test && cd ..
cd tronlive_data && pm2 start npm --name tronlive_data -- run test && cd ..
cd tronlive_emserver && pm2 start npm --name tronlive_emserver -- run test && cd ..

# need mongo
cd tronbet_poker && pm2 start npm --name tronbet_poker -- run test && cd ..
cd tronpoker_jackpot && pm2 start npm --name tronpoker_jackpot -- run test && cd ..

cd tronpoker_airdrop && pm2 start npm --name tronpoker_airdrop -- run test && cd ..

# same server
# cd tronbet_auto_dividends && pm2 start npm --name tronbet_auto_dividends -- run test && cd ..
# cd tronbet_auto_dividends_win && pm2 start npm --name tronbet_auto_dividends_win -- run test && cd ..
# cd tronbet_blockscan && pm2 start npm --name scan_dice -- run test && cd ..
# cd tronbet_scan_dice && pm2 start npm --name tronbet_scan_dice -- run test && cd ..

cd tronlive_dividends && pm2 start npm --name tronlive_dividends -- run test && cd ..
cd tronlive_dividends_trc20 && pm2 start npm --name tronlive_dividends_trc20 -- run test && cd ..
cd tronbet_dividends_win_trc20 && pm2 start npm --name tronbet_dividends_win_trc20 -- run test && cd ..
cd tronbet_blockscan && pm2 start npm --name scan_live -- run test:live && cd ..

cd tronpoker_dividends && pm2 start npm --name tronpoker_dividends -- run test && cd ..
cd tronbet_blockscan && pm2 start npm --name scan_poker -- run test:poker && cd ..
# end

cd tronsport_teckserver && pm2 start npm --name tronsport_teckserver -- run test && cd ..
cd tronswagger_hub && pm2 start npm --name tronswagger_hub -- run test && cd ..

# cd coin_exchange && pm2 start npm --name coin_exchange -- run test && cd ..

#cd tronbet_event02 && pm2 start npm --name tronbet_event02 -- run test && cd ..

#cd tronbet_live && npm run test:game

cd tronlive_platius && pm2 start npm --name tronlive_platius -- run test && cd ..
cd tronlive_binary && pm2 start npm --name tronlive_binary -- run test && cd ..
cd tronbet_live_wallet && pm2 start npm --name tronbet_live_wallet -- run test && cd ..