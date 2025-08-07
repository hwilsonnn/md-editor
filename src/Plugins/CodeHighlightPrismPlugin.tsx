import { registerCodeHighlighting } from "@lexical/code"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"
import type { JSX } from "react"

export default function CodeHighlightPrismPlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		console.log("called>")
		return registerCodeHighlighting(editor)
	}, [editor])

	return null
}
