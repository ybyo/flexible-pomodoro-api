import { plainToClass } from 'class-transformer';
import { IRoutineToTimer } from 'src/core/timers/domain/timer.model';
import { ulid } from 'ulid';

export interface IRoutine {
  id: string;
  name: string;
  count: number;
  routineToTimer: IRoutineToTimer[];
  isEditing: boolean;
}

export class Routine implements IRoutine {
  id: string;
  name: string;
  count: number;
  routineToTimer: IRoutineToTimer[];
  isEditing: boolean;

  constructor(routine: Partial<Routine>) {
    if (routine) {
      Object.assign(
        this,
        plainToClass(Routine, routine, {
          excludeExtraneousValues: false,
        })
      );
      this.id = routine.id || ulid();
      this.name = routine.name || 'Routine';
      this.count = routine.count || 0;
      this.routineToTimer = routine.routineToTimer || [];
      this.isEditing = routine.isEditing || false;
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
  // get count(): Readonly<number> {
  //   return this._count;
  // }
  //
  // set count(newCount: number) {
  //   this._count = newCount;
  // }
  //
  // get timers(): ITimer[] {
  //   return this._timers;
  // }
  //
  // set timers(newTimers: ITimer[]) {
  //   this._timers = newTimers;
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
