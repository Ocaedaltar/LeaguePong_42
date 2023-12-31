// Extern:
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Intern:
import { ChatSocketContext, EChatSocketActionType, SocketContext } from "../../context";
import { AxiosJwt } from "../../hooks";

// Assets:
import "../../styles/components/discussion_components/ChatOptionMenu.css"
import { IUser } from "../../types";

const ListChanAdmin = ({ user }:ChatOptionMenuProps) => {
	const { me, channels } = useContext(ChatSocketContext).ChatSocketState;
	const axios = AxiosJwt();
	const myChan = channels.filter((chan) =>  chan.users.find(user =>  user.userId == me.id &&  user.role < 2 ) != undefined )

	const inviteChannel = ( chanId: number ) => {
		axios.post('/channel/' + chanId + '/user/' + user.id )
	}

	return (
		<div>
			{ myChan.map( (chan, index) => {
				return (
					<div key={index} className="disc-btn-pannel" onClick={() => inviteChannel( chan.id )}>
						<p>{chan.name}</p>
					</div>
				)
			}) }
		</div>
	)
}	
interface ChatOptionMenuProps { user: IUser }
const ChatOptionMenu = ({ user }:ChatOptionMenuProps ) => {

	const { users } = useContext(SocketContext).SocketState;
	const navigate = useNavigate();
	const [ displayChan, setDisplayChan ] = useState<boolean>(false);
	const axios = AxiosJwt();

	const status = users.find(( elem => elem.userId == user.id ))?.status;
	if (status == undefined ) status == 4;

	const watchGameLogic = () => {
		axios.get('/lobby/spec/' + user.id)
		.then(() => navigate('/home/game'));
	}

	const inviteGameLogic = () => {
		axios.post("/lobby/inviteGame/" + user.id)
		.then(() => navigate('/home/game'));
	}

	return (
		<div className="Chat-Option-Menu">
			<div className="div1" onClick={() => navigate('/home/' + user.id )}>Profile</div>
			<div className="div1" onClick={() => setDisplayChan(!displayChan)}>Invite Channel</div>
			{ displayChan ? <ListChanAdmin user={user} /> : <></>}
			{ status == 0 ? <div className="div1" onClick={() => inviteGameLogic()}>Invite Game</div> :
			  status == 3 ? <div className="div1" onClick={() => watchGameLogic()}>Watch Game</div> :
			<></> }
		</div>
	);
}

interface ChatOptionProps { user: IUser, mod?: boolean };
export const ChatOption = ({ user, mod }:ChatOptionProps) => {
	const dispatch = useContext(ChatSocketContext).ChatSocketDispatch;
	const { index_active } = useContext(ChatSocketContext).ChatSocketState;
	function reduceChat() { dispatch({ type: EChatSocketActionType.DISPLAY, payload: false })}

	useEffect(() => {
		setDisplay(false);
	}, [index_active])

	const [ display, setDisplay ] = useState<boolean>(false)

	return (
		<div className='messages-options'>
			<button id='btn-messages-reduction' onClick={() => reduceChat()} />
			<button id={ mod ? 'btn-messages-panel' : "btn-messages-panel-disable" } onClick={() => {if (mod) { setDisplay(!display)}} } />
			{ display ? <ChatOptionMenu user={user}/> : <></> }
			<></>
		</div>
	)
}