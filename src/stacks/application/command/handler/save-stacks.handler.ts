import { Inject, Injectable } from '@nestjs/common';
import { SaveStacksCommand } from '@/stacks/application/command/impl/save-stacks.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IStacksRepository } from '@/stacks/domain/istacks.repository';

@Injectable()
@CommandHandler(SaveStacksCommand)
export class SaveStacksHandler implements ICommandHandler<SaveStacksCommand> {
  constructor(
    @Inject('StacksRepository')
    private stacksRepository: IStacksRepository,
  ) {}
  async execute(command: SaveStacksCommand) {
    const { id, stacks } = command;

    return await this.stacksRepository.saveStack(id, stacks);
  }
}
