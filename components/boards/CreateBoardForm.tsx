"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/client";

/** Plain input and textarea on the FF input recipe. */
const input =
  "h-9 w-full rounded-lg bg-background px-3 text-[13px] text-foreground shadow-surface-1 placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";
const textarea =
  "block min-h-24 w-full rounded-lg bg-background px-3 py-2 text-[13px] text-foreground shadow-surface-1 placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";

/** "New board" button + dialog. */
export default function CreateBoardForm({
  label = "New board",
  variant = "button",
  index,
}: {
  label?: string;
  /** "tile" is the empty slot at the end of the boards grid. */
  variant?: "button" | "tile";
  /** Injected by CardGroup, so the tile joins the grid's fluid hover like the boards around it. */
  index?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      {variant === "tile" ? (
        <Card onClick={() => setOpen(true)} label={label} index={index} className="p-2">
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-[14px] text-muted-foreground transition-colors duration-80 group-hover/card:text-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-card shadow-surface-3">
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            </span>
            {label}
          </div>
        </Card>
      ) : (
        <Button type="button" variant="primary" leadingIcon={Plus} onClick={() => setOpen(true)} aria-haspopup="dialog">
          {label}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError(null);
              try {
                const { id } = await apiRequest<{ id: string }>("POST", "/api/collections", { name, description });
                router.push(`/boards/${id}`);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't create the board.");
                setPending(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>New board</DialogTitle>
              <DialogDescription>Private by default. Only you can see it until you share a link.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1">
              <label htmlFor="board-name" className="pl-2.5 text-[13px] text-muted-foreground">
                Name
              </label>
              <input
                id="board-name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Autumn launch, sportswear"
                className={input}
                autoFocus
              />
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <label htmlFor="board-description" className="pl-2.5 text-[13px] text-muted-foreground">
                Private description (optional)
              </label>
              <textarea
                id="board-description"
                maxLength={1000}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="The brief, client or direction. Never shown on share links."
                className={textarea}
              />
            </div>

            <div role="alert" className="mt-2 min-h-5 px-1 text-[13px] text-destructive">
              {error}
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending} disabled={!name.trim()}>
                Create board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
