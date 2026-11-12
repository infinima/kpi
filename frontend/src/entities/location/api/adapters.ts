import type { Location } from "../model/location.js";
import type { LocationDto } from "./dto.js";

export function fromLocationDto(dto: LocationDto): Location {
    return {
        id: dto.id,
        eventId: dto.event_id,
        name: dto.name,
        address: dto.address,
        photoAlbumUrl: dto.photo_album_url,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
        deletedAt: dto.deleted_at,
    };
}
