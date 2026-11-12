import { canRegisterTeam } from "@/entities/permission/model/permissions";
import { accountApi } from '@/entities/account/api/accountApi';
import type { OwnedTeam, RegistrationEvent } from '@/entities/account/model/contracts';
import { useUser } from "@/entities/session/model/session";
import { useServerCollection } from '@/shared/lib/useServerCollection';
import { useNotifications } from "@/shared/model/notifications";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { TeamFormState } from './forms';
import { customRegionValue, customSchoolValue, emptyTeamForm, getSingleOptionId, regionOptions, schoolOptions, teamMemberPayload, validateTeamForm } from './forms';

export function useTeamRegistrationModel() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const user = useUser((state) => state.user);

    const token = useUser((state) => state.token);

    const notify = useNotifications((state) => state.addMessage);

    const { data: registrationData, loading: registrationLoading } = useServerCollection<RegistrationEvent>(["registration-options"], (signal) => accountApi.registrationOptions(signal), Boolean(token));
    const { data: ownedTeams, loading: ownedTeamsLoading } = useServerCollection<OwnedTeam>(["my-teams"], (signal) => accountApi.myTeams(signal), Boolean(token));

    const [checkingPaymentTeamId, setCheckingPaymentTeamId] = useState<number | null>(null);

    const [teamSaving, setTeamSaving] = useState(false);

    const [teamForm, setTeamForm] = useState<TeamFormState>(emptyTeamForm);

    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);

    const [teamSubmitAttempted, setTeamSubmitAttempted] = useState(false);

    const selectedEvent = useMemo(
        () => registrationData.find((event) => String(event.id) === teamForm.eventId) ?? null,
        [registrationData, teamForm.eventId]
    );

    const selectedLocation = useMemo(
        () => selectedEvent?.locations.find((location) => String(location.id) === teamForm.locationId) ?? null,
        [selectedEvent, teamForm.locationId]
    );

    const selectedLeague = useMemo(
        () => selectedLocation?.leagues.find((league) => String(league.id) === teamForm.leagueId) ?? null,
        [selectedLocation, teamForm.leagueId]
    );

    const hasUnlimitedPlaces = Boolean(selectedLeague && selectedLeague.max_teams_count <= 0);

    const availablePlaces = useMemo(() => {
        if (editingTeamId) {
            return null;
        }

        if (!selectedLeague) {
            return null;
        }

        if (selectedLeague.max_teams_count <= 0) {
            return null;
        }

        return Math.max(0, selectedLeague.max_teams_count - selectedLeague.teams_count);
    }, [editingTeamId, selectedLeague]);

    const editingTeam = useMemo(
        () => ownedTeams.find((team) => team.id === editingTeamId) ?? null,
        [editingTeamId, ownedTeams]
    );

    useEffect(() => {
        if (registrationData.length === 0) {
            return;
        }

        setTeamForm((prev) => {
            if (prev.eventId) {
                return prev;
            }

            const requestedEvent = registrationData.find(event => String(event.id) === searchParams.get("eventId"));
            const eventId = requestedEvent ? String(requestedEvent.id) : getSingleOptionId(registrationData);
            const selectedSingleEvent = registrationData.find(event => String(event.id) === eventId);
            const requestedLocation = selectedSingleEvent?.locations.find(location => String(location.id) === searchParams.get("locationId"));
            const locationId = requestedLocation ? String(requestedLocation.id) : getSingleOptionId(selectedSingleEvent?.locations);
            const selectedSingleLocation = selectedSingleEvent?.locations.find(location => String(location.id) === locationId);
            const requestedLeague = selectedSingleLocation?.leagues.find(league => String(league.id) === searchParams.get("leagueId"));
            const leagueId = requestedLeague ? String(requestedLeague.id) : getSingleOptionId(selectedSingleLocation?.leagues);

            return {
                ...prev,
                eventId,
                locationId,
                leagueId,
            };
        });
    }, [registrationData, searchParams]);

    useEffect(() => {
        if (!selectedEvent) {
            return;
        }

        setTeamForm((prev) => {
            const hasCurrentLocation = selectedEvent.locations.some((location) => String(location.id) === prev.locationId);
            if (hasCurrentLocation) {
                return prev;
            }

            const locationId = getSingleOptionId(selectedEvent.locations);
            const selectedSingleLocation = selectedEvent.locations.find((location) => String(location.id) === locationId) ?? null;
            const leagueId = getSingleOptionId(selectedSingleLocation?.leagues);

            return {
                ...prev,
                locationId,
                leagueId,
            };
        });
    }, [selectedEvent]);

    useEffect(() => {
        if (!selectedLocation) {
            return;
        }

        setTeamForm((prev) => {
            const hasCurrentLeague = selectedLocation.leagues.some((league) => String(league.id) === prev.leagueId);
            if (hasCurrentLeague) {
                return prev;
            }

            return {
                ...prev,
                leagueId: getSingleOptionId(selectedLocation.leagues),
            };
        });
    }, [selectedLocation]);

    useEffect(() => {
        if (editingTeamId) {
            return;
        }

        setTeamForm((prev) => {
            const shouldReserve = !hasUnlimitedPlaces && availablePlaces === 0;
            return prev.isReserve === shouldReserve ? prev : { ...prev, isReserve: shouldReserve };
        });
    }, [availablePlaces, editingTeamId, hasUnlimitedPlaces]);

    function applyTeamToForm(team: OwnedTeam) {
        setEditingTeamId(team.id);
        setTeamSubmitAttempted(false);
        setTeamForm({
            eventId: team.event_id ? String(team.event_id) : "",
            locationId: team.location_id ? String(team.location_id) : "",
            leagueId: String(team.league_id),
            name: team.name ?? "",
            school: team.school ?? "",
            schoolMode: schoolOptions.includes(team.school) ? team.school : customSchoolValue,
            region: team.region ?? "",
            regionMode: regionOptions.includes(team.region) ? team.region : customRegionValue,
            members: Array.isArray(team.members) && team.members.length === 4 ? team.members : ["", "", "", ""],
            appreciationsText: Array.isArray(team.appreciations) ? team.appreciations.join("\n") : "",
            meals_count: String(team.meals_count ?? 0),
            maintainer_full_name: team.maintainer_full_name ?? "",
            maintainer_activity: team.maintainer_activity ?? "",
            isReserve: team.status === "IN_RESERVE",
            acceptedOffer: true,
        });
        void navigate("/lk/reg_team");
    }

    function resetTeamEditor() {
        setEditingTeamId(null);
        setTeamSubmitAttempted(false);
        setTeamForm(emptyTeamForm());
        void navigate("/lk/my_team");
    }

    function handleMemberChange(index: number, value: string) {
        setTeamForm((prev) => ({
            ...prev,
            members: prev.members.map((member, memberIndex) => memberIndex === index ? value : member),
        }));
    }

    function handleEventChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            eventId: value,
            locationId: "",
            leagueId: "",
        }));
    }

    function handleLocationChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            locationId: value,
            leagueId: "",
        }));
    }

    function handleSchoolModeChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            schoolMode: value,
            school: value && value !== customSchoolValue ? value : "",
        }));
    }

    function handleRegionModeChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            regionMode: value,
            region: value && value !== customRegionValue ? value : "",
        }));
    }

    function canRegisterLeague(league: { id: number; status: string }) {
        return canRegisterTeam(user?.rights, league.status, {
            eventId: selectedEvent?.id, locationId: selectedLocation?.id, leagueId: league.id,
        });
    }

    async function handleTeamSubmit() {
        if (teamSaving) return;
        setTeamSubmitAttempted(true);
        if (!editingTeamId && selectedLeague && !canRegisterLeague(selectedLeague)) {
            notify({ type: "warning", text: "Регистрация в эту лигу закрыта" });
            return;
        }
        if (editingTeamId && !editingTeam?.owner_can_edit) {
            notify({ type: "warning", text: "Редактирование команды сейчас недоступно" });
            return;
        }

        const message = validateTeamForm(teamForm, Boolean(editingTeamId));
        if (message) { notify({ type: "warning", text: message }); return; }

        try {
            setTeamSaving(true);
            const basePayload = teamMemberPayload(teamForm);
            if (editingTeamId) await accountApi.updateTeam(editingTeamId, basePayload);
            else await accountApi.registerTeam({ league_id: Number(teamForm.leagueId), is_reserve: teamForm.isReserve, name: teamForm.name.trim(), school: teamForm.school.trim(), region: teamForm.region.trim(), ...basePayload });

            setEditingTeamId(null);
            setTeamSubmitAttempted(false);
            setTeamForm(emptyTeamForm());
            void navigate("/lk/my_team");
        } finally {
            setTeamSaving(false);
        }
    }

    async function handleCheckPayment(teamId: number) {
        try {
            setCheckingPaymentTeamId(teamId);
            await accountApi.checkPayment(teamId);
        } finally {
            setCheckingPaymentTeamId(null);
        }
    }
    return {
        registrationData,
        registrationLoading,
        ownedTeams,
        ownedTeamsLoading,
        checkingPaymentTeamId,
        teamSaving,
        teamForm,
        editingTeamId,
        teamSubmitAttempted,
        selectedEvent,
        selectedLocation,
        selectedLeague,
        canRegisterLeague,
        hasUnlimitedPlaces,
        availablePlaces,
        editingTeam,
        handleMemberChange,
        handleEventChange,
        handleLocationChange,
        handleSchoolModeChange,
        handleRegionModeChange,
        applyTeamToForm,
        resetTeamEditor,
        handleTeamSubmit,
        handleCheckPayment,
        setTeamForm,
        setTeamSubmitAttempted,
    };
}
