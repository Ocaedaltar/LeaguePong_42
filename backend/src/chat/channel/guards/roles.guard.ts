import { Injectable, CanActivate, ExecutionContext, NotFoundException, Logger, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IsNumber, isNumber } from 'class-validator';
import { ChannelUserService } from '../channel-user/channel-user.service';
import { EChannelRoles } from '../channel-user/types';

@Injectable()
export class ChannelRolesGuard implements CanActivate {

    constructor(
        private reflector: Reflector,
        private channelUserService: ChannelUserService,
    ) { }

    async canActivate(context: ExecutionContext)
        : Promise<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId = request.user['id'];
        const chanId = Number(request.params.chanId);
        if (Number.isInteger(chanId) === false)
            throw new BadRequestException(':chanId must be an integer');

        const channelUser = await this.channelUserService.findOne(userId, chanId);

        if (channelUser === null)
            throw new NotFoundException('user or channel not found');
        if (roles[0] === 'admin') {
            return (channelUser.role === EChannelRoles.ADMIN || channelUser.role === EChannelRoles.OWNER);
        }
        if (roles[0] === 'owner') {
            return (channelUser.role === EChannelRoles.OWNER);
        }

        return false;
    }
}
