import { atom } from "jotai";

export interface AgentCommand {
	command: string;
	description: string;
	id: string;
	keywords: string[];
	title: string;
}

export const agentInputAtom = atom("");
export const showCommandsAtom = atom(false);
