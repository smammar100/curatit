"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/client";

export default function CreateBoardForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="rounded-lg bg-base-50 p-6"
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
      <h2 className="font-display text-2xl text-base-900">New board</h2>
      <p className="mt-1 text-xs text-base-500">Private by default. Only you can see it until you share a link.</p>

      <label htmlFor="board-name" className="mt-4 block text-sm font-medium text-base-700">
        Name
      </label>
      <input
        id="board-name"
        required
        maxLength={80}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Autumn launch — sportswear"
        className="mt-1 block w-full h-10 px-3 rounded-md text-sm bg-white ring-1 ring-base-200 border-transparent focus:ring-2 focus:ring-accent-100 focus:border-accent-500"
      />

      <label htmlFor="board-description" className="mt-3 block text-sm font-medium text-base-700">
        Private description <span className="font-normal text-base-400">(optional)</span>
      </label>
      <textarea
        id="board-description"
        maxLength={1000}
        rows={2}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="The brief, client, or direction. Never shown on share links."
        className="mt-1 block w-full px-3 py-2 rounded-md text-sm bg-white ring-1 ring-base-200 border-transparent focus:ring-2 focus:ring-accent-100 focus:border-accent-500"
      />

      <div role="alert" className="mt-2 min-h-5 text-sm text-red-700">
        {error}
      </div>
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="mt-1 h-10 px-5 rounded-lg text-sm font-medium text-white bg-base-800 hover:bg-base-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create board"}
      </button>
    </form>
  );
}
