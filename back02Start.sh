#!/bin/sh

# same server
# cd tronbet_dice && pm2 start npm --name tronbet_dice -- run start && cd ..
# cd tronbet_moon && pm2 start npm --name tronbet_moon -- run start && cd ..
# cd tronbet_ring && pm2 start npm --name tronbet_ring -- run start && cd ..
# cd tronbet_backend && pm2 start npm --name tronbet_backend -- run start && cd ..
# cd tronbet_profile && pm2 start npm --name tronbet_profile -- run start && cd ..
# cd tronbet_rank && pm2 start npm --name tronbet_rank -- run start && cd ..
# cd tronbet_task && pm2 start npm --name tronbet_task -- run start && cd ..
# end

cd tronbet_live && pm2 start npm --name tronbet_live -- run start && cd ..
cd tronlive_airdrop && pm2 start npm --name tronlive_airdrop -- run start && cd ..
cd tronlive_data && pm2 start npm --name tronlive_data -- run start && cd ..
cd tronlive_emserver && pm2 start npm --name tronlive_emserver -- run start && cd ..

# need mongo
cd tronbet_poker && pm2 start npm --name tronbet_poker -- run start && cd ..
cd tronpoker_jackpot && pm2 start npm --name tronpoker_jackpot -- run start && cd ..
# end
cd tronpoker_airdrop && pm2 start npm --name tronpoker_airdrop -- run start && cd ..

# same server
# cd tronbet_auto_dividends && pm2 start npm --name tronbet_auto_dividends -- run start && cd ..
# cd tronbet_auto_dividends_win && pm2 start npm --name tronbet_auto_dividends_win -- run start && cd ..
# cd tronbet_blockscan && pm2 start npm --name scan_dice -- run start && cd ..
# cd tronbet_scan_dice && pm2 start npm --name tronbet_scan_dice -- run start && cd ..

cd tronlive_dividends && pm2 start npm --name tronlive_dividends -- run start && cd ..
cd tronlive_dividends_trc20 && pm2 start npm --name tronlive_dividends_trc20 -- run start && cd ..
cd tronbet_dividends_win_trc20 && pm2 start npm --name tronbet_dividends_win_trc20 -- run start && cd ..
cd tronbet_blockscan && pm2 start npm --name scan_live -- run start:live && cd ..

cd tronpoker_dividends && pm2 start npm --name tronpoker_dividends -- run start && cd ..
cd tronbet_blockscan && pm2 start npm --name scan_poker -- run start:poker && cd ..
# end

cd tronsport_teckserver && pm2 start npm --name tronsport_teckserver -- run start && cd ..
cd tronswagger_hub && pm2 start npm --name tronswagger_hub -- run start && cd ..

# cd coin_exchange && pm2 start npm --name coin_exchange -- run start && cd ..

cd tronbet_event02 && pm2 start npm --name tronbet_event02 -- run start && cd ..

cd tronbet_live && npm run start:game