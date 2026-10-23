"use client";

import { Fragment, useState, type ReactNode } from "react";
// Fundation
import Button from "@/components/fundations/elements/Button";

// Shows the first few cards and reveals the rest in steps; the sponsor card sits after the third card.
export default function SitesPreviewGrid({
  cards,
  sponsor,
  initialVisible = 7,
}: {
  cards: ReactNode[];
  sponsor: ReactNode;
  initialVisible?: number;
}) {
  const [visible, setVisible] = useState(initialVisible);
  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {cards.map((card, i) => (
          <Fragment key={i}>
            <div className={i >= visible ? "hidden" : ""}>{card}</div>
            {i === 2 && sponsor}
          </Fragment>
        ))}
      </div>
      {visible < cards.length && (
        <div className="flex justify-center mt-12">
          <Button
            type="button"
            variant="muted"
            size="sm"
            onClick={() => setVisible(visible + initialVisible)}
          >
            Show more
          </Button>
        </div>
      )}
    </>
  );
}
