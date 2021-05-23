import config from '../config.js';

const log = config.log ? console.log : () => {};

export default log;