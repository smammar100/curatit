import { getCollection } from "@/lib/content";
import SearchDialog from "./SearchDialog";

/** Server wrapper: loads the sites collection and hands it to the client dialog. */
export default async function Search() {
  const sites = await getCollection("sites");

  return (
    <SearchDialog
      items={sites.map((site) => ({
        id: site.id,
        title: site.data.title,
        tagline: site.data.tagline,
      }))}
    />
  );
}
