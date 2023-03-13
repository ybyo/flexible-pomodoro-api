import { Timer } from '@/timer/domain/timer.model';
import { plainToClass } from 'class-transformer';

export class Stacks {
  id: string;
  name: string;
  count: number;
  data: Timer[];
  isEditing: boolean;

  constructor(stacks: Partial<Stacks>) {
    if (stacks) {
      Object.assign(
        this,
        plainToClass(Stacks, stacks, {
          excludeExtraneousValues: false,
        }),
      );
    }
  }

  // get id(): string {
  //   return this._id;
  // }
  //
  // set id(value: string) {
  //   this._id = value;
  // }
  //
  // get name(): string {
  //   return this._name;
  // }
  //
  // set name(value: string) {
  //   this._name = value;
  // }
  //
  // get count(): number {
  //   return this._count;
  // }
  //
  // set count(value: number) {
  //   this._count = value;
  // }
  //
  // get data(): Frag[] {
  //   return this._data;
  // }
  //
  // set data(value: Frag[]) {
  //   this._data = value;
  // }
  //
  // get isEditing(): boolean {
  //   return this._isEditing;
  // }
  //
  // set isEditing(value: boolean) {
  //   this._isEditing = value;
  // }
}
