module.exports= {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    //synchronized: true,
    logging: false,
    entities: ['src/entities/*.ts'],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
    cli: {
        entitiesDir: 'src/entities',
        migrationsDir: 'src/migrations',
        subscribersDir: 'src/subscribers'
        
    }
}
