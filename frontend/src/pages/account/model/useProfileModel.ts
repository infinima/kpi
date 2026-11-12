import { accountApi } from "@/entities/account/api/accountApi";
import { useUser } from "@/entities/session/model/session";
import { useNotifications } from "@/shared/model/notifications";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { validateProfile, type ProfileFormState } from "./forms";

export function useProfileModel() {
    const user = useUser((state) => state.user);
    const fetchUser = useUser((state) => state.fetchUser);
    const notify = useNotifications((state) => state.addMessage);
    const profile = useQuery({ queryKey: ["profile", user?.id], queryFn: ({ signal }) => accountApi.profile(user!.id, signal), enabled: Boolean(user?.id) });
    const [profileForm, setProfileForm] = useState<ProfileFormState>({ first_name: "", last_name: "", patronymic: "", phone_number: "", email: "" });
    const [profileSaving, setProfileSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    useEffect(() => {
        if (!profile.data || dirty) return;
        const data = profile.data;
        setProfileForm({ first_name: data.first_name ?? "", last_name: data.last_name ?? "", patronymic: data.patronymic ?? "", phone_number: data.phone_number ?? "", email: data.email ?? "" });
    }, [profile.data, dirty]);
    function handleProfileFieldChange(field: keyof ProfileFormState, value: string) { setDirty(true); setProfileForm((current) => ({ ...current, [field]: value })); }
    async function handleProfileSave() {
        if (!user?.id) return;
        const message = validateProfile(profileForm);
        if (message) { notify({ type: "warning", text: message }); return; }
        try {
            setProfileSaving(true);
            await accountApi.updateProfile(user.id, { first_name: profileForm.first_name.trim(), last_name: profileForm.last_name.trim(), patronymic: profileForm.patronymic.trim() || null, phone_number: profileForm.phone_number.trim() });
            await fetchUser();
            setDirty(false);
        } finally { setProfileSaving(false); }
    }
    return { profileForm, profileLoading: profile.isLoading, profileSaving, handleProfileFieldChange, handleProfileSave };
}
