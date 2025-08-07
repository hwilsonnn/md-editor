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
	TRANSFORMERS,
	ELEMENT_TRANSFORMERS,
	CODE
} from "@lexical/markdown"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { $getRoot, $getSelection } from "lexical"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"

import "./Editor.css"
import CodeHighlightPrismPlugin from "./Plugins/CodeHighlightPrismPlugin"
import PlaygroundEditorTheme from "./PlaygroundEditorTheme"

const theme = {
	// Theme styling goes here
	//...
	...PlaygroundEditorTheme,
	paragraph: "editor-paragraph"
}

function onChange(editorState) {
	editorState.read(() => {
		// Read the contents of the EditorState here.
		const root = $getRoot()
		const selection = $getSelection()

		console.log(root, selection)
	})
}

const Editor = () => {
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
		<LexicalComposer initialConfig={initialConfig}>
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
		</LexicalComposer>
	)
}

export default Editor
