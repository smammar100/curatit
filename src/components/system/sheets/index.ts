// Every topic's sheet, by its slug in ../topics.ts
import type { ComponentType } from "react";
import type { TopicSlug } from "../topics";
import Colour from "./Colour";
import Type from "./Type";
import Shape from "./Shape";
import Motion from "./Motion";
import Icons from "./Icons";
import Layout from "./Layout";
import ButtonSheet from "./ButtonSheet";
import BadgeSheet from "./BadgeSheet";
import Input from "./Input";
import Controls from "./Controls";
import Code from "./Code";
import Patterns from "./Patterns";
import Brand from "./Brand";

export const SHEETS: Record<TopicSlug, ComponentType> = {
  colour: Colour,
  type: Type,
  shape: Shape,
  motion: Motion,
  icons: Icons,
  layout: Layout,
  button: ButtonSheet,
  badge: BadgeSheet,
  controls: Controls,
  input: Input,
  code: Code,
  patterns: Patterns,
  brand: Brand,
};
