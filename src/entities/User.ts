import { Entity, Index, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({unique:true})
    @Column()
    username: string;

    @Index({unique: true})
    @Column()
    email!: string;
    
    @Column({default: ''})
    bio!: string;

    @Column({default:''})
    image: string;

    @Column()
    password!: string;

    toUserJSON(token: string){
        return {
            email:this.email,
            username: this.username,
            bio: this.bio,
            image: this.image,
            token

        };
    }

    toProfileJSON(){
        return {
            username: this.username,
            bio: this.bio,
            image: this.image
        };
    }

}
