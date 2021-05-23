import PS from 'pubsub-js';

import Dispatcher, { STATE, DATA } from './src/Dispatcher.js';

import { DataCenter, Initiator, LazyAgent, EagerAgent } from './example.js';

const dc = new DataCenter('DataCenter');
const lazyAgent = new LazyAgent('LazyAgent');
const eagerAgent = new EagerAgent('EagerAgent');

const initiator = new Initiator('Initiator');

//PS.publish(STATE, { sender: '1', state: 'state1', message: 'clicked'});

//PS.publish(DATA, { sender: '2', state: 'state2', message: 'dataFetched'});


