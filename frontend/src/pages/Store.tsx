import React from "react"

export function Store() {
	return (
		<div>
			<h1>STORE PAGES</h1>
			<p>En raison d'un écoulement trop rapide des jours de BlackHole, nous sommes dans le regret de vous annoncer que la boutique n'aura pas pu voir le jour pour le rendu final. Nous nous excusons pour la gene occasionnée. Tu peux quand meme rentrer tes coordonnées bancaire si tu le souhaites.</p>
			<br />
			<div>
				Numéro de carte bleue
				<p>
					<input type="text" placeholder="XXXX - XXXX - XXXX - XXXX" />
				</p>
			</div>
			<br />
			<div>
				<p>
					Cryptogramme visuel
				</p>
				<input type="text" placeholder="XXX" />
			</div>
			<br />
			<div>
				<p>
					Date d'expiration
				</p>
				<input type="text" placeholder="xx/xx" />
			</div>
		</div >
	)
}