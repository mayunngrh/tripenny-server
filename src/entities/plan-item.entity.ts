import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Plan } from './plan.entity';
import { Place } from './place.entity';

@Entity('plan_items')
export class PlanItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Plan, (plan) => plan.items, { onDelete: 'CASCADE' })
  plan!: Plan;

  @ManyToOne(() => Place, { nullable: true })
  place!: Place | null;

  @Column()
  dayIndex!: number;

  @Column({ type: 'time', nullable: true })
  visitTime!: string | null;

  @Column({ nullable: true })
  notes!: string;
}
