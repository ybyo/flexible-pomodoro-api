import { plainToClass } from 'class-transformer';
import { ulid } from 'ulid';

export interface ITimer {
  readonly fragId: string;
  name: string;
  color: string;
  duration: number; // dayjs
  count: number;
  order: number;
  isEditing: boolean;
}

export interface IStacksToFrag {
  stacksToFragId: string | null;
  order: number;
  frag: ITimer;
}

export class Timer implements ITimer {
  readonly fragId: string;
  name: string;
  color: string;
  duration: number; // dayjs
  count: number;
  order: number;
  isEditing: boolean;

  constructor(timer: Partial<Timer>) {
    if (timer) {
      Object.assign(
        this,
        plainToClass(Timer, timer, {
          excludeExtraneousValues: false,
        })
      );
      this.fragId = timer.fragId || ulid();
      this.name = timer.name || 'New';
      this.color = timer.color || '000000';
      this.duration = timer.duration || 0;
      this.count = timer.count || 0;
      this.order = timer.order || 86400;
      this.isEditing = timer.isEditing || false;
    }
  }

  // get id(): Readonly<string> {
  //   return this._id;
  // }
  //
  // get name(): Readonly<string> {
  //   return this._name;
  // }
  //
  // set name(newName: string) {
  //   this._name = newName;
  // }
  //
  // get duration(): Readonly<number> {
  //   return this._duration;
  // }
  //
  // set duration(newDuration: number) {
  //   this._duration = newDuration;
  // }
  //
  // get color(): Readonly<string> {
  //   return this._color;
  // }
  //
  // set color(newColor: string) {
  //   this._color = newColor;
  // }
  //
  // get count(): Readonly<number> {
  //   return this._count;
  // }
  //
  // set count(newCount: number) {
  //   this._count = newCount;
  // }
  //
  // get isEditing(): Readonly<boolean> {
  //   return this._isEditing;
  // }
  //
  // set isEditing(newValue: boolean) {
  //   this._isEditing = newValue;
  // }
}
