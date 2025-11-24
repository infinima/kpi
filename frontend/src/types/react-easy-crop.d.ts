declare module "react-easy-crop" {
    import * as React from "react";

    export interface Area {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    interface CropperProps {
        image: string;
        crop: { x: number; y: number };
        zoom: number;
        aspect?: number;
        onCropChange: (location: { x: number; y: number }) => void;
        onZoomChange: (zoom: number) => void;
        onCropComplete?: (area: Area, areaPixels: Area) => void;
    }

    const Cropper: React.FC<CropperProps>;

    export default Cropper;
}