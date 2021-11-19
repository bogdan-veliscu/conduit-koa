import {SwaggerRouter} from 'koa-swagger-decorator';

export function configureSwaggerPlugin(router:SwaggerRouter) {
    router.swagger({
        title: 'Conduit API',
        description: 'Conduit Back-End Documentation',
        version: '0.1.0',

        swaggerHtmlEndpoint: '/swagger',
        swaggerJsonEndpoint: '/swagger-json',


        swaggerOptions: {
            consumes: ['application/json', 'text/plain'],
            produces: ['application/json'],
            securityDefinition: {
                Bearer: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                },
            },
        },

        swaggerConfiguration: {
            display: {
                defaultModelsExpandDepth:4,
                defaultModelExpandDepth:3,
                docExpansion:'list',
                defaultModelRendering: 'example',
                showCommonExtensions: true,
                showExtensions: true,
            },
        },
    });
}
