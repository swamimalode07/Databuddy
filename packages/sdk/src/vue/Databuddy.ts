import { createScript, isScriptInjected } from "@/core";
import { detectClientId } from "@/utils";
import {
	defineComponent,
	onMounted,
	onUnmounted,
	type PropType,
	ref,
	watch,
} from "vue";

const optionalBoolean = {
	type: Boolean,
	required: false,
	default: undefined,
} as const;

export const Databuddy = defineComponent({
	props: {
		apiUrl: { type: String, required: false },
		batchSize: { type: Number, required: false },
		batchTimeout: { type: Number, required: false },
		clientId: { type: String, required: false },
		clientSecret: { type: String, required: false },
		debug: optionalBoolean,
		disabled: optionalBoolean,
		enableBatching: optionalBoolean,
		enableRetries: optionalBoolean,
		filter: {
			type: Function as PropType<(event: unknown) => boolean>,
			required: false,
		},
		ignoreBotDetection: optionalBoolean,
		initialRetryDelay: { type: Number, required: false },
		maskPatterns: { type: Array as PropType<string[]>, required: false },
		maxRetries: { type: Number, required: false },
		samplingRate: { type: Number, required: false },
		scriptUrl: { type: String, required: false },
		sdk: { type: String, required: false },
		sdkVersion: { type: String, required: false },
		skipPatterns: { type: Array as PropType<string[]>, required: false },
		trackAttributes: optionalBoolean,
		trackErrors: optionalBoolean,
		trackHashChanges: optionalBoolean,
		trackInteractions: optionalBoolean,
		trackOutgoingLinks: optionalBoolean,
		trackPerformance: optionalBoolean,
		trackWebVitals: optionalBoolean,
		usePixel: optionalBoolean,
	},
	setup(props) {
		const scriptRef = ref<HTMLScriptElement | null>(null);

		const injectScript = () => {
			const clientId = detectClientId(props.clientId);
			if (!clientId || props.disabled || isScriptInjected()) {
				return;
			}

			const script = createScript({ ...props, clientId });

			document.head.appendChild(script);
			scriptRef.value = script;
		};

		const removeScript = () => {
			if (scriptRef.value) {
				scriptRef.value.remove();
				scriptRef.value = null;
			}
		};

		onMounted(() => {
			injectScript();
		});

		onUnmounted(() => {
			removeScript();
		});

		watch(
			() => props,
			() => {
				removeScript();
				injectScript();
			},
			{ deep: true }
		);

		return () => null;
	},
});
