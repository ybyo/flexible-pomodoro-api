import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveStacksCommand } from '@/stacks/application/command/impl/remove-stacks.command';
import { StacksRepository } from '@/stacks/infra/db/repository/stacks.repository';

@Injectable()
@CommandHandler(RemoveStacksCommand)
export class RemoveStacksHandler
  implements ICommandHandler<RemoveStacksCommand>
{
  constructor(
    @Inject('StacksRepository')
    private stacksRepository: StacksRepository,
  ) {}

  async execute(command: RemoveStacksCommand) {
    const { id } = command;

    const result = await this.stacksRepository.removeStack(id);

    return result;
  }
}
