import { route, POST, before, inject, GET, PUT, DELETE } from 'awilix-koa';

import ArticleRepository from '../repositories/ArticleRepository';
import AuthenticationMiddleware, { OptionalAuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { object, assert, string, array } from '@hapi/joi';
import slugify from 'slugify';
import { Article } from '../entities/Article';
import { Connection, SelectQueryBuilder, In } from 'typeorm';
import { Context } from 'koa';
import { CREATED, OK, NOT_FOUND, NO_CONTENT } from 'http-status-codes';
import FavoriteRepository from '../repositories/FavoriteRepository';
import { Favorite } from '../entities/Favorite';
import CommentRepository from '../repositories/CommmentRepository';
import { Comment } from '../entities/Comment';
import FollowRepository from '../repositories/FollowRepository';
import { Tag } from '../entities/Tag';

@route('/api/articles')
export default class ArticleController {
	private _articleRepository: ArticleRepository;
	private _favoriteRepository: FavoriteRepository;
	private _commentRepository: CommentRepository;
	private _followRepository: FollowRepository;

	constructor({ connection }: { connection: Connection }) {
		this._articleRepository = connection.getCustomRepository(ArticleRepository);
		this._favoriteRepository = connection.getCustomRepository(FavoriteRepository);
		this._commentRepository = connection.getCustomRepository(CommentRepository);
		this._followRepository = connection.getCustomRepository(FollowRepository);
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
					tagList: array()
						.items(string().max(10))
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
		article.tagList = ctx.request.body.article.tagList.map((tagLabel: string) => {
			const tag: Tag = new Tag();
			tag.label = tagLabel;
			return tag;
		});

		await this._articleRepository.save(article);

		const savedArticle: Article = await this._articleRepository.findOneOrFail({
			relations: ['tagList', 'author', 'favorites'],
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
			.leftJoin('article.author', 'author')
			.leftJoin('article.tagList', 'tagList')
			.leftJoin('article.favorites', 'favorites');

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
			.leftJoinAndSelect('article.author', 'author')
			.leftJoinAndSelect('article.tagList', 'tagList')
			.leftJoinAndSelect('article.favorites', 'favorites');

		query.where({ id: In(filteredIds.map((article: any) => article.article_id)) });

		query.orderBy('article.createdAt', 'DESC');

		//TODO add pagination

		const filteredArticles: Article[] = await query.getMany();

		const articles: object[] = [];

		await Promise.all(
			filteredArticles.map(async (article: Article) => {
				const following = await this._followRepository.following(ctx.state.user, article.author);
				const favorited: boolean = await this._favoriteRepository.favorited(article, ctx.state.user);

				articles.push(article.toJSON(following, favorited));
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
			relations: ['tagList', 'author', 'favorites'],
			where: { slug: article.slug },
		});

		const favorited: boolean = await this._favoriteRepository.favorited(updatedArticle, ctx.state.user);

		ctx.body = { article: updatedArticle.toJSON(false, favorited) };
		ctx.status = CREATED;
	}

	@route('/:slug')
	@GET()
	@before([inject(AuthenticationMiddleware)])
	async getArticle(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({
			relations: ['tagList', 'author', 'favorites'],
			where: { slug: ctx.params.slug },
		});

		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		const favorited: boolean = await this._favoriteRepository.favorited(article, ctx.state.user);

		ctx.body = { article: article.toJSON(false, favorited) };
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

	@route('/:slug/comments')
	@POST()
	@before([inject(AuthenticationMiddleware)])
	async addCommment(ctx: Context) {
		assert(
			ctx.request.body,
			object({
				comment: object({
					body: string()
						.max(5000)
						.required(),
				}),
			}),
		);

		const article: Article | undefined = await this._articleRepository.findOne({
			slug: ctx.params.slug,
		});

		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		const comment: Comment = new Comment();
		comment.body = ctx.request.body.comment.body;
		comment.article = article;
		comment.author = ctx.state.user;
		await this._commentRepository.save(comment);

		const following: boolean = await this._followRepository.following(ctx.state.user, article.author);

		ctx.body = { comment: comment.toJSON(following) };
		ctx.status = CREATED;
	}

	@route('/:slug/comments')
	@GET()
	@before([inject(OptionalAuthenticationMiddleware)])
	async getComments(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({ slug: ctx.params.slug });
		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		const comments: Comment[] = await this._commentRepository.find({ article });
		const following: boolean = await this._followRepository.following(ctx.state.user, article.author);
		ctx.body = { comments: comments.map((comment: Comment) => comment.toJSON(following)) };
		ctx.status = OK;
	}

	@route('/:slug/comments/:id')
	@DELETE()
	@before([inject(AuthenticationMiddleware)])
	async deleteComment(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({
			slug: ctx.params.slug,
		});
		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		await this._commentRepository.delete(ctx.params.id);
		ctx.status = NO_CONTENT;
	}

	@route('/:slug/favorite')
	@POST()
	@before([inject(AuthenticationMiddleware)])
	async favoriteArticle(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({
			relations: ['tagList', 'author', 'favorites'],
			where: { slug: ctx.params.slug },
		});
		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		const existingFavorite: number = await this._favoriteRepository.count({
			article,
			user: ctx.state.user,
		});

		if (!existingFavorite) {
			const favorite: Favorite = new Favorite();
			favorite.article = article;
			favorite.user = ctx.state.user;
			await this._favoriteRepository.save(favorite);
			article.favorites.push(favorite);
		}

		const following: boolean = await this._followRepository.following(ctx.state.user, article.author);

		ctx.status = CREATED;
		ctx.body = { article: article.toJSON(following, true) };
	}

	@route('/:slug/favorite')
	@DELETE()
	@before([inject(AuthenticationMiddleware)])
	async unfavoriteArticle(ctx: Context) {
		const article: Article | undefined = await this._articleRepository.findOne({
			relations: ['tagList', 'author', 'favorites'],
			where: { slug: ctx.params.slug },
		});

		if (!article) {
			ctx.status = NOT_FOUND;
			return;
		}

		await this._favoriteRepository.delete({
			article,
			user: ctx.state.user,
		});

		article.favorites.pop();

		const following: boolean = await this._followRepository.following(ctx.state.user, article.author);

		ctx.status = OK;
		ctx.body = { article: article.toJSON(following, false) };
	}
}
