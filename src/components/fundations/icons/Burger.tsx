import Icon, { type IconProps } from "./Icon";

export default function Burger(props: IconProps) {
  return (
    <Icon
      d="M228,160a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,160ZM40,108H216a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24Z"
      {...props}
    />
  );
}
