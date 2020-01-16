const path = require('path');

let config = {
  env: 'dev',
  debug: false,
  app: {
    http_port: 9020,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: '192.169.80.102',
    db_port: '3306',
    db_name: 'test_tronb_live',
    db_user: 'root',
    db_pwd: '',
    connectionLimit: 5
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    pwd: 'tronbet_201811'
  },
  tronConfig: {
    privateKey: '',

    masterFullNode: 'https://testhttpapi.tronex.io',
    masterSolidityNode: 'https://testhttpapi.tronex.io',
    masterEventNode: 'http://47.252.82.6:8090',

    slaveFullNode: 'https://testhttpapi.tronex.io',
    slaveSolidityNode: 'https://testhttpapi.tronex.io',
    slaveEventNode: 'http://47.252.82.6:8090'
  },
  event:{

    ACTIVITY_START_TS: 1579046400000, //2019-01-15 08:00:00
    ACTIVITY_END_TS: 1580774400000, //2020-02-04 08:00:00

  },
  swaghub: {
    host: 'https://api.server1.ih.testenv.io',
    operator_id: 823,
    swagPublick: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1eS2kUdUTni1Z/XBpe0g
nVuY9skKNOh1IoY6oZnuujKKF25kMKAh7IvlYfuY7Dd9v8HhphmeU0v99iK+/W8z
ZmBTXaGUh7CeBHikk+eqOX+nksDZSSRqwKHAhj4rWjhp2twmaETDkXFQfJUTQlPG
uPuPb8c7mv9bmvpG0g/1R67SdnM3Horzb3gM4w8nxLpIsAoUhuQrPp/0i2G5/lm6
EcQYeT6X6YzF29tV/jasXHgi7Dr8VlmZHtqvNPtBRjWkKMqGriUQDbr8SC89nzJB
XTMVGzrRbaxuDGcCsD8Q79YFgWshat2AfbmOKlQURNNVCRcdPLcXIM8lR3fesVVe
1QIDAQAB
-----END PUBLIC KEY-----`,
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApfEP6XVqfpKhLmeUoS9p
WFDudQnTg1CIDS+Pr2moHgjXBXL93ckgrsEpoVS0y/DxJDISlfzrN2Jd15t7jC+g
0ddU1ysvalJa064NU9u4LrEE1KvN91+49gaobwIIZPKwxvXh9Tm3/KcvSlFfhP80
fAq+CeTDCCAmUxa/1x6H/k1sln8hph6TFDivaY9jZgb+PEzzqRBooBWKIga4PSmz
Mlu/EQVO5SjRP2s8IKpPkCTT6ZISqUrieVFx0zvcmkHLgScRdyrnjKC2Dl5K6vMG
qksZHIUHmKMT/j77pANQTu2Ut4hGOpq/gJJOmqUeD/COzlk1M2Uy88Lp5K3H3ydK
QQIDAQAB
-----END PUBLIC KEY-----`,
    privetKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEApfEP6XVqfpKhLmeUoS9pWFDudQnTg1CIDS+Pr2moHgjXBXL9
3ckgrsEpoVS0y/DxJDISlfzrN2Jd15t7jC+g0ddU1ysvalJa064NU9u4LrEE1KvN
91+49gaobwIIZPKwxvXh9Tm3/KcvSlFfhP80fAq+CeTDCCAmUxa/1x6H/k1sln8h
ph6TFDivaY9jZgb+PEzzqRBooBWKIga4PSmzMlu/EQVO5SjRP2s8IKpPkCTT6ZIS
qUrieVFx0zvcmkHLgScRdyrnjKC2Dl5K6vMGqksZHIUHmKMT/j77pANQTu2Ut4hG
Opq/gJJOmqUeD/COzlk1M2Uy88Lp5K3H3ydKQQIDAQABAoIBAFDtHB51pabuqW5x
E1n8PjrU1UX8scszhfYwQLmCJHvpQbullcsIoEi5aS0Fm1puOZu2U7wT6T5MWYmh
iQIX5C0R/40jwW7vlN3w3w0LdWpH6BwzYTIH27MYEiJ48lEQzkdpeHXYXTL48aYj
wxqgPx9TOdSnXLnku+v/hzVI7XeFz1sthQXvECRBnii/7pHzrEef1LDnv2FlVkC1
kV6nLv7g3CQAJYc+yY9jeHUmxCcg+oQdeMV43xG0r4949A+1WQDIAa9YjG5Z/tyN
+i3t+wIwcy9KnwVEsPp6jqiZY4lhka7ZSiv+MB7qlcyEKh2BFIUvI/bZeaNl22ey
l0wIVcECgYEA2fVAvFWLQQBp8A9403At2JT2yrylTnYeWMBNcRDLeIKk/prW+D8c
pY1gE+g8j7YNO4KaG1FEkqgyLVzz17L8BmDWE3yCDBxmgAg9FBOqUZcyB6Il1Ir7
cVqCq173wCrP2UuQzyfUfkwMlr3KtIsYZBy+7Jg6HQVuWmAudQ9wSIkCgYEAwueg
YrU7w+rlSqedJ+Pz1XEHjK3f6AFyTDjZ8v84e2eegY/l5ua7Wo8nHtP37nAChDeE
1bQLLWkLldcG8Y313fB/fjh6IUjIrdBD8Ey62NATmkVTJGmRs94CpWuUarB0TyJp
yc3Mq2v57RY2HGM3xWZzJZBBZ6vu9VdauAqxlfkCgYEAz/lkvxEFYo4JiCbLTT5C
kOJ7pzJgrkCpblh4zMWQ0bofxE5th815AUOohPZaK2s0ry9M63oda6+QyZZjmtPQ
BioKu+dXlETZTZwO5ARrxZT3CS+g13GSwjPycaGZ2EVBtX+UewbvjV/1tzT8olAD
gyumxs3uzdhr11LloY+MvbkCgYBlxOQuJkuqpQBM1vBsX8516Kr0feWoEvlHa3gC
NdmcNiLBrA1zX478XjsjEbMnwTzPJN4rZ/NeJrdx6fEqN+HlnSo1EfBTaNnASDrx
Ql9dzmgt6XzcSnNV49ql3WKFwtU4bNOoF9mCuMKrVSmz8OqyHCiLuKMuKsx/Nrmb
15maoQKBgByTvQYFwg1bYq7TKG4gJQtDZcbyBSTXJSzpX4Ie2xZmwzXC7w/cq/jn
FiD9+OpD66DUR+a4wukXVsJrbLA+eVNgDJzlNkeIWfzH/qDMZ/T+JLaw/7XPWBk6
ULCBrNTxFFxtiTdXAaWP7eJv6LA91zbi3eIDFmQByS5OnX2jD7tW
-----END RSA PRIVATE KEY-----`
  }
};

module.exports = config;
