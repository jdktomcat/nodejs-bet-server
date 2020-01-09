import { think } from 'thinkjs';
import { debug } from 'util';

const nJwt = require('njwt');

const signingKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3Ryb25iZXQuaW8vIiwic3ViIjoiV2FuZ21hbiIsInNjb3BlIjoiYWxsIiwianRpIjoiODQxY2MwMWEtNTY3Mi00ZDE2LWFkMzYtNzI2ODdjZDcwZWQyIiwiaWF0IjoxNTQxNDk3MzI0LCJleHAiOjE1NDE1MDA5MjR9.QwiPvbW22xK2puq85_sYK4Ao3XoEYuFBcF4KHfS2ZzY"
export default class extends think.Service {

    getUseToken(username, roleId){
      let claims = {
        iss: "https://tronbet.io/",
        sub: roleId,
        scope: "all"
      }

      let jwt = nJwt.create(claims, signingKey);
      let token = jwt.compact();
      return token;
    }

    verifyUserToken(token){
      try{
        let verifiedJwt = nJwt.verify(token, signingKey);
        return verifiedJwt;
      }catch(e){
        console.error(e)
        return false;
      }
    }
}