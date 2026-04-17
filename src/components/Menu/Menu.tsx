import { useState, useRef, useEffect } from "react"
import "./Menu.css"

interface MenuItem {
	label: string
	icon: string
	onClick: () => void
}

interface MenuProps {
	items: MenuItem[]
	wordCount: number
}

const Menu = ({ items, wordCount }: MenuProps) => {
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false)
		}
		window.addEventListener("keydown", handleKey)
		return () => window.removeEventListener("keydown", handleKey)
	}, [open])

	return (
		<div className="menu-wrapper" ref={menuRef}>
			<button
				className="menu-button"
				onClick={() => setOpen(!open)}
				title="Menu"
			>
				⋮
			</button>
			{open && (
				<>
					<div className="menu-overlay" onClick={() => setOpen(false)} />
					<div className="menu-dropdown">
						{items.map((item, i) => (
							<button
								key={i}
								className="menu-item"
								onClick={() => {
									item.onClick()
									setOpen(false)
								}}
							>
								<span>{item.icon}</span>
								<span>{item.label}</span>
							</button>
						))}
						<div className="menu-divider" />
						<div className="menu-label">{wordCount} words</div>
					</div>
				</>
			)}
		</div>
	)
}

export default Menu
