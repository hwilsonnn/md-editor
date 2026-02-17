import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import {
	LexicalComposer,
	type InitialConfigType
} from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	TRANSFORMERS,
	ELEMENT_TRANSFORMERS,
	CODE
} from "@lexical/markdown"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { type EditorState, type LexicalEditor, $getRoot, $getSelection } from "lexical"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useCallback, useEffect, useState, type DragEvent } from "react"

import "./Editor.css"
import CodeHighlightPrismPlugin from "./Plugins/CodeHighlightPrismPlugin"
import PlaygroundEditorTheme from "./PlaygroundEditorTheme"
import { downloadMarkdownFile, handleFileDrop } from "./utils/fileHandlers"

const theme = {
	// Theme styling goes here
	//...
	...PlaygroundEditorTheme,
	paragraph: "editor-paragraph"
}

function onChange(editorState: EditorState) {
	editorState.read(() => {
		// Read the contents of the EditorState here.
		const root = $getRoot()
		const selection = $getSelection()

		console.log(root, selection)
	})
}

const EditorToolbar = () => {
	const [editor] = useLexicalComposerContext()

	const handleDownload = useCallback(() => {
		editor.read(() => {
			const markdown = $convertToMarkdownString(TRANSFORMERS)
			downloadMarkdownFile(markdown)
		})
	}, [editor])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault()
				handleDownload()
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [handleDownload])

	return (
		<div className="editor-toolbar">
			<button onClick={handleDownload} title="Download (Ctrl+S)">
				⬇ Download
			</button>
		</div>
	)
}

const Editor = () => {
	const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(null)
	const [isDragging, setIsDragging] = useState(false)

	const handleDragOver = useCallback(
		(e: DragEvent<HTMLDivElement>, dragging: boolean) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(dragging)
		},
		[]
	)

	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setIsDragging(false)

			handleFileDrop(e.dataTransfer.files, (content) => {
				editorInstance?.update(() => {
					const root = $getRoot()
					root.clear()
					$convertFromMarkdownString(content, TRANSFORMERS)
				})
			})
		},
		[editorInstance]
	)

	const initialConfig = {
		namespace: "MyEditor",
		theme,
		onError: console.log,
		nodes: [
			HorizontalRuleNode,
			HeadingNode,
			QuoteNode,
			ListNode,
			ListItemNode,
			CodeNode,
			CodeHighlightNode,
			LinkNode
		],
		editorState: () => $convertFromMarkdownString("", TRANSFORMERS)
	} satisfies InitialConfigType

	return (
		<div
			className={`editor-wrapper ${isDragging ? "dragging" : ""}`}
			onDragOver={(e) => handleDragOver(e, true)}
			onDragLeave={(e) => handleDragOver(e, false)}
			onDrop={handleDrop}
		>
			<LexicalComposer initialConfig={initialConfig}>
				<EditorContent setEditor={setEditorInstance} />
				<EditorToolbar />
			</LexicalComposer>
		</div>
	)
}

const EditorContent = ({ setEditor }: { setEditor: (editor: LexicalEditor) => void }) => {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		setEditor(editor)
	}, [editor, setEditor])

	return (
		<>
			<RichTextPlugin
				contentEditable={<ContentEditable />}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<OnChangePlugin onChange={onChange} />
			<HistoryPlugin />
			<AutoFocusPlugin />
			<MarkdownShortcutPlugin
				transformers={[...TRANSFORMERS, ...ELEMENT_TRANSFORMERS, CODE]}
			/>
			<CodeHighlightPrismPlugin />
		</>
	)
}

export default Editor
