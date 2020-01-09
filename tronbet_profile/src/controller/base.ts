import { think } from 'thinkjs';
import { debug } from 'util';
export default class extends think.Controller {
  __before() {
    this.header("Access-Control-Allow-Origin", "*");
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
