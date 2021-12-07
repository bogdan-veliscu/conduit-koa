import { route, POST, before, inject, GET, PUT, DELETE } from 'awilix-koa';

import ArticleRepository from '../repositories/ArticleRepository';
import AuthenticationMiddleware, { OptionalAuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { object, assert, string } from '@hapi/joi';
import slugify from 'slugify';
import { Article } from '../entities/Article';
import { Connection, SelectQueryBuilder, In } from 'typeorm';
import { Context } from 'koa';
import { CREATED, OK, NOT_FOUND, NO_CONTENT } from 'http-status-codes';

@route('/api/articles')
export default class ArticleController {
	private _articleRepository: ArticleRepository;

	constructor({ connection }: { connection: Connection }) {
		this._articleRepository = connection.getCustomRepository(ArticleRepository);
	}

	@route('/')
	@POST()
	@before([inject(AuthenticationMiddleware)])
	async createArticle(ctx: Context) {
		assert(
			ctx.request.body,
			object({
				article: object({
					title: string()
						.min(5)
						.max(50)
						.required(),
					description: string()
						.max(100)
						.required(),
					body: string()
						.max(5000)
						.required(),
				}),
			}),
		);

		const article: Article = new Article();

		article.title = ctx.request.body.article.title;
		article.description = ctx.request.body.article.description;
		article.body = ctx.request.body.article.body;
		article.slug = slugify(article.title, { lower: true });
		article.author = ctx.state.user;

		await this._articleRepository.save(article);

		const savedArticle: Article = await this._articleRepository.findOneOrFail({
			relations: ['author'],
			where: { slug: article.slug },
		});

		ctx.body = { article: savedArticle.toJSON(false, false) };
		ctx.status = CREATED;
	}

	@route('/')
	@GET()
	@before([inject(OptionalAuthenticationMiddleware)])
	async getArticles(ctx: Context) {
		const filterQuery: SelectQueryBuilder<Article> = this._articleRepository
			.createQueryBuilder('article')
			.select(['article.id'])
			.leftJoin('article.author', 'author');

		filterQuery.where('1 = 1');

		await this.getArticlesByFilteredIds(ctx, filterQuery);
	}

	async getArticlesByFilteredIds(ctx: Context, filterQuery: SelectQueryBuilder<Article>) {
		const articlesCount: number = await filterQuery.getCount();

		if (!articlesCount) {
			ctx.body = { articles: [], articlesCount: 0 };
			ctx.status = OK;
			return;
		}
		const filteredIds: any[] = await filterQuery.getRawMany();

		const query: SelectQueryBuilder<Article> = this._articleRepository
			.createQueryBuilder('article')
			.leftJoinAndSelect('article.author', 'author');
		//TODO add tags and favorites joins

		query.where({ id: In(filteredIds.map((article: any) => article.article_id)) });

		query.orderBy('article.createdAt', 'DESC');

		//TODO add pagination

		const filteredArticles: Article[] = await query.getMany();

		const articles: object[] = [];

		await Promise.all(
			filteredArticles.map(async (article: Article) => {
				//TODO compute favorited adn following values
				articles.push(article.toJSON(false, false));
			}),
		);

		ctx.body = { articles, articlesCount };
		ctx.status = OK;
	}

	@route('/:slug')
	@PUT()
	@before([inject(AuthenticationMiddleware)])
	async updateArticle(ctx: Context) {
		assert(
			ctx.request.body,
			object({
				article: object({
					title: string()
						.min(5)
						.max(50),
					description: string().max(100),
					body: string().max(5000),
				}),
			}),
		);

		const article: Article | undefined = await this._articleRepository.findOne({ slug: ctx.params.slug });

		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		Object.assign(article, ctx.request.body.article);

		if (ctx.request.body.article.title) {
			article.slug = slugify(article.title, { lower: true });
		}

		await this._articleRepository.update(article.id, article);

		const updatedArticle: Article = await this._articleRepository.findOneOrFail({
			relations: ['author'],
			where: { slug: article.slug },
		});

		ctx.body = { article: updatedArticle.toJSON(false, false) };
		ctx.status = CREATED;
	}

	@route('/:slug')
	@GET()
	@before([inject(AuthenticationMiddleware)])
	async getArticle(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({
			relations: ['author'],
			where: { slug: ctx.params.slug },
		});

		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		ctx.body = { article: article.toJSON(false, false) };
		ctx.status = OK;
	}

	@route('/:slug')
	@DELETE()
	@before([inject(AuthenticationMiddleware)])
	async deleteArticle(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({
			slug: ctx.params.slug,
		});

		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		await this._articleRepository.delete(article.id);
		ctx.status = NO_CONTENT;
	}
}
