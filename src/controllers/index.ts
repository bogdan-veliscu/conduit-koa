import { SwaggerRouter } from "koa-swagger-decorator";
import UserController from './UserController';


export default function Controller(router: SwaggerRouter): void{
    router.map(UserController, {})
}
