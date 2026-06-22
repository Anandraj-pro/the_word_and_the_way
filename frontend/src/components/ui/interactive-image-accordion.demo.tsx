import { RoomAccordion } from "@/components/ui/interactive-image-accordion";

// Standalone usage. In the app this is wired into Room.tsx, where `onEnter`
// scrolls to the chosen station; here it simply logs the anchor.
export default function DemoOne() {
  return (
    <div className="w-full">
      <RoomAccordion onEnter={(anchor) => console.log("enter:", anchor)} />
    </div>
  );
}