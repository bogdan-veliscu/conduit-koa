import Koa from 'koa';
import { createContainer, AwilixContainer, asValue } from 'awilix';
import { scopePerRequest, loadControllers } from 'awilix-koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import helmet from 'koa-helmet';
import errorMiddleware from '../middleware/ErrorMiddleware';
import Logger from './Logger';
import SecurityService from '../services/SecurityService';
import { createConnection, Connection } from 'typeorm';

export async function connectWithRetry(): Promise<Connection> {
	try {
		console.log('# calling createConnection');
		return await createConnection();
		console.log('# after createConnection');
	} catch (err) {
		Logger.error('failed to connect to db on startup -- retrying in 5 seconds', err);
		await new Promise((resolve: any) => setTimeout(resolve, 500));
		return connectWithRetry();
	}
}
export async function createApp(): Promise<Koa> {
	console.log('# createApp');
	const app = new Koa();

	const securityService: SecurityService = new SecurityService();
	const connection: Connection = await connectWithRetry();

	Logger.info('successfully established DB connection');

	const container: AwilixContainer = createContainer().register({
		securityService: asValue(securityService),
		connection: asValue(connection),
	});

	app
		.use(cors())
		.use(bodyParser())
		.use(helmet())
		.use(scopePerRequest(container))
		.use(errorMiddleware)
		.use(loadControllers('../controllers/*.{ts,js}', { cwd: __dirname }));

	return app;
}
