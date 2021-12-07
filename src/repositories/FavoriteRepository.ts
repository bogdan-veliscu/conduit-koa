import { EntityRepository, Repository } from 'typeorm';

import { Favorite } from '../entities/Favorite';
import { User } from '../entities/User';
import { Article } from '../entities/Article';

@EntityRepository(Favorite)
export default class FavoriteRepository extends Repository<Favorite> {
	async favorited(article: Article, user: User): Promise<boolean> {
		const favorited: number = await this.count({ article, user });
		return !!favorited;
	}
}
