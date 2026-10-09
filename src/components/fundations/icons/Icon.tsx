import type { SVGProps } from "react";
import { cx } from "@/lib/cx";

const sizes = {
  xs: "size-3",
  sm: "size-4",
  base: "size-5",
  md: "size-6",
  lg: "size-7",
  xl: "size-8",
};

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: keyof typeof sizes;
};

// Shared shell for the 256x256 single-path icons in this folder.
export default function Icon({ d, size, className, ...rest }: IconProps & { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={cx("icon", size && sizes[size], className)}
      {...rest}
    >
      <path d={d}></path>
    </svg>
  );
}
