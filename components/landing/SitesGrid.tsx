"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/fundations/elements/Button";

/**
 * Progressive "Show more" grid. Cards are rendered on the server and handed in
 * as children so the client bundle stays tiny.
 */
export default function SitesGrid({
  cards,
  sponsor,
  sponsorAfterIndex = 2,
  step = 7,
}: {
  cards: ReactNode[];
  sponsor?: ReactNode;
  sponsorAfterIndex?: number;
  step?: number;
}) {
  const [visible, setVisible] = useState(step);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {cards.map((card, index) => (
          <div key={index} className="contents">
            <div className={index >= visible ? "hidden" : ""}>{card}</div>
            {index === sponsorAfterIndex && sponsor}
          </div>
        ))}
      </div>
      {visible < cards.length && (
        <div className="flex justify-center mt-10">
          <Button
            type="button"
            variant="muted"
            size="sm"
            className="px-6"
            onClick={() => setVisible((value) => value + step)}
          >
            Show more
          </Button>
        </div>
      )}
    </>
  );
}
