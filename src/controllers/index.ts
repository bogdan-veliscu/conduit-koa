import { SwaggerRouter } from "koa-swagger-decorator";
import UserController from './usersController';


export default function Controller(router: SwaggerRouter): void{
    router.map(UserController, {})
}
