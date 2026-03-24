import { createPortal } from "react-dom";
import { useMemo } from "react";
import { useModalStore } from "@/store";
// import { ProfileModal } from "@/components/ProfileModal";
// import { RightsModal } from "@/components/RightsModal";
// import { LogModal } from "@/components/layout/LogModal";
// import { UserLogModal } from "@/components/layout/UserLogModal";
// import { PhotosModal } from "@/components/layout/PhotosModal";
// import { LogTableModal } from "@/components/TableLogsModal";
// import { LeagueAccountsModal } from "@/components/LeagueAccountsModal";
import { TeamMembersModal } from "@/components/modals/TeamMembersModal";
import { TeamInfoModal } from "@/components/modals/TeamInfoModal";
import { CropModal } from "@/components/services/CropModal";
import { UserRightsModal } from "@/components/lk/UserRightsModal";
import { FinalNominationsModal } from "@/components/modals/FinalNominationsModal";

export function ModalContainer() {
    const activeModal = useModalStore((state) => state.activeModal);

    const content = useMemo(() => {
        switch (activeModal?.type) {
            // case "login":
            //     return <LoginModal />;
            // case "profile":
            //     return <ProfileModal />;
            case "rights":
                return <UserRightsModal />;
            case "final-nominations":
                return <FinalNominationsModal />;
            // case "log":
            //     return <LogModal />;
            // case "user-log":
            //     return <UserLogModal />;
            // case "photos":
            //     return <PhotosModal />;
            // case "table-log":
            //     return <LogTableModal />;
            // case "league-accounts":
            //     return <LeagueAccountsModal />;
            case "team-members":
                return <TeamMembersModal />;
            case "team-info":
                return <TeamInfoModal />;
            case "crop":
                return <CropModal />;
            default:
                return null;
        }
    }, [activeModal?.type]);

    if (!content || typeof document === "undefined") {
        return null;
    }

    return createPortal(content, document.body);
}
