import SubscriptionForm from "@/components/subscription-form"
import ImageStack from "@/components/image-stack"

export default function SubscribePage() {
  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-white overflow-hidden">
      <div className="w-full max-w-3xl mx-auto px-4 pt-16 pb-8 flex flex-col items-center gap-12 z-10">
        {/* Text Group */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Get inspired with the latest social media designs delivered to your inbox
          </h1>
          <p className="text-gray-500 text-lg">Unsubscribe anytime.</p>
        </div>

        {/* Subscription Form */}
        <SubscriptionForm />
      </div>

      {/* Image Stack */}
      <div className="w-full">
        <ImageStack />
      </div>
    </div>
  )
}
