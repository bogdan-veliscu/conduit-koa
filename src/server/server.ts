import * as Koa from "koa";
import cors from '@koa/cors';
import bodyParser from "koa-bodyparser";
import { SwaggerRouter } from "koa-swagger-decorator";

import helmet from 'koa-helmet';
import { Server } from "net";
import {configureSwaggerPlugin} from './plugins/swagger'
import Controllers from './controllers/index'
import { createConnection } from "typeorm";

export async function start(port: number): Promise<Server>{
    const app = new Koa();

    // provide important secyrity headers
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    )


    //enable cors
    app.use(cors());

    app.use(bodyParser());

    const router = new SwaggerRouter();

    //add swagger
    configureSwaggerPlugin(router);

    //inject controllers
    Controllers(router)

    //base route
    router.get('/', ctx=>{
        ctx.body={
            date: new Date().toString(),
            port,
            NODE_ENV: process.env.NODE_ENV,
            version: '1',
            message: 'Conduit API running. Go /swagger to learn more...',
        };
    });

    try {
        await createConnection();
    } catch (err) {
        console.warn(err);
    }

    app.use(router.routes());
    app.use(router.allowedMethods());

    const server = app.listen(port);
    console.log(`# Conduit API running on port: ${port}`)

}
