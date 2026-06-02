import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Place } from './place.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  iconName!: string;

  @ManyToMany(() => Place, (place) => place.tags)
  places!: Place[];
}
