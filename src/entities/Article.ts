import { Entity, BeforeUpdate, PrimaryGeneratedColumn, ManyToOne, Index, Column, OneToMany } from 'typeorm';

import { User } from './User';
import { Favorite } from './Favorite';

@Entity('articles')
export class Article {
	@PrimaryGeneratedColumn()
	id!: number;

	@Index({ unique: true })
	@Column()
	slug!: string;

	@Column()
	title!: string;

	@Column({ default: '' })
	description!: string;

	@Column({ default: '' })
	body!: string;

	@ManyToOne(
		() => User,
		(user: User) => user.articles,
	)
	author!: User;

	@OneToMany(
		() => Favorite,
		(favorite: Favorite) => favorite.article,
	)
	favorites!: Favorite[];

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	updatedAt!: Date;

	@BeforeUpdate()
	updateTimestamp() {
		this.updatedAt = new Date();
	}

	toJSON(following: boolean, favorited: boolean) {
		return {
			...this,
			author: this.author && this.author.toProfileJSON(following),
			favorited,
		};
	}
}
