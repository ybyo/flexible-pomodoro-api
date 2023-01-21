import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IStacksRepository } from '@/stacks/domain/istacks.repository';
import { GetStacksCommand } from '@/stacks/application/command/impl/get-stacks.command';

@Injectable()
@CommandHandler(GetStacksCommand)
export class GetStacksHandler implements ICommandHandler<GetStacksCommand> {
  constructor(
    @Inject('StacksRepository')
    private stacksRepository: IStacksRepository,
  ) {}
  async execute(command: GetStacksCommand) {
    const { id } = command;

    const stacks = await this.stacksRepository.fetchStack(id);

    return stacks;
  }
}
