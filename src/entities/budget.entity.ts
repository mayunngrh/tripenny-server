import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  minPrice!: number;

  @Column()
  maxPrice!: number;
}
