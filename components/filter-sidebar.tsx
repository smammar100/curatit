"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FilterSidebarProps {
  onClose: () => void
}

export default function FilterSidebar({ onClose }: FilterSidebarProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <h3 className="font-medium">Filters</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["platforms", "contentTypes", "industries"]}>
        <AccordionItem value="platforms">
          <AccordionTrigger>Platforms</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Instagram", "Twitter", "LinkedIn", "TikTok", "Facebook", "Pinterest"].map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox id={`platform-${platform.toLowerCase()}`} />
                  <label
                    htmlFor={`platform-${platform.toLowerCase()}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {platform}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contentTypes">
          <AccordionTrigger>Content Types</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Stories", "Reels", "Ads", "Organic Posts", "Carousels", "Videos"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox id={`type-${type.toLowerCase().replace(" ", "-")}`} />
                  <label
                    htmlFor={`type-${type.toLowerCase().replace(" ", "-")}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="industries">
          <AccordionTrigger>Industries</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Technology", "Fashion", "Food", "Travel", "Health", "Beauty", "Finance", "Education"].map(
                (industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox id={`industry-${industry.toLowerCase()}`} />
                    <label
                      htmlFor={`industry-${industry.toLowerCase()}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {industry}
                    </label>
                  </div>
                ),
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 space-y-2">
        <Button className="w-full">Apply Filters</Button>
        <Button variant="outline" className="w-full">
          Reset
        </Button>
      </div>
    </div>
  )
}
