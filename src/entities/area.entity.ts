import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Regency } from './regency.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Regency)
  regency: Regency;

  @Column()
  regencyId: number;
}
