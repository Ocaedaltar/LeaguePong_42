// Extern:
import { PropsWithChildren, useContext, useEffect, useState } from "react";

// Intern:
import { Contact } from ".";
import { IChannel, IUser } from "../../types";
import { ChatSocketContext, EChatSocketActionType, SocketContext } from "../../context";
import { UserCreateChat } from "../discussion_components";

// Assets:
import '../../styles/components/friendsbar_components/FriendsList.css'
import { AxiosJwt } from "../../hooks";
import { AxiosResponse } from "axios";

interface UserListCategorieProps { users: IUser[], title: string, counter: boolean };
const UserListCategorie: React.FunctionComponent<UserListCategorieProps> = ({ users, title, counter }) => {

	const [active, setActive] = useState<boolean>(true);
	const activeCategorie = () => { setActive(!active) };

	return (
		<div>
			<div id='title-container' onClick={() => activeCategorie()}>
				<div id={'triangle-categories' + (active ? '-active' : '')} />
				<p id="title-categories">{title}</p>
				<p id="title-categories">{(counter ? " (" + users.length + ")" : "")}</p>
			</div>
			{active ? users.map((user, index) => {
				return (
					<UserCreateChat key={index} user={user}>
						<Contact user={user} />
					</UserCreateChat>
				)
			}) : <></>}
		</div>
	);
}

export interface ChannelLinkProps extends PropsWithChildren { index: number }
export const ChannelLink: React.FunctionComponent<ChannelLinkProps> = ({ children, index }) => {
	const { index_channel, channel_display } = useContext(ChatSocketContext).ChatSocketState;
	const dispatch = useContext(ChatSocketContext).ChatSocketDispatch;
	const UpDateActiveDiscusion = () => {
		if (index_channel != index) {dispatch({ type: EChatSocketActionType.UP_I_CHAN, payload: index });}
		if (!channel_display ) {dispatch({ type: EChatSocketActionType.DISPLAY_CHAN, payload: true });}
	}
	return (
		<div onClick={() => { UpDateActiveDiscusion() }}>
			{ children }
		</div>
	)
}

export interface ChannelListElemProps { chan: IChannel }
export function ChannelListElem({ chan }:ChannelListElemProps) {

	return (
		<div className="channel-list-elem">
			<p>{chan.name}</p>
		</div>
	)
}


export const ChannelListCategorie: React.FunctionComponent = () => {
	const {channels } = useContext(ChatSocketContext).ChatSocketState;
	const [active, setActive] = useState<boolean>(true);
	const activeCategorie = () => { setActive(!active) };

	return (
		<div>
			<div id='title-container' onClick={() => activeCategorie()}>
				<div id={'triangle-categories' + (active ? '-active' : '')} />
				<p id="title-categories">CHANNELS</p>
			</div>
			{active ? channels.map((chan, index) => {
				return (
					<ChannelLink key={index} index={index}>
						<ChannelListElem chan={chan} />
					</ChannelLink>
				)
			}) : <></>}
		</div>
	);
}

export function othUserChat() {
	const { me, allDiscussions } = useContext(ChatSocketContext).ChatSocketState;
	const { friends, blocks } = useContext(SocketContext).SocketState;
	let othUser: IUser[] = [];
	const discTab = allDiscussions;
	for (const disc of discTab) {
		if (disc.user1Id != me.id && !friends.filter( friend => {return friend.id == disc.user1Id}).length ) {
			othUser.push( disc.user1 );
		} else if (disc.user2Id != me.id && !friends.filter( friend => {return friend.id == disc.user2Id}).length ) {
			othUser.push( disc.user2 );
		}
	}
	return othUser.filter( (user ) => { return (blocks.findIndex(( boug ) => {return boug.id == user.id}) == -1 )} );
}

export function FriendsList() {
	const { users, friends } = useContext(SocketContext).SocketState;

	const userOnline = () => {
		return friends.filter((friend) => {
			if (users.find((user) => { return user.userId == friend.id })?.status != undefined)
				return friend;
		})
	}

	const userOffline = () => {
		return friends.filter((friend) => {
			if (users.find((user) => { return user.userId == friend.id })?.status == undefined)
				return friend;
		})
	}
	
	return (
		<ul id='contact-list'>
			<ChannelListCategorie />
			<UserListCategorie users={userOnline()} title="ONLINE" counter={true} />
			<UserListCategorie users={userOffline()} title="OFFLINE" counter={true} />
			<UserListCategorie users={othUserChat()} title="OTHER" counter={true} />
		</ul>
	)
}

