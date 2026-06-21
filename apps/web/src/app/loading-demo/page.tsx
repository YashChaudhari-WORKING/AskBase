"use client";
import { SignalAnimation, SignalLogo } from "@/components/signal-animation";

export default function LoadingDemo() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="flex flex-col items-center">
        <SignalAnimation className="w-[280px] h-[280px]" />
        <div className="flex items-center gap-2.5 mt-2">
          <SignalLogo size={22} />
          <span className="text-white/75 font-semibold text-lg tracking-tight">AskBase</span>
        </div>
      </div>
    </div>
  );
}
