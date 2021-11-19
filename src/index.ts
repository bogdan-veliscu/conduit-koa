import {start as startServer} from './server/server';
require('dotenv').config();

const port: number = parseInt(process.env.PORT as string, 10) || 5000;

async function start(): Promise<void> {
    try{
        await startServer(port);
    } catch (err) {
        process.exit(1);
    }
}

start();
