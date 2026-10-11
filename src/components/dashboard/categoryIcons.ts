// Each library category's icon, by slug: the ones the homepage's category tabs draw
// (home/Categories), used by Discover's row (CategoryBar) and the search panel's chips (SearchBox)
import type { ReactNode } from "react";
import AirplaneTilt from "@/components/fundations/icons/AirplaneTilt";
import Basketball from "@/components/fundations/icons/Basketball";
import CoatHanger from "@/components/fundations/icons/CoatHanger";
import Cpu from "@/components/fundations/icons/Cpu";
import CreditCard from "@/components/fundations/icons/CreditCard";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
import type { IconProps } from "@/components/fundations/icons/Icon";
import ShoppingBag from "@/components/fundations/icons/ShoppingBag";

export const CATEGORY_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  "food-delivery": ForkKnife,
  sportswear: Basketball,
  technology: Cpu,
  fashion: CoatHanger,
  fintech: CreditCard,
  travel: AirplaneTilt,
  ecommerce: ShoppingBag,
};
