import { EventEmitter } from 'node:events';
const eventEmitter = new events.EventEmitter();

eventEmitter.on('created', async ({ data }) => {
    // send email
});