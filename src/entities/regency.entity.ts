import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Place } from './place.entity';

@Entity('regencies')
export class Regency {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Place, (place) => place.regency)
  places!: Place[];
}
