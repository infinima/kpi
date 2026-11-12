import { useImageUrl } from "../lib/useImageUrl";
import { Image, type ImageProps } from "./Image";
/** Infrastructure wrapper; subject views may also pass a resolved URL to Image. */
export function BaseImage({ path, ...props }: Omit<ImageProps, "src"> & { path: string; }) {
    return <Image {...props} src={useImageUrl(path)} />;
}
