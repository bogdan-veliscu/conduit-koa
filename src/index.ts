import Koa from 'koa';
import { createApp } from './server/server';
import dotenv from 'dotenv';
import Logger from './server/Logger'

import 'reflect-metadata';

const port: number = parseInt(process.env.PORT as string, 10) || 5000;

async function start(): Promise<void> {
    try{
        Logger.info('starting...');
        if (!process.env.NODE_ENV){
            dotenv.config();
        }
        Logger.info(`environment set to ${process.env.NODE_ENV}`);
        const app: Koa = await createApp();
        app.listen(port);
        Logger.info(`listening on port: ${port}`);
    } catch (err) {
        Logger.error(`exception starting server:`, err)
    }
}

start();
