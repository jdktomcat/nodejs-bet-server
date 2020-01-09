import Base from './base.js';
export default class extends Base {
  indexAction() {
    return "asddsa";
  }

  async index2Action() {
    const test = this.model('test'); // controller 里实例化模型
    const data = await test.select();
    // return this.error(data);
    // return this.fail(500, '111')
  }
}
