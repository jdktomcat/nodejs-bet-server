import { think } from 'thinkjs';

export default class extends think.Model {
    get relation() {
        return {
            chris_log_detail: {
                type: think.Model.HAS_MANY,
                key : 'log_id',
                fKey : 'log_id',
            },
        }
    }

    async getLogs(addr) {
        return this.where({addr : addr}).order('log_id desc').limit(30).select()
    }
}
