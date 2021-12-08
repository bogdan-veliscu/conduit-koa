import { route, GET } from 'awilix-koa';
import { Connection } from 'typeorm';
import { Context } from 'koa';
import { Tag } from '../entities/Tag';
import TagRepository from '../repositories/TagRepository';
import { OK } from 'http-status-codes';

@route('/api/tags')
export default class TagController {
	private _tagRepository: TagRepository;

	constructor({ connection }: { connection: Connection }) {
		this._tagRepository = connection.getCustomRepository(TagRepository);
	}

	@route('/')
	@GET()
	async getTags(ctx: Context) {
		const tags: Tag[] = await this._tagRepository.find();
		ctx.body = { tags: tags.map((tag: Tag) => tag.toJSON()) };
		ctx.status = OK;
	}
}
