import { route, GET, before, inject } from 'awilix-koa';
import { OK, NOT_FOUND } from 'http-status-codes';
import { Context } from 'koa';
import { Connection } from 'typeorm';

import { User } from '../entities/User';
import UserRepository from '../repositories/UserRepository';
import { OptionalAuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';

@route('/api/profiles')
export default class ProfileController {
	private _userRepository: UserRepository;

	constructor({ connection }: { connection: Connection }) {
		this._userRepository = connection.getCustomRepository(UserRepository);
	}

	@route('/:username')
	@GET()
	@before([inject(OptionalAuthenticationMiddleware)])
	async getProfile(ctx: Context) {
		const user: User | undefined = await this._userRepository.findOne({ username: ctx.params.username });

		if (!user) {
			ctx.status = NOT_FOUND;
			return;
		}

		ctx.body = { profile: user.toProfileJSON(false) };
		ctx.status = OK;
	}
}
