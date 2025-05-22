"use client";

import { cn } from "./lib/utils";
import { useRealtime } from "./realtime/useRealtime";

export default function Home() {
  const {
    status,
    connect,
    disconnect,
    mediaStream,
    muted,
    toggleMute,
    conversation,
    events,
  } = useRealtime();
  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="flex gap-2 justify-between">
        <h1 className="text-2xl font-bold">Realtime Test</h1>
        <p className="p-2 px-4 rounded-md bg-white/10">{status}</p>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-blue-900 text-white px-4 py-2 rounded-md disabled:bg-gray-900"
          onClick={connect}
          disabled={status !== "idle"}
        >
          Connect
        </button>
        <button
          className="bg-red-900 text-white px-4 py-2 rounded-md disabled:bg-gray-900"
          onClick={disconnect}
          disabled={status !== "connected"}
        >
          Disconnect
        </button>
        <button
          className={cn(
            "text-white px-4 py-2 rounded-md disabled:bg-gray-900",
            muted && "bg-red-900",
            !muted && "bg-green-900"
          )}
          disabled={status !== "connected"}
          onClick={toggleMute}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
      <div className="flex gap-4 h-full flex-1">
        {/* Conversation */}
        <div className="flex flex-col gap-2 flex-1 border p-6 border-white/20 rounded-xl ">
          <h2 className="text-lg font-semibold">Conversation</h2>
          <hr className="border-white/20" />
          <div className="flex flex-col-reverse overflow-y-auto ">
            <div className="flex flex-col gap-2">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-md p-2",
                    message.role === "user"
                      ? "bg-blue-900 text-left"
                      : "bg-green-900 text-right"
                  )}
                >
                  <p className="text-sm text-white/50">{message.timestamp}</p>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Events */}
        <div className="flex flex-col gap-2 flex-1 border p-6 border-white/20 rounded-xl">
          <h2 className="text-lg font-semibold">Events</h2>
          <hr className="border-white/20" />
          <div className="flex flex-col-reverse overflow-y-auto ">
            <div className="flex flex-col gap-2">
              {events.map((event) => (
                <div key={event.event_id}>{event.type}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
