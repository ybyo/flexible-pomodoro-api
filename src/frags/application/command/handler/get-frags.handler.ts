import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetFragsCommand } from '@/frags/application/command/impl/get-frags.command';
import { IFragRepository } from '@/frags/domain/ifrag.repository';

@Injectable()
@CommandHandler(GetFragsCommand)
export class GetFragsHandler implements ICommandHandler<GetFragsCommand> {
  constructor(
    @Inject('FragRepository')
    private fragRepository: IFragRepository,
  ) {}
  async execute(command: GetFragsCommand) {
    const { id } = command;

    const frags = await this.fragRepository.fetchFrag(id);

    return frags;
  }
}
