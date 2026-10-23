// Every topic's sheet, by its slug in ../topics.ts
import type { ComponentType } from "react";
import type { TopicSlug } from "../topics";
import Colour from "./Colour";
import Type from "./Type";
import Shape from "./Shape";
import Motion from "./Motion";
import Icons from "./Icons";
import Layout from "./Layout";
import Brand from "./Brand";
import ButtonSheet from "./ButtonSheet";
import TextLinkSheet from "./atoms/TextLink";
import BadgeSheet from "./BadgeSheet";
import InputSheet from "./atoms/Input";
import TextareaSheet from "./atoms/Textarea";
import CheckboxSheet from "./atoms/Checkbox";
import Controls from "./Controls";
import AvatarSheet from "./atoms/Avatar";
import SpinnerSheet from "./atoms/Spinner";
import SkeletonSheet from "./atoms/Skeleton";
import KbdSheet from "./atoms/Kbd";
import SeparatorSheet from "./atoms/Separator";
import FieldSheet from "./molecules/Field";
import SearchFieldSheet from "./molecules/SearchField";
import AuthFields from "./Input";
import NoticeSheet from "./molecules/Notice";
import ToastSheet from "./molecules/Toast";
import EmptyStateSheet from "./molecules/EmptyState";
import CardSheet from "./molecules/Card";
import MenuSheet from "./molecules/Menu";
import DialogSheet from "./molecules/Dialog";
import TooltipSheet from "./molecules/Tooltip";
import TabsSheet from "./molecules/Tabs";
import Code from "./Code";
import Patterns from "./Patterns";

export const SHEETS: Record<TopicSlug, ComponentType> = {
  colour: Colour,
  type: Type,
  shape: Shape,
  motion: Motion,
  icons: Icons,
  layout: Layout,
  brand: Brand,
  button: ButtonSheet,
  "text-link": TextLinkSheet,
  badge: BadgeSheet,
  input: InputSheet,
  textarea: TextareaSheet,
  checkbox: CheckboxSheet,
  controls: Controls,
  avatar: AvatarSheet,
  spinner: SpinnerSheet,
  skeleton: SkeletonSheet,
  kbd: KbdSheet,
  separator: SeparatorSheet,
  field: FieldSheet,
  "search-field": SearchFieldSheet,
  "auth-fields": AuthFields,
  notice: NoticeSheet,
  toast: ToastSheet,
  "empty-state": EmptyStateSheet,
  card: CardSheet,
  menu: MenuSheet,
  dialog: DialogSheet,
  tooltip: TooltipSheet,
  tabs: TabsSheet,
  code: Code,
  patterns: Patterns,
};
