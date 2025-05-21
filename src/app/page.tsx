"use client";

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
    <div>
      <h1>Realtime Test</h1>
      {/* Status */}
      <p>{status}</p>
      <div>
        <button onClick={connect} disabled={status !== "idle"}>
          Connect
        </button>
        <button onClick={disconnect} disabled={status !== "connected"}>
          Disconnect
        </button>
        <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
      </div>
      <div className="flex gap-4">
        {/* Conversation */}
        <div>
          {conversation.map((message) => (
            <div key={message.id}>{message.text}</div>
          ))}
        </div>
        {/* Events */}
        <div>
          {events.map((event) => (
            <div key={event.event_id}>{event.type}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
