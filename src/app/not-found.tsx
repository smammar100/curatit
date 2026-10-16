import BaseLayout from "@/layouts/BaseLayout";
import NotFoundContent from "@/components/global/NotFoundContent";

// Any address that isn't a page: the 404 content (NotFoundContent) with the site's navigation and
// footer, since the root layout has neither
export default function NotFound() {
  return (
    <BaseLayout>
      <NotFoundContent />
    </BaseLayout>
  );
}
