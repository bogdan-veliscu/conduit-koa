import { Entity, PrimaryGeneratedColumn, Index, Column, OneToMany } from 'typeorm';
import { Article } from './Article';
import { Favorite } from './Favorite';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Index({ unique: true })
	@Column()
	username!: string;

	@Index({ unique: true })
	@Column()
	email!: string;

	@Column({ default: '' })
	bio!: string;

	@Column({ default: '' })
	image!: string;

	@Column()
	password!: string;

	@OneToMany(
		() => Article,
		(article: Article) => article.author,
	)
	articles!: Article[];

    @OneToMany(()=> Favorite, (favorite: Favorite)=> favorite.user)
    favorites!: Favorite[];

	toUserJSON(token: string) {
		return {
			email: this.email,
			username: this.username,
			bio: this.bio,
			image: this.image,
			token,
		};
	}

	toProfileJSON(following: boolean) {
		return {
			username: this.username,
			bio: this.bio,
			image: this.image,
			following,
		};
	}
}
