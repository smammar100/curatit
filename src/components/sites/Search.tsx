// Content
import { getCollection } from "@/lib/content";
// Components
import SearchDialog from "./SearchDialog";

export default function Search() {
  const items = getCollection("sites").map((site) => ({
    title: site.data.title,
    tagline: site.data.tagline,
    id: site.id,
  }));
  return <SearchDialog items={items} />;
}
