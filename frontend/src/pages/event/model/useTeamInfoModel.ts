import { useUser } from "@/entities/session/model/session";
import type { TeamInfoRequest } from "@/entities/team/model/team";
import type { TeamTableRowData } from "@/entities/team/ui/TeamTableRow";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizePaymentLink } from './teamInfoSupport';
export function useTeamInfoModel({ payload, onClose: closeModal }: { payload: TeamInfoRequest | null; onClose: () => void; }) {
    const { can } = useUser();

    const navigate = useNavigate();

    const [draft, setDraft] = useState<TeamTableRowData | null>(payload?.row ?? null);

    const [isEditing, setIsEditing] = useState(false);

    const [saving, setSaving] = useState(false);

    const [checkingPayment, setCheckingPayment] = useState(false);

    const paymentLink = normalizePaymentLink(draft?.payment_link);

    useEffect(() => {
        setDraft(payload?.row ?? null);
        setIsEditing(false);
    }, [payload]);

    const canSave = useMemo(() => {
        if (!draft) {
            return false;
        }

        return Boolean(
            draft.name.trim() &&
            draft.school.trim() &&
            draft.region.trim() &&
            draft.members.length === 4 &&
            draft.members.every((member) => member.trim())
        );
    }, [draft]);

    const modalPayload = payload;

    const canHistory = Boolean(draft) && can("teams", "access_history", {
        id: draft!.id,
        leagueId: draft!.league_id,
    });

    async function handleSave() {
        if (!canSave || !draft || !modalPayload) {
            return;
        }

        try {
            setSaving(true);
            await modalPayload.onSave(draft);
            closeModal();
        } finally {
            setSaving(false);
        }
    }

    async function handleCheckPayment() {
        if (!modalPayload?.onCheckPayment || !draft) {
            return;
        }

        try {
            setCheckingPayment(true);
            const updated = await modalPayload.onCheckPayment(draft);
            if (updated) {
                setDraft(updated);
            }
        } finally {
            setCheckingPayment(false);
        }
    }
    function canEditField(field: string) {
        if (field === "status") return Boolean(draft?.can_manage);
        const wire = ({ meals_count: "lunches_count", maintainer_full_name: "accompanying_person" } as Record<string, string>)[field] ?? field;
        return Boolean(draft?.editable_fields?.includes(wire));
    }
    return {
        payload,
        closeModal,
        can,
        navigate,
        draft,
        setDraft,
        isEditing,
        setIsEditing,
        saving,
        setSaving,
        checkingPayment,
        setCheckingPayment,
        paymentLink,
        canSave,
        canEditField,
        modalPayload,
        canHistory,
        handleSave,
        handleCheckPayment,
    };
}
