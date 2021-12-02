import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator'

@swaggerClass()
export class SignupRequest {
    @swaggerProperty({type: 'string', example:'SuperM'})
    username: string;

    @swaggerProperty({ type: 'string', example:'Just one of the best arcade games ever' })
    bio: string;

    @swaggerProperty({ type: 'string', example:'rio.jpg' })
    image: string;

    @swaggerProperty({ type: 'string', example:'mario@super.io' })
    email: string;

    @swaggerProperty({
        type: 'string',
        example: 'wqeqwe-yuiyui-dfgdfg',
    })
    password: string;
}

@swaggerClass()
export class UserDetails {
    
    @swaggerProperty({type: 'string', example:'21'})
    id?: number;

    @swaggerProperty({type: 'string', example:'Luigi'})
    name: string;

    @swaggerProperty({type: 'string', example:'Super'})
    surname: string;

    @swaggerProperty({type: 'string', example:'32'})
    age: number;

    @swaggerProperty({type: 'string', example:'test@super.io'})
    email: string;
}
