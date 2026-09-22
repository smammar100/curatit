"use client";

import { motion } from "framer-motion";
import Text from "@/components/fundations/elements/Text";
import { Plus } from "@/components/fundations/icons";
import { faqs } from "@/components/global/Faq";
import { smoothEase } from "./tokens";

/** Split FAQ: serif heading on the left, accordion on the right. */
export default function LandingFaq() {
  return (
    <section className="px-8 py-24 md:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: smoothEase }}
        >
          <p className="text-xs font-medium uppercase tracking-[2.5px] text-base-500">Questions</p>
          <Text tag="h2" variant="displayLG" className="mt-4 font-display font-light text-base-900 text-balance">
            The ones that tend to crop up.
          </Text>
        </motion.div>

        <div className="divide-y divide-base-200 border-y border-base-200">
          {faqs.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base text-base-900 select-none hover:text-accent-600 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Plus className="size-4 shrink-0 transition-transform duration-300 ease-out group-open:rotate-45" />
              </summary>
              <Text tag="p" variant="textSM" className="max-w-xl pb-6 text-base-600">
                {faq.answer}
              </Text>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
