import { Routes, Route } from 'react-router-dom';

import { Profile, Ladder, Acceuil, ErrorPages, Welcomer, Home, Channel, Store, OtherProfile, UsernameLogger, Pong } from "./pages";
import { MyNavProfile, OthNavProfile, History, Friends, Collection, Achievement } from "./components";

export default function App() {
	return (
		<div className='container-page'>
			<Routes>
				<Route path='/' element={<Welcomer />} />
				<Route path='/home' element={<Home />}>
					<Route path='game' element={<Pong />} />
					<Route path='acceuil' element={<Acceuil />} />
					<Route path='ladder' element={<Ladder />} />
					<Route path='me' element={<MyNavProfile />}>
						<Route index element={<Profile />} />
						<Route path="history" element={<History />} />
						<Route path="friend" element={<Friends />} />
						<Route path="collection" element={<Collection />} />
						<Route path="achievement" element={<Achievement />} />
					</Route>
					<Route path=':id' element={<OthNavProfile />}>
						<Route index element={<OtherProfile />} />
						<Route path="history" element={<History />} />
						<Route path="achievement" element={<Achievement />} />
					</Route>
					<Route path='channel' element={<Channel />} />
					<Route path='store' element={<Store />} />
				</Route>
				<Route path='/signin' element={<UsernameLogger />} />
				<Route path='*' element={<ErrorPages mode={404} />} />
			</Routes>
		</div>
	);
}
