module.exports= {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronized: true,
    logging: false,
    ssl: process.env.DB_SSL === 'true',
    extra:
    process.env.DB_SSL === 'true' ? {
        ssl:{
            rejectUnauthorized: false,
        },
    }: undefined,
    entities: ['src/entities/**/*.{js,ts}'],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
}