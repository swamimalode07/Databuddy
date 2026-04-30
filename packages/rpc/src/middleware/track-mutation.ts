type TrackFn = (
	name: string,
	opts: {
		namespace: string;
		sessionId?: string | null;
		anonymousId?: string | null;
		properties?: Record<string, unknown>;
	}
) => void;

let _trackFn: TrackFn | null = null;
let _trackProperties: Record<string, unknown> | null = null;

export function setTrackingFn(fn: TrackFn) {
	_trackFn = fn;
}

export function setTrackProperties(props: Record<string, unknown>) {
	_trackProperties = props;
}

function getAndClearTrackProperties(): Record<string, unknown> | null {
	const props = _trackProperties;
	_trackProperties = null;
	return props;
}

const NAME_OVERRIDES: Record<string, string> = {
	"uptime.createSchedule": "monitor_created",
	"uptime.updateSchedule": "monitor_updated",
	"uptime.deleteSchedule": "monitor_deleted",
	"uptime.togglePause": "monitor_toggled_pause",
	"uptime.pauseSchedule": "monitor_paused",
	"uptime.resumeSchedule": "monitor_resumed",
	"uptime.manualCheck": "monitor_checked",
	"uptime.transfer": "monitor_transferred",
	"statusPage.createIncident": "incident_created",
	"statusPage.updateIncident": "incident_updated",
	"statusPage.deleteIncident": "incident_deleted",
	"statusPage.addMonitor": "status_page_monitor_added",
	"statusPage.removeMonitor": "status_page_monitor_removed",
	"statusPage.updateMonitorSettings": "status_page_monitor_updated",
	"linkFolders.create": "link_folder_created",
	"linkFolders.update": "link_folder_updated",
	"linkFolders.delete": "link_folder_deleted",
	"targetGroups.create": "target_group_created",
	"targetGroups.update": "target_group_updated",
	"targetGroups.delete": "target_group_deleted",
	"agentChats.rename": "agent_chat_renamed",
	"agentChats.delete": "agent_chat_deleted",
	"apikeys.create": "api_key_created",
	"apikeys.update": "api_key_updated",
	"apikeys.revoke": "api_key_revoked",
	"apikeys.rotate": "api_key_rotated",
	"apikeys.delete": "api_key_deleted",
	"featureInvite.generateLinks": "invite_links_generated",
	"featureInvite.revokeLink": "invite_link_revoked",
	"featureInvite.redeemLink": "invite_link_redeemed",
	"organizations.updateAvatarSeed": "org_avatar_updated",
	"organizations.clearExpiredInvitations": "expired_invitations_cleared",
	"preferences.updateUserPreferences": "preferences_updated",
	"billing.setAutoTopup": "auto_topup_set",
	"billing.setUsageAlert": "usage_alert_set",
	"billing.setSpendLimit": "spend_limit_set",
	"feedback.submit": "feedback_submitted",
	"feedback.redeemCredits": "credits_redeemed",
};

function deriveEventName(path: string): string {
	if (NAME_OVERRIDES[path]) {
		return NAME_OVERRIDES[path];
	}

	const [router, method] = path.split(".");
	if (!router || !method) return path;

	const singular = router.replace(/s$/, "");

	const verb = method
		.replace(/^(create|add)$/, "created")
		.replace(/^(update|edit)$/, "updated")
		.replace(/^(delete|remove)$/, "deleted")
		.replace(/^toggle(.+)$/, (_, flag) => `toggled_${toSnakeCase(flag)}`)
		.replace(/^(revoke)$/, "revoked")
		.replace(/^(transfer)$/, "transferred")
		.replace(/^(rotate)$/, "rotated")
		.replace(/^(test)$/, "tested")
		.replace(/^(rename)$/, "renamed");

	return `${toSnakeCase(singular)}_${verb}`;
}

function toSnakeCase(str: string): string {
	return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function deriveNamespace(path: string): string {
	return toSnakeCase(path.split(".")[0] ?? path);
}

export function fireTrackingEvent(
	path: string,
	context: { anonymousId?: string | null; sessionId?: string | null }
) {
	if (!_trackFn) return;

	const eventName = deriveEventName(path);
	const namespace = deriveNamespace(path);
	const enrichedProps = getAndClearTrackProperties();

	_trackFn(eventName, {
		namespace,
		sessionId: context.sessionId,
		anonymousId: context.anonymousId,
		properties: enrichedProps ?? undefined,
	});
}
