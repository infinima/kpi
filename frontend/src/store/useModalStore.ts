import { create } from "zustand";
import type { TeamMembersValue, TeamTableRowData } from "@/components/ui/table/TeamTableRow";

export type ModalType =
    | "login"
    | "profile"
    | "rights"
    | "final-nominations"
    | "log"
    | "user-log"
    | "photos"
    | "table-log"
    | "league-accounts"
    | "team-members"
    | "team-info"
    | "crop";

type ModalPayloadMap = {
    login: undefined;
    profile: undefined;
    rights: { userId: number; userName: string };
    "final-nominations": {
        teamId: number;
        teamName: string;
        nominations: string[];
        onSave: (list: string[]) => Promise<void> | void;
    };
    log: { id: number; name: string };
    "user-log": { id: number };
    photos: undefined;
    "table-log": { type: "fudzi" | "kvartaly"; id: number };
    "league-accounts": { leagueId: number };
    "team-members": {
        teamName: string;
        members: TeamMembersValue;
        editable: boolean;
        onSave?: (members: TeamMembersValue) => void;
    };
    "team-info": {
        row: TeamTableRowData;
        canEdit: boolean;
        onSave: (row: TeamTableRowData) => Promise<void> | void;
        onCheckPayment?: (row: TeamTableRowData) => Promise<TeamTableRowData | void> | TeamTableRowData | void;
    };
    crop: {
        file: File;
        title?: string;
        description?: string;
        aspect?: number;
        confirmLabel?: string;
        onCrop: (base64: string) => Promise<void> | void;
    };
};

type ActiveModal =
    | { type: "login"; payload?: undefined }
    | { type: "profile"; payload?: undefined }
    | { type: "rights"; payload: ModalPayloadMap["rights"] }
    | { type: "final-nominations"; payload: ModalPayloadMap["final-nominations"] }
    | { type: "log"; payload: ModalPayloadMap["log"] }
    | { type: "user-log"; payload: ModalPayloadMap["user-log"] }
    | { type: "photos"; payload?: undefined }
    | { type: "table-log"; payload: ModalPayloadMap["table-log"] }
    | { type: "league-accounts"; payload: ModalPayloadMap["league-accounts"] }
    | { type: "team-members"; payload: ModalPayloadMap["team-members"] }
    | { type: "team-info"; payload: ModalPayloadMap["team-info"] }
    | { type: "crop"; payload: ModalPayloadMap["crop"] };

type ModalState = {
    activeModal: ActiveModal | null;
    openModal: <T extends ModalType>(type: T, payload?: ModalPayloadMap[T]) => void;
    closeModal: () => void;
    isOpen: (type: ModalType) => boolean;
};

export const useModalStore = create<ModalState>((set, get) => ({
    activeModal: null,

    openModal: (type, payload) => {
        set({
            activeModal: payload === undefined
                ? { type } as ActiveModal
                : { type, payload } as ActiveModal,
        });
    },

    closeModal: () => {
        set({ activeModal: null });
    },

    isOpen: (type) => get().activeModal?.type === type,
}));
