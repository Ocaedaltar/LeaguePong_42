import { forwardRef, Inject, Logger, UseGuards } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Channel, ChannelBan, ChannelMute, ChannelUser } from '@prisma/client';
import { hasSubscribers } from 'diagnostics_channel';
import { Server, Socket } from 'socket.io';
import { JwtGuard } from 'src/auth/guard';
import { DiscussionMessageDto } from 'src/chat/discussion-message/dto/discussion-message.dto';
import { ChannelMessageService } from './channel/channel-message/channel-message.service';
import { ChannelMessageDto } from './channel/channel-message/dto';
import { ChannelMuteService } from './channel/channel-mute/channel-mute.service';
import { ChannelUserService } from './channel/channel-user/channel-user.service';
import { DiscussionService } from './discussion/discussion.service';
import { DiscussionDto } from './discussion/dto/discussion.dto';
import { DiscussionWithUsers } from './discussion/types';

@WebSocketGateway({ cors: '*:*', namespace: 'chatNs' })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    constructor(
        @Inject(forwardRef(() => DiscussionService))
        private discService: DiscussionService,
        private channelMuteService: ChannelMuteService,
        private channelMessageService: ChannelMessageService,
        private channelUserService: ChannelUserService,
    ) { }

    @WebSocketServer() wss: Server;
    private logger: Logger = new Logger('ChatGateway');
    private clientsMap = new Map<number, Socket>();

    ////////////////////////////////
    //  INIT, CONNECT, DISCONNECT //
    ////////////////////////////////
    afterInit(server: Server) {
        this.logger.log('Initialized')
    }

    @UseGuards(JwtGuard)
    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`CLIENT ${client.id} CONNECTED`);
        this.displayClientsMap();
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`CLIENT ${client.id} DISCONNECTED`);
        for (const [id, value] of this.clientsMap) {
            if (client.id === value.id) {
                this.logger.log(`USER ${id} LOGGED OUT`);
                this.wss.emit('logoutToClient', id);
                this.clientsMap.delete(id);
                break;
            }
        }
        this.displayClientsMap();
    }

    /////////////////////////
    //  DISCUSSION METHODS //
    /////////////////////////
    joinDiscRoom(userId: number, discId: number) {
        if (this.clientsMap.has(userId)) {
            const client: Socket = this.clientsMap.get(userId);
            const roomName: string = 'disc' + discId;
            if ((roomName in client.rooms) === false) {
                this.logger.log(`USER ${userId} JOINING '${roomName}' ROOM`);
                client.join(roomName);
            }
        }
    }

    async joinAllDiscRooms(userId: number) {
        const discussions = await this.discService.getDiscussionsIds(userId);
        for (const discussion of discussions) {
            this.joinDiscRoom(userId, discussion.id);
        }
    }

    newDisc(discussion: DiscussionWithUsers) {
        const roomName: string = 'disc' + discussion.id;
        this.wss.to(roomName).emit('newDiscToClient', discussion);
    }

    //////////////////////
    //  CHANNEL METHODS //
    //////////////////////
    joinChannelRoom(userId: number, chanId: number) {
        if (this.clientsMap.has(userId)) {
            const client: Socket = this.clientsMap.get(userId);
            const roomName: string = 'chan' + chanId;
            if ((roomName in client.rooms) === false) {
                this.logger.log(`USER ${userId} JOINING '${roomName}' ROOM`);
                client.join(roomName);
            }
        }
    }

    leaveChannelRoom(userId: number, chanId: number) {
        if (this.clientsMap.has(userId)) {
            const client: Socket = this.clientsMap.get(userId);
            const roomName: string = `chan${chanId}`;
            if ((roomName in client.rooms)) {
                this.logger.log(`USER ${userId} LEAVING '${roomName}' ROOM`);
                client.leave(roomName);
            }
        }
    }

    async joinAllJoinedChannelRooms(userId: number) {
        const channelUsers: ChannelUser[] =
            await this.channelUserService.getAllJoinedChannelUsers(userId);
        for (const channelUser of channelUsers) {
            this.joinChannelRoom(userId, channelUser.chanId);
        }
    }

	// ----------------------------------------------------------------------------------------------------------------------- PROBLEME
    // TU DOIS ME REVOYER UN DTO QUI CORRESPOND A LA STRUCTURE. chanId != chanId, j'ai besoin du USER COMPLET! 
    userJoinedChannel(channelUser: any) {
        this.wss.to(`chan${channelUser.chanId}`).emit('userJoinedChannel', {
            channelUser,
        });
    }

    userLeftChannel(userId: number, chanId: number) {
        this.wss.to(`chan${chanId}`).emit('userLeaveChannel', {
            userId: userId,
            chanId: chanId,
        });
    }

    newChannelToClient( chan: Channel) {
        this.wss.emit('newChanToClient', {
            chan,
        });
    }

    addChannelToOwner( uid: number, chan: Channel ) {
        const client: Socket = this.clientsMap.get(uid)!;
        client.emit('upChanOwner', { chan });
    }


    invitedToChannel(channelUser: ChannelUser, chan: Channel) {
        if (this.clientsMap.has(channelUser.userId)) {
            const client: Socket = this.clientsMap.get(channelUser.userId);
            client.emit('invitedToChannel', {
                chan,
            });
        }
    }

    channelNameEdited(channel: Channel) {
        this.logger.log(`CHANNEL ${channel.id} NAME EDITED TO '${channel.name}'`);
        this.wss.emit('channelNameEdited', {
            chanId: channel.id,
            name: channel.name,
        });
    }

    channelTypeEdited(channel: Channel) {
        this.logger.log(`CHANNEL ${channel.id} NAME EDITED TO '${channel.name}'`);
        this.wss.emit('channelTypeEdited', {
            chanId: channel.id,
            type: channel.type,
        });
    }

    channelDeleted(channel: Channel) {
        this.logger.log(`CHANNEL ${channel.id} DELETED`);
        this.wss.to(`chan${channel.id}`).emit('channelDeleted', {
            chanId: channel.id,
        });
        this.wss.socketsLeave(`chan${channel.id}`);
    }

    channelUserRoleEdited(channelUser: ChannelUser) {
        this.wss.to(`chan${channelUser.chanId}`).emit('channelUserRoleEdited', {
            userId: channelUser.userId,
            chanId: channelUser.chanId,
            role: channelUser.role,
        });
    }

    //////////////////
    //  BAN EVENTS  //
    //////////////////

    channelUserBanned(channelBan: ChannelBan, username: string) {
        this.wss.to(`chan${channelBan.chanId}`).emit('channelUserBanned', {
            chanId: channelBan.chanId,
            userId: channelBan.userId,
            user: { username: username },
        });
    }

    channelUserUnbanned(channelBan: ChannelBan) {
        this.wss.to(`chan${channelBan.chanId}`).emit('channelUserUnbanned', {
            chanId: channelBan.chanId,
            userId: channelBan.userId,
        });
    }

    ///////////////////
    //  MUTE EVENTS  //
    ///////////////////

    channelUserMuted(channelMute: ChannelMute) {
        this.logger.log(`MUTED EVENT USER${channelMute.userId} CHAN${channelMute.chanId}`);
        this.wss.to(`chan${channelMute.chanId}`).emit('channelUserMuted', {
            chanId: channelMute.chanId,
            userId: channelMute.userId,
        });
    }

    channelUserUnmuted(channelMute: ChannelMute) {
        this.logger.log(`UNMUTED EVENT USER${channelMute.userId} CHAN${channelMute.chanId}`);
        this.wss.to(`chan${channelMute.chanId}`).emit('channelUserUnmuted', {
            chanId: channelMute.chanId,
            userId: channelMute.userId,
        });
    }

    // channelUserMuteExtended(channeMute: ChannelMute) {
    // 
    // }

    ///////////////////////////
    //  LOGIN/LOGOUT EVENTS  //
    ///////////////////////////
    @SubscribeMessage('loginToServer')
    async handleLogin(client: Socket, userId: number) {
        if (this.clientsMap.has(userId)) {
            this.logger.error(`USER ${userId} ALREADY LOGGED IN`);
            // client.disconnect(true);
            throw new WsException(`double connection`);
        }
        this.logger.log(`USER ${userId} LOGGED IN`);
        this.clientsMap.set(userId, client);
        this.displayClientsMap();
        await this.joinAllDiscRooms(userId);
        await this.joinAllJoinedChannelRooms(userId);
    }

    @SubscribeMessage('logoutToServer')
    handleLogout(
        client: Socket,
        userId: number
        ) :
    void
    {
        this.logger.log(`USER ${userId} LOGGED OUT`);
        client.broadcast.emit('logoutToClient', userId);
    }

    /////////////////////////////
    //  MESSAGE SUBSCRIPTIONS  //
    /////////////////////////////
    @SubscribeMessage('discMsgToServer')
    // @UseGuards(NotBlockedGuard)
    async handleDiscMsg(
        client: Socket,
        dto: DiscussionMessageDto):
    Promise<void>
    {
        this.logger.log(`RECEIVED\t'${dto.text.substring(0, 10)}' FROM USER ${dto.userId}`);
        const message = await this.discService.createDiscMsg(dto);
        const roomName = `disc${dto.discId}`;
        this.wss.to(roomName).emit('discMsgToClient', message);
        this.logger.log(`EMITTED\t'${dto.text.substring(0, 10)}' TO ROOM 'disc${dto.discId}'`);
    }

    @SubscribeMessage('chanMsgToServer')
    // @UseGuards(NotMutedGuard)
    async handleChanMsg(
        client: Socket,
        dto: ChannelMessageDto
    )
    {

	// ----------------------------------------------------------------------------------------------------------------------- PROBLEME
        // CA INDIQUE QUE JE SUIS MUTE DANS TOUT LES CAS! 

        // const channelMute = this.channelMuteService.findOne(dto.userId, dto.chanId);
        // if (channelMute !== null) {
        //     this.logger.log(`IN CHAN ${dto.chanId} RECEIVED MSG FROM MUTED USER ${dto.userId}`);
        //     throw new WsException('you are muted in this channel');
        // }
        this.logger.log(`IN CHAN ${dto.chanId} RECEIVED\t'${dto.text.substring(0, 10)}' FROM USER ${dto.userId}`);
        const message = await this.channelMessageService.create(dto.userId, dto.chanId, dto.text);

        this.wss.to(`chan${dto.chanId}`).emit('chanMsgToClient', message);
        this.logger.log(`EMITTED\t'${dto.text.substring(0, 10)}' TO ROOM 'chan${dto.chanId}'`);
    }

    //////////////
    //  HELPERS //
    //////////////
    displayClientsMap() {
        for (const [key, value] of this.clientsMap) {
            this.logger.log(`\tclientsMap[${key}]\t=\t${value.id}`);
        }
    }

}