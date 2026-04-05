import { BugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { CodeIcon } from "@phosphor-icons/react/dist/ssr/Code";
import { FileCodeIcon } from "@phosphor-icons/react/dist/ssr/FileCode";
import { LaptopIcon } from "@phosphor-icons/react/dist/ssr/Laptop";
import { MonitorIcon } from "@phosphor-icons/react/dist/ssr/Monitor";
import { NetworkIcon } from "@phosphor-icons/react/dist/ssr/Network";
import { PhoneIcon } from "@phosphor-icons/react/dist/ssr/Phone";
import { TableIcon } from "@phosphor-icons/react/dist/ssr/Table";
import { TerminalIcon } from "@phosphor-icons/react/dist/ssr/Terminal";

export const getErrorTypeIcon = (type: string) => {
	if (!type) {
		return <BugIcon className="size-3.5 text-primary" weight="duotone" />;
	}

	const lowerType = type.toLowerCase();
	if (lowerType.includes("react")) {
		return <CodeIcon className="size-3.5 text-primary" weight="duotone" />;
	}
	if (lowerType.includes("network")) {
		return <NetworkIcon className="size-3.5 text-primary" weight="duotone" />;
	}
	if (lowerType.includes("script")) {
		return <FileCodeIcon className="size-3.5 text-primary" weight="duotone" />;
	}
	if (lowerType.includes("syntax")) {
		return <TerminalIcon className="size-3.5 text-primary" weight="duotone" />;
	}
	return <BugIcon className="size-3.5 text-primary" weight="duotone" />;
};

// Get device icon
export const getDeviceIcon = (deviceType: string) => {
	if (!deviceType) {
		return <MonitorIcon className="size-3.5 text-chart-2" weight="duotone" />;
	}

	switch (deviceType.toLowerCase()) {
		case "mobile":
			return <PhoneIcon className="size-3.5 text-chart-2" weight="duotone" />;
		case "tablet":
			return <TableIcon className="size-3.5 text-chart-2" weight="duotone" />;
		case "desktop":
			return <LaptopIcon className="size-3.5 text-chart-2" weight="duotone" />;
		default:
			return <MonitorIcon className="size-3.5 text-chart-2" weight="duotone" />;
	}
};
