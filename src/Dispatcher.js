import PS from 'pubsub-js';

import log from './log.js';

export const STATE = 'STATE';
export const DATA = 'DATA';
export const PING = 'PING';

class Dispatcher {

    // message.sender -> { state, prevState } 
    state = {};

    // message.sender -> { state, data, error }
    data = {};

    key = (message, sender) => (sender ? `${message}.${sender}` : message);

    constructor() {
        PS.subscribe(STATE, this.processState);
        PS.subscribe(DATA, this.processData);
        PS.subscribe(PING, this.processPing);
    }

    processState = (msg, { message, sender, state }) => {
        log(`## STATE --> processState : message ${message}, sender ${sender}, state `, state);

        const key = this.key(message, sender);
        let sent = this.state[key];
        const prevState = sent ? sent.state : undefined;

        this.state[key] = { prevState, state };
        this.state[message] = this.state[key];

        PS.publish(key, { sender, ...this.state[key] });
    };

    processData = (msg, { message, sender, state, getData }) => {
        log(`## DATA ---> processData :  message ${message}, sender ${sender}, state `, state);

        const key = this.key(message, sender);
        getData().then((data) => {
            this.data[key] = { state, data };
        }).catch((error) => {
            this.data[key] = { state, error };
        }).finally(() => {
            this.state[message] = this.data[key];
            PS.publish(key, { sender, ...this.data[key] });
        });
    };

    processPing = (msg, { message, sender }) => {
        log(`## PING ---> processPing :  message ${message}, sender ${sender}`);

        const key = this.key(message, sender);
        if (this.data[key]) {
            PS.publish(key, { sender, ...this.data[key] });
        }
        if (this.state[key]) {
            PS.publish(key, { sender, ...this.state[key] });
        }
    }

}

const d = new Dispatcher();

export default d;