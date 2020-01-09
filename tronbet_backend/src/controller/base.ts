import { think } from 'thinkjs';
import { debug } from 'util';
const WhiteHosts = [
  'https://cdn.tronbet.io',
  'https://res.tronbet.io',
  'https://www.tronbet.io',
  'https://tronbet.io',
  'http://cdn.tronbet.io',
  'http://res.tronbet.io',
  'http://www.tronbet.io',
  'http://tronbet.io',
  'https://backend.tronbet.io',
  'https://korea.tronbet.io',
  'http://korea.tronbet.io',
  'https://mirror.tronbet.io',
  'http://mirror.tronbet.io',
  'https://mirror2.tronbet.io',
  'http://mirror2.tronbet.io',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://binancecup.tronbet.io',
  'https://binancecup.tronbet.io',
  'https://www.wink.org',
  'https://wink.org',
  'https://cdn.wink.org',
  'https://res.wink.org',
  'http://www.wink.org',
  'http://wink.org',
  'http://cdn.wink.org',
  'http://res.wink.org',
]

export default class extends think.Controller {
  __before() {
    let host = this.ctx.request.header.origin
    console.log('host:', host ? host : '');
    for (let one of WhiteHosts) {
      if (one == host) {
        console.log('set Access-Control-Allow-Origin', one)
        this.header("Access-Control-Allow-Origin", one);
      }
    }
    this.header("Access-Control-Allow-Origin", '*');
    this.header("Access-Control-Allow-Headers", "authorization, origin, x-requested-with, content-type, accept");
    this.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE");
    this.header("Access-Control-Expose-Headers", "Authorization");
    this.header("Access-Control-Allow-Credentials", "true");

    const method = this.method.toLowerCase();
    if (method === "options") {
      console.error(method)
      this.fail(2000, 'ok')
      return false
    }

    let url = this.ctx.request.url

    let rex = /user\/login/

    if (rex.test(url)) {
      return;
    }

    let rexInfo = /update\/info/
    if (rexInfo.test(url)) {
      return;
    }

    let endtime = /update\/cronrank/
    if (endtime.test(url)) {
      return;
    }

    let endtime1 = /update\/getActEndTime/
    if (endtime1.test(url)) {
      return;
    }

    let rank = /update\/gettksrank/
    if (rank.test(url)) {
      return;
    }
    let rank1 = /update\/dailyrank/
    if (rank1.test(url)) {
      return;
    }

    let beter = /beter\/*/
    if (beter.test(url)) {
      return;
    }

    let christmas = /christmas\/*/
    if (christmas.test(url)) {
      return;
    }

    return this.checkAuth();
  }

  checkStrParam(str) {
    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");

    if(pattern.test(str)){
        return false
    }
    return true
  }

  checkAuth () {

    let addr = this.post('address')
    let parmas = this.post()
    let param = null
    if (addr != undefined) {
      param = {'address': addr}
    } else {
      for (let i in parmas) {
        param = JSON.parse(i + '')
        break
      }
    }
    try{
      const token = param["address"];
      const auth = this.service("token").verifyUserToken(token);
      if(auth){
        this.ctx.param('role', auth.body.sub)
        return true;
      } else {
        this.fail("AUTH_FAILED");
        return false;
      }
    }catch(e){
      this.fail("AUTH_FAILED");
      return false;
    }


  }
}
