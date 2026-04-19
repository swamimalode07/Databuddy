import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";

export function resolveComposableRender<RenderProp>(
	children: ReactNode,
	render?: RenderProp
) {
	if (render) {
		return {
			children,
			render,
		};
	}

	if (Children.count(children) !== 1 || !isValidElement(children)) {
		return {
			children,
			render: undefined,
		};
	}

	if (children.type === Fragment) {
		return {
			children,
			render: undefined,
		};
	}

	return {
		children: undefined,
		render: children as ReactElement<Record<string, unknown>>,
	};
}
