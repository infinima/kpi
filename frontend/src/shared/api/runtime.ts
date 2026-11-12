import type { HttpClient } from "./httpClient.js";

export type ApiNotification = {
    type: "success" | "error" | "warning";
    text: string;
    actionText?: string;
    action?: () => void | Promise<void>;
};

type ApiRuntime = {
    request: HttpClient;
    notify: (notification: ApiNotification) => void;
    onMutation?: (path: string) => Promise<void>;
};

let runtime: ApiRuntime | undefined;

/** Called by app bootstrap; API modules never import application stores. */
export function configureApi(configuration: ApiRuntime): void {
    runtime = configuration;
}

export function getApiRuntime(): ApiRuntime {
    if (!runtime) throw new Error("API must be configured before use");
    return runtime;
}
