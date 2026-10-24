// Every topic's sheet, by its slug in ../topics.ts
import type { ComponentType } from "react";
import type { TopicSlug } from "../topics";
import Colour from "./Colour";
import Type from "./Type";
import Surfaces from "./Surfaces";
import Motion from "./Motion";
import Radius from "./Radius";
import Space from "./Space";
import Icons from "./Icons";
import Brand from "./Brand";
import ButtonSheet from "./ButtonSheet";
import CopyButtonSheet from "./CopyButtonSheet";
import TextLinkSheet from "./TextLinkSheet";
import FieldSheet from "./FieldSheet";
import TextareaSheet from "./TextareaSheet";
import SelectSheet from "./SelectSheet";
import CheckboxSheet from "./CheckboxSheet";
import SwitchSheet from "./SwitchSheet";
import SegmentedSheet from "./SegmentedSheet";
import ChipSheet from "./ChipSheet";
import TabsSheet from "./TabsSheet";
import CardSheet from "./CardSheet";
import ItemSheet from "./ItemSheet";
import DataListSheet from "./DataListSheet";
import CollapsibleSheet from "./CollapsibleSheet";
import BadgeSheet from "./BadgeSheet";
import AvatarSheet from "./AvatarSheet";
import KbdSheet from "./KbdSheet";
import CodeBlockSheet from "./CodeBlockSheet";
import AlertSheet from "./AlertSheet";
import ToastSheet from "./ToastSheet";
import EmptyStateSheet from "./EmptyStateSheet";
import SkeletonSheet from "./SkeletonSheet";
import DialogSheet from "./DialogSheet";
import DropdownMenuSheet from "./DropdownMenuSheet";
import PopoverSheet from "./PopoverSheet";
import TooltipSheet from "./TooltipSheet";

export const SHEETS: Record<TopicSlug, ComponentType> = {
  colour: Colour,
  type: Type,
  surfaces: Surfaces,
  motion: Motion,
  radius: Radius,
  space: Space,
  icons: Icons,
  brand: Brand,
  button: ButtonSheet,
  "copy-button": CopyButtonSheet,
  "text-link": TextLinkSheet,
  field: FieldSheet,
  textarea: TextareaSheet,
  select: SelectSheet,
  checkbox: CheckboxSheet,
  switch: SwitchSheet,
  "segmented-control": SegmentedSheet,
  chip: ChipSheet,
  tabs: TabsSheet,
  card: CardSheet,
  item: ItemSheet,
  "data-list": DataListSheet,
  collapsible: CollapsibleSheet,
  badge: BadgeSheet,
  avatar: AvatarSheet,
  kbd: KbdSheet,
  "code-block": CodeBlockSheet,
  alert: AlertSheet,
  toast: ToastSheet,
  "empty-state": EmptyStateSheet,
  skeleton: SkeletonSheet,
  dialog: DialogSheet,
  "dropdown-menu": DropdownMenuSheet,
  popover: PopoverSheet,
  tooltip: TooltipSheet,
};
