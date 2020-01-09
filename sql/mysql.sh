#!/bin/sh

mysql -u root -p < tron_bet_admin.sql
mysql -u root -p < tron_bet_wzc.sql
mysql -u root -p < tronbet_poker_log.sql
mysql -u root -p < tron_live.sql
mysql -u root -p < tron_price.sql
mysql -u root -p < update.sql

# mysqldump -u root -p --all-databases > tronbet.sql

# mysqldump -u root -p --databases tron_bet_admin tron_bet_wzc tronbet_poker_log tron_live > tronbet.sql

# mysqladmin -u root -p drop tron_bet_admin
# mysqladmin -u root -p drop tron_bet_wzc
# mysqladmin -u root -p drop tronbet_poker_log
# mysqladmin -u root -p drop tron_live
# mysqladmin -u root -p drop tron_price

# mysqldump -u root -p --databases tron_price > tron_price.sql


# mongo
# use tronbet_poker_data
# db.dropDatabase()
# db.new_collection.insert({ some_key: "some_value" })
# db.createUser({user:"tbpoker",pwd:"tronbetpoker2019",roles:[{role:"dbOwner",db:"tronbet_poker_data"}]})

# redis-cli
# flushall