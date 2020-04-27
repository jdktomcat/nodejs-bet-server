module.exports = {
  
  // 活动发奖的私钥 
  event_pk: '',
  // 活动发奖的私钥 对应的公钥
  event_pk_hex: '',

  // 操作Dice游戏相关的私钥 && 用于直接转账的私钥, 如排行榜奖励
  operatorDice_pk: '',
  // 操作Live游戏相关的私钥
  operatorLive_pk: '',
  // 财务账号
  financeBase58Check: '',
  // 合约地址
  contract: {
    Referralship: '41af16843d1b471364576015e4062cdc3f2628eb62',
    WinToken: '4174472e7d35395a6b5add427eecb7f4b62ad2b071',
    TronBetDice: '41e42d76d15b7ecd27a92cc9551738c2635c63b71c',
    TronBetMoon: '41bdd85750b6774910ca5d12b0620ba318eb00154b',
    TronBetRing: '41106841eb00cad39b90bf410fc52af8f73f2bbe2b',
    TronBetRingPvp: '4125fcfd3729801561b37f73189c98ab50341310c5',
    TronBetDiceStaker: '41aef3746e20c2a49b70c2c32b4f343548f428e7f1',
    TronBetStakerPlus: '414f92846c191c774d761f3949f9794288b3b9a995',
    TronBetDiceOraclize: '4163f9f14d5319b7f8822e7771aea45b49e85bb35e',
    TronBetMoonLogic: '415ee4096bad59e4656447af5420e09ef35f1e94ec',
    TronBetMoonOraclize: '417df10519e630f46071ff0569494d03b83d8289ca',
    TronBetRingLogic: '413bc99b02c0b3d02475faa97a04e44543603ad2c6',
    TronBetRingOraclize: '41f1dd6a50563513b024a8c1a8257cadd66f42d16e',
    TronBetRingPvpLogic: '41a67fd02df7895a8bc70a0401db26ba0f2c3e28de',
    TronBetRingPvpOraclize: '4150882bdd432f6d47a634a2c44b37f23ddb4115cf',
    TronBetDiceDivider: '41b461e58a69c8fb8dec6e23888d5fcd743ab56938',
    TronBetDividerPlus: '41479dfc899e9e8cfcc7adcf26dbdab49623f3b0a5',
    DiceToken: '416ce0632a762689a207b9cce915e93aa9596816ca',
    TronBetDiceDev: '410fa13f1920c66d7c9cb476e00557971a7f6bbd54',
    TronBetPool: '411d0f4031f9e3eeeb727b10e462ab0e59ee06a2a6',
    TronBetPoolPlus: '41a2d1d011696b59796b8eabe3a1b85cd4edbc83aa',
    TronBetDice10: '411fee56b32884a49155b7b6137ec0f1ee657455d5',
    TronBetDiceOraclize10: '4110d718c22e8aa287bb8193aceaf3b90e66e90e0a',
    TronBetPool10: '41049909a380d589b9af76846280d3fcbeb67826f0',
    LiveToken: '41d829659f0f7661f29f12f07a5be33c13b6c9dd59',
    TronBetLive: '414f012a6d5ecc301ec577714bb1431ed7e6f3ba0c',
    TronBetLiveStaker: '4182401794f58a8786995ba71bbcbefdd4041e07a1',
    TronBetLiveDev: '41342b0b5afcd63040fd573870b3958404573e4f07',
    TronBetLiveDivider: '413a71094391e538e432b485edb2f7894b44bf1202',
    TronBetLivePool: '41ba01bef5a503d3404e62b426b7e4e4595fe14530',
    TronBetLiveHotSlots: '41d139a029d0de5172949fb01c565cb6eeeffbd4e9',
    RakeToken: '4134f81abd2d45c1ccb83d20437f2c1e54ac1ffea8',
    TronBetRakeStaker: '4192d87ad1d98374755434cb560b5e01b05c48addf',
    TronBetTexas: '41e73da647a0363660855f2b368a0eec7283992de9',
    TronBetRakeDev: '418d8daaab7ded8ed6a3a2d6bf69d666180c365464',
    TronBetRakeDivider: '41ee8cfa0d020313c26073a9b3c1ac5a3c22319d5f',
    TronBetRakePool: '41c12f898af787ba7ca011bc4ac10b5475bc0102a4',
    TronBetTexasJackpot: '415ae207ff9d5d95b9e0b4fe50f480508046a43595',
    TronBetPool20: '41a319aae271b031fba91cf489b709616e837a1a56',
    TronBetDice20: '41f44697c352fc12b15718147f625b97720b21c41e',
    TronBetDiceOraclize20: '418ae25f03b57abc538e0c92f7923a95b0252bde81',

    WinTokenBase58Check: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
    TronBetPoolPlusBase58Check: 'TQp7pBWhEYiTUs6B1YBpWrmnjf5QjT1gXH',
    BttTokenId: 1002000,

    LivePay: '41f13f42b1ebe9c32f273f78a09979e123fba50f22',
    LiveStakingDividend: '4111f60acef886b62f45f0d9d784c8e062b73491ec',
    LiveBoardDividend: '410039b94367071a1a5f3a95ab1d8c153b23933ade',
    WinDividend: '41afa824f5eee50be558a8ddd7a555d34aaceccc72',
    WinPool: '41affbcb5d8daac7bcaf316d4c9f76a21648fd8e2b',

    USDT: '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
    USDTPooLOwner: '',

    Useless: '410000000000000000000000000000000000000000'
  },
  // mysql 配置
  mysql: {
    read_db_host: 'localhost',
    host: 'localhost',
    port: '3306',
    user: 'root',
    pwd: '123456'
  },
  // mongodb 配置
  mongo: {
    host: 'localhost',
    port: 27017,
    user: 'tbpoker',
    pwd: 'tronbetpoker2019'
  },
  // 端口配置
  port: {
    tronbet_backend: 18050,
    tronbet_dice: 18051,
    tronbet_moon: 18052,
    tronbet_ring: 18053,
    tronbet_profile: 18055,

    tronbet_backend02: 18056,
    tronbet_event01: 18058,

    tronlive_emserver: 18060,
    tronbet_live: 18066,

    tronsport_teckserver: 18068,
    tronswagger_hub: 18069,

    tronbet_poker: 18070,
    tronpoker_jackpot: 18071,
    tronlive_platinus: 18072,
    tronlive_binary: 18073,
  },
  // 远程接口
  // back01
  userInfoUrl: 'https://backendapi.tronbet.io/beter/userOverViewInfo?addr=',
  // back02
  liveProfitUrl: 'https://webliveapi.tronbet.io/user/profit',
  pokerProfitUrl: 'https://jackpotapi.tronbet.io/jackpot/profit',

  // tron
  master_full: 'http://192.169.81.106:8090',
  master_solidity: 'http://192.169.81.106:8091',
  master_event: 'https://api.trongrid.io',
  slave_full: 'https://testhttpapi.tronex.io',
  slave_solidity: 'https://testhttpapi.tronex.io',
  slave_event: 'http://47.252.82.6:8090/',

  // 官方地址
  tron_url_full: 'https://api.trongrid.io',
  tron_url_solidity: 'https://api.trongrid.io',
  tron_url_event: 'https://api.trongrid.io/',

  back_tron_url_full: 'https://super.guildchat.io',
  back_tron_url_solidity: 'https://solidity.guildchat.io',
  back_tron_url_event: 'https://api.trongrid.io/',

  // 第三方
  coinmarketcap: {
    coinExchangeUrl: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    headers: { 'X-CMC_PRO_API_KEY': '8511db0f-1e4e-43fa-91b6-1ef841bf1269' }
  },
  EveryMatrix: {
    LoginName: '',
    Password: ''
  },
  Platinus: {
    secretKey: '',
  },
  Binary: {
    secretKey: '',
  },
  coinspaid: {
    host: 'https://app.coinspaid.com/api',
    key: '',
    secret: ''
  },
  bettech: {
    publicKey: `-----BEGIN PUBLIC KEY-----
-----END PUBLIC KEY-----`
  },
  mail: {
    port: 465,
    host: 'smtp.gmail.com',
    user: '',
    pass: ''
  },
  swaghub: {
    host: '',
    operator_id: 823,
    swagPublick: `-----BEGIN PUBLIC KEY-----
-----END PUBLIC KEY-----`,
    publicKey: `-----BEGIN PUBLIC KEY-----
-----END PUBLIC KEY-----`,
    privetKey: `-----BEGIN RSA PRIVATE KEY-----
-----END RSA PRIVATE KEY-----`
  }
};
