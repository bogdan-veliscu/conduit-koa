import { Entity, BeforeUpdate, PrimaryGeneratedColumn, ManyToOne, Index, Column } from 'typeorm';

import { User } from './User';

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
		(user: User) => user.articles
	)
    author!: User;

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
            favorited
        }
    }
}
