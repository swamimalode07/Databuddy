import { useAtom, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { useChat } from "@/contexts/chat-context";
import type { AgentCommand } from "../agent-atoms";
import { agentInputAtom, showCommandsAtom } from "../agent-atoms";
import { filterCommands } from "../agent-commands";

export function useAgentCommands() {
	const setInput = useSetAtom(agentInputAtom);
	const [showCommands, setShowCommands] = useAtom(showCommandsAtom);
	const [localQuery, setLocalQuery] = useState("");
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const { sendMessage } = useChat();

	const filteredCommands = useMemo(
		() => filterCommands(localQuery),
		[localQuery]
	);

	const hideCommands = useCallback(() => {
		setShowCommands(false);
		setLocalQuery("");
		inputRef.current?.focus();
	}, [setShowCommands]);

	const handleInputChange = useCallback(
		(value: string, cursorPosition: number) => {
			setInput(value);

			const textBeforeCursor = value.slice(0, cursorPosition);
			const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
			const isSlashAtStart = lastSlashIndex === 0;

			if (lastSlashIndex !== -1 && isSlashAtStart) {
				const query = textBeforeCursor.slice(lastSlashIndex + 1);
				setLocalQuery(query);
				setShowCommands(true);
			} else {
				hideCommands();
			}
		},
		[setInput, setShowCommands, hideCommands]
	);

	const executeCommand = useCallback(
		(command: AgentCommand) => {
			sendMessage({ text: command.title });
			setInput("");
			hideCommands();
		},
		[sendMessage, setInput, hideCommands]
	);

	const closeCommands = useCallback(() => {
		hideCommands();
	}, [hideCommands]);

	return {
		inputRef,
		showCommands,
		filteredCommands,
		handleInputChange,
		executeCommand,
		closeCommands,
	};
}
