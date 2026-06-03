import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { PlanItem } from './plan-item.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ nullable: true })
  estimatedCost!: number;

  @OneToMany(() => PlanItem, (item) => item.plan, { cascade: true, eager: true })
  items!: PlanItem[];

  @CreateDateColumn()
  createdAt!: Date;
}
