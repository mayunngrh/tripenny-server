import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable, ManyToOne } from 'typeorm';
import { Tag } from './tag.entity';
import { Regency } from './regency.entity';
import { ExtraExpense } from './extra-expense.entity';

@Entity('places')
export class Place {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rating!: number;

  @Column({ nullable: true })
  totalRatings!: number;

  @Column({ nullable: true })
  priceLevel!: number;

  @Column({ nullable: true })
  price!: number;

  @Column({ nullable: true })
  parkingFee!: number;

  @Column({ nullable: true })
  isOpenNow!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude!: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude!: number;

  @Column({ nullable: true })
  placeId!: string;

  @Column({ nullable: true })
  photoReference!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  district!: string;

  @ManyToOne(() => Regency, (regency) => regency.places, { nullable: true })
  regency!: Regency | null;

  @Column({ nullable: true })
  province!: string;

  @ManyToMany(() => Tag, (tag) => tag.places)
  @JoinTable()
  tags!: Tag[];

  @OneToMany(() => ExtraExpense, (expense) => expense.place, { eager: true, cascade: true })
  extraExpenses!: ExtraExpense[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
