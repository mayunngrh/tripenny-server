import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Place } from './place.entity';

@Entity('extra_expenses')
export class ExtraExpense {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Place, (place) => place.extraExpenses, { onDelete: 'CASCADE' })
  place!: Place;

  @Column()
  name!: string;

  @Column({ type: 'integer' })
  price!: number;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  icon?: string;
}
