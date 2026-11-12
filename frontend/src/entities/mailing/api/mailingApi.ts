import { apiDelete } from "../../../shared/api/delete.js";
import { apiGet } from "../../../shared/api/get.js";
import { apiPatch } from "../../../shared/api/patch.js";
import { apiPost } from "../../../shared/api/post.js";
import type { ApiNotifyOptions } from "../../../shared/api/request.js";
import type { Mailing } from "../model/mailing.js";
import type { MailingDraft } from "../model/mailingDraft.js";
import { fromMailingDetailsDto, fromMailingDto } from "./contractAdapters.js";
import type { MailingDetailsDto, MailingDto } from "./contracts.js";
export type MailingDelivery = { success: boolean; status: Mailing["status"]; sent: number; failed: number; };
export const mailingApi = {
    async list(notify?: ApiNotifyOptions) { return (await apiGet<MailingDto[]>("mailings", notify)).map(fromMailingDto); },
    async details(id: number, notify?: ApiNotifyOptions) { return fromMailingDetailsDto(await apiGet<MailingDetailsDto>(`mailings/${id}`, notify)); },
    create(body: MailingDraft, notify?: ApiNotifyOptions) { return apiPost("mailings", body, notify); },
    update(id: number, body: MailingDraft, notify?: ApiNotifyOptions) { return apiPatch(`mailings/${id}`, body, notify); },
    remove(id: number) { return apiDelete(`mailings/${id}`, id); },
    start(id: number, notify?: ApiNotifyOptions) { return apiPost<MailingDelivery>(`mailings/${id}/start`, undefined, notify); },
    resend(id: number, notify?: ApiNotifyOptions) { return apiPost(`mailings/recipients/${id}/resend`, undefined, notify); },
};
