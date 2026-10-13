"use client";

import { useRef, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";

export default function PaddleCheckoutButton({ enabled }: { enabled: boolean }) {
  const opening = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  async function openCheckout() {
    if (opening.current) return;
    opening.current = true;
    setBusy(true);
    setError("");
    try {
      const { initializePaddle } = await import("@paddle/paddle-js");
      const response = await fetch("/api/paddle/checkout", { method: "POST" });
      if (response.status === 401) {
        window.location.assign("/signin?next=%2Fpricing");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout could not open.");
      const paddle = await initializePaddle({
        environment: "sandbox", token: data.clientToken,
        eventCallback(event) {
          if (event.name === "checkout.completed") {
            // This is UI feedback, never proof of entitlement.
            setCompleted(true);
          }
          if (event.name === "checkout.error") setError("Checkout encountered a problem. Please try again.");
          if (event.name === "checkout.closed" || event.name === "checkout.completed" || event.name === "checkout.error") {
            opening.current = false;
            setBusy(false);
          }
        },
      });
      if (!paddle) throw new Error("Checkout could not load. Please try again.");
      paddle.Checkout.open({
        transactionId: data.transactionId,
        settings: { displayMode: "overlay", theme: "light", locale: "en", showAddDiscounts: false },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not open. Please try again.");
      opening.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <Button size="base" variant="default" className="w-fit disabled:opacity-50" type="button"
        disabled={!enabled || busy || completed} onClick={openCheckout} aria-busy={busy}>
        {completed ? "Test payment complete" : busy ? "Opening checkout…" : enabled ? "Try sandbox checkout" : "Coming soon"}
      </Button>
      <Text tag="p" variant="textXS" className="text-base-500 mt-3" aria-live="polite">
        {completed ? "Test payment received. Your account access has not changed." :
          enabled ? "Test checkout only. No real payment will be taken. Tax is calculated at checkout." :
          "Paid subscriptions are not available yet."}
      </Text>
      {error && <Text tag="p" variant="textSM" role="alert" className="mt-3 text-danger-600">{error}</Text>}
    </div>
  );
}
