import { NavLink, useLocation } from "react-router-dom";
import { useContext, useState } from 'react';
import { useEffect } from 'react';
import { IUser } from "../types";
import { AxiosJwt } from "../hooks/AxiosJwt";
import '../styles/components/Navbar.css'
import { SocketContext } from '../context/UserSocket/Socket';

export function Navbar() {

	const { socket , me, disable} = useContext(SocketContext).SocketState;
	const request = AxiosJwt();
	const [toggleMenu, setToggleMenu] = useState(false);
	const [largeur, setLargeur] = useState(window.innerWidth);
	const [toggleStatus, setToggleStatus] = useState(true);

	const toggleNavResponsive = () => {
		setToggleMenu(!toggleMenu);
	}

	const toggleUserStatus = () => {
		setToggleStatus(!toggleStatus);
		socket!.emit('ChangeStatusToServer', { userId: me.id, status: (toggleStatus ? 1 : 0) })
	}

	useEffect(() => {
		const changeWidth = () => {
			setLargeur(window.innerWidth);
			if (window.innerWidth > 700) {
				setToggleMenu(false);
			}
		}

		window.addEventListener('resize', changeWidth);
		return () => {
			window.removeEventListener('resize', changeWidth);
		}
	}, [])

	const location = useLocation();

	const { pathname } = location;

	const splitLocation = pathname.split("/");

	return (
		<div className={disable ? 'disabled-nav' :  "navbar"}>
			<ul className="nav_links">
				<li className="play">
					<NavLink to='/home/game'>
						<div className="play_div">
							<button className="play_btn">
								Play
							</button>
						</div>
					</NavLink>
				</li>
				<li className={pathname === "/home/accueil" ? "items_active" : "items"} id='home'>
					<NavLink to='/home/acceuil'>
						home
					</NavLink>
				</li>
				<li className={splitLocation[1] === "/me" ? "items_active" : "items"} id='profile'>
					<NavLink to='/home/me'>
						profile
					</NavLink>
				</li>
				<div className="EB-logo">
					<div className="EB-amount">
						{me.ranking}
					</div>
				</div>
				<li className={splitLocation[1] === "" ? "items_active" : "items"} id='ladder'>
					<NavLink to='/home/ladder'>
						Ladder
					</NavLink>
				</li>
				<li className={splitLocation[1] === "" ? "items_active" : "items"} id='channel'>
					<NavLink to='/home/channel'>
						Channels
					</NavLink>
				</li>
				<li className={splitLocation[1] === "" ? "items_active" : "items"} id='store'>
					<NavLink to='/home/store'>
						Store
					</NavLink>
				</li>
				<div className="nav_user">
					<div className="avatar">
						<img src={me.avatarUrl} className="user_icon">
						</img>
					</div>
					<div className="nav_user_info">
						<div className="nickname">
							{me.username}
						</div>
						<div className={toggleStatus === true ? "online" : "absent"}>
							<button onClick={toggleUserStatus} className={toggleStatus === true ? "btn_online" : "btn_abs"}>
								◉
							</button>
							{toggleStatus === true ? 'online' : "absent"}
						</div>
					</div>
				</div>
			</ul>
		</div>


	);
}