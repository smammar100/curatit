// Each library category's icon, by slug (src/lib/categories.ts): drawn by the homepage's category
// tabs (home/Categories), Discover's row (CategoryBar), the search panel's chips (SearchBox) and
// the welcome flow's folders. Phosphor, bold, like every icon here.
import type { ReactNode } from "react";
import AddressBook from "@/components/fundations/icons/AddressBook";
import AirplaneTilt from "@/components/fundations/icons/AirplaneTilt";
import Barbell from "@/components/fundations/icons/Barbell";
import Basketball from "@/components/fundations/icons/Basketball";
import BookOpen from "@/components/fundations/icons/BookOpen";
import Briefcase from "@/components/fundations/icons/Briefcase";
import Camera from "@/components/fundations/icons/Camera";
import ChatsCircle from "@/components/fundations/icons/ChatsCircle";
import Code from "@/components/fundations/icons/Code";
import CreditCard from "@/components/fundations/icons/CreditCard";
import CurrencyBtc from "@/components/fundations/icons/CurrencyBtc";
import FirstAid from "@/components/fundations/icons/FirstAid";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
import GraduationCap from "@/components/fundations/icons/GraduationCap";
import Handshake from "@/components/fundations/icons/Handshake";
import House from "@/components/fundations/icons/House";
import type { IconProps } from "@/components/fundations/icons/Icon";
import ListChecks from "@/components/fundations/icons/ListChecks";
import MapTrifold from "@/components/fundations/icons/MapTrifold";
import MusicNotes from "@/components/fundations/icons/MusicNotes";
import Newspaper from "@/components/fundations/icons/Newspaper";
import PaintBrush from "@/components/fundations/icons/PaintBrush";
import Popcorn from "@/components/fundations/icons/Popcorn";
import ShareNetwork from "@/components/fundations/icons/ShareNetwork";
import ShoppingBag from "@/components/fundations/icons/ShoppingBag";
import Sparkle from "@/components/fundations/icons/Sparkle";
import Sun from "@/components/fundations/icons/Sun";
import UsersThree from "@/components/fundations/icons/UsersThree";
import Wrench from "@/components/fundations/icons/Wrench";

export const CATEGORY_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  ai: Sparkle,
  business: Briefcase,
  collaboration: UsersThree,
  communication: ChatsCircle,
  crm: AddressBook,
  "crypto-web3": CurrencyBtc,
  "developer-tools": Code,
  education: GraduationCap,
  entertainment: Popcorn,
  finance: CreditCard,
  "food-drink": ForkKnife,
  "graphics-design": PaintBrush,
  "health-fitness": Barbell,
  "jobs-recruitment": Handshake,
  lifestyle: Sun,
  "maps-navigation": MapTrifold,
  medical: FirstAid,
  "music-audio": MusicNotes,
  news: Newspaper,
  "photo-video": Camera,
  productivity: ListChecks,
  "real-estate": House,
  reference: BookOpen,
  shopping: ShoppingBag,
  "social-networking": ShareNetwork,
  sports: Basketball,
  "travel-transportation": AirplaneTilt,
  utilities: Wrench,
};
