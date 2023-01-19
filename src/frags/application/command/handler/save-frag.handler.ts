import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IFragRepository } from '@/frags/domain/ifrag.repository';
import { SaveFragCommand } from '@/frags/application/command/impl/save-frag.command';

@Injectable()
@CommandHandler(SaveFragCommand)
export class SaveFragHandler implements ICommandHandler<SaveFragCommand> {
  constructor(
    @Inject('FragRepository')
    private fragRepository: IFragRepository,
  ) {}
  async execute(command: SaveFragCommand) {
    const { id, frags } = command;

    return await this.fragRepository.saveFrag(id, frags);
  }
}
