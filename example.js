import PS from 'pubsub-js';

import { STATE, DATA, PING } from './src/Dispatcher.js';
import log from './src/log.js';

const config = {
    DATA_TIMEOUT: 5,
    INITIATOR_DATA_TIMEOUT: 10,
    INITIATOR_AGENT_TIMEOUT: 40
};

const M = {
    data: 'data',
    action: 'action',
    agent: 'agent',
    lazy: 'lazy',
    eager: 'eager'
}

const ACTIONS = {
    next: 'next'
}

class DataFetcher {

    count = 0;

    getData = () => (new Promise((resolve, reject) => {
        let wait = setTimeout(() => {
            clearTimeout(wait);
            resolve(++this.count);
        }, config.DATA_TIMEOUT * 1000);
    }));
}

export class DataCenter {

    constructor(id) {
        this.id = id;
        this.data = null;
        this.dataFetcher = new DataFetcher();

        PS.subscribe(M.data, (msg, { data }) => {
            log(`** DataCenter (${msg}): data = `, data);
            this.data = data;
        });

        PS.subscribe(M.action, (msg, { state }) => {
            if (state.action === ACTIONS.next) {
                log(`** DataCenter (${msg}): fetch next data`);
                PS.publish(DATA, {
                    message: M.data,
                    sender: this.id,
                    getData: this.dataFetcher.getData
                })
            }
        });
    }
}

export class Initiator {
    constructor(id) {
        this.id = id;
        this.agent = M.lazy;

        setInterval(() => {
            log('++ Initiator: fetch next data');

            PS.publish(STATE, { message: M.action, sender: this.id,  state: { action: ACTIONS.next }});
        }, config.INITIATOR_DATA_TIMEOUT * 1000);

        PS.publish(STATE, { message: M.agent, sender: this.id,  state: { agent: this.agent }});
        setInterval(() => {
            this.agent = this.agent === M.lazy ? M.eager : M.lazy;
            log('++ Initiator: switch to agent', this.agent);

            PS.publish(STATE, { message: M.agent, sender: this.id,  state: { agent: this.agent }});
        }, config.INITIATOR_AGENT_TIMEOUT * 1000);
    }
}

class Agent {
    constructor(id, type) {
        this.id = id;
        this.type = type;
        this.active = false;
        this.data = null;

        PS.subscribe(M.agent, (msg, { state }) => {
            this.active = (state.agent === this.type);
            if (this.active) {
                log('\n***** Active agent : ', this.id);
                if (this.type === M.eager) {
                    PS.publish(PING, { message: M.data });
                }
            }
        });

        PS.subscribe(M.data, (msg, { data }) => {
            if (this.active) {
                log(`** ${this.id} (${msg}): data = `, data);
                this.data = data;
            }
        });
    }
}

export class LazyAgent extends Agent {
    constructor(id) {
        super(id, M.lazy);
    }
}

export class EagerAgent extends Agent {
    constructor(id) {
        super(id, M.eager);
    }
}