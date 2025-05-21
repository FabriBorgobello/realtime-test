import { useRef, useState } from "react";
import {
  RealtimeEvent,
  RealtimeServerEvent,
  RealtimeSession,
  RealtimeSessionConfig,
  RealtimeStatus,
  UIMessage,
} from "./types";

const SYSTEM_PROMPT = "You are a helpful assistant.";

export function useRealtime() {
  const mediaStream = useRef<MediaStream | null>(null); // Microphone
  const peerConnection = useRef<RTCPeerConnection | null>(null); // WebRTC
  const dataChannel = useRef<RTCDataChannel | null>(null); // Data channel

  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [conversation, setConversation] = useState<UIMessage[]>([]);
  const [muted, setMuted] = useState(false);

  async function serverMessageHandler(e: RealtimeServerEvent) {
    switch (e.type) {
      case "error":
      case "session.created":
      case "session.updated":
      case "conversation.created":
      case "conversation.item.created":
      case "conversation.item.retrieved":
      case "conversation.item.input_audio_transcription.delta":
      case "conversation.item.input_audio_transcription.failed":
      case "conversation.item.truncated":
      case "conversation.item.deleted":
      case "input_audio_buffer.committed":
      case "input_audio_buffer.cleared":
      case "input_audio_buffer.speech_started":
      case "input_audio_buffer.speech_stopped":
      case "response.created":
      case "response.done":
      case "response.output_item.added":
      case "response.output_item.done":
      case "response.content_part.added":
      case "response.content_part.done":
      case "response.text.delta":
      case "response.text.done":
      case "response.audio_transcript.delta":
      case "response.audio.delta":
      case "response.audio.done":
      case "response.function_call_arguments.delta":
      case "response.function_call_arguments.done":
      case "transcription_session.updated":
      case "rate_limits.updated":
      case "output_audio_buffer.started":
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        break;

      // Assistant audio transcript done
      case "response.audio_transcript.done":
        setConversation((prev) => [
          ...prev,
          {
            id: e.item_id,
            role: "assistant",
            status: "final",
            text: e.transcript,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;

      // User audio transcript done
      case "conversation.item.input_audio_transcription.completed":
        setConversation((prev) => [
          ...prev,
          {
            id: e.item_id,
            role: "user",
            status: "final",
            text: e.transcript,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;

      default:
        e satisfies never;
        console.log(e);
    }

    // Update event history
    setEvents((prev) => [...prev, e]);
  }

  async function connect() {
    try {
      setStatus("connecting");

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;

      // Get ephemeral token
      setStatus("requesting-ephemeral-token");
      const ephemeralToken = await getEphemeralToken();

      // <audio /> element for assistant audio output
      const audio = document.createElement("audio");
      audio.autoplay = true;

      // Create peer connection
      setStatus("creating-peer-connection");
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;
      pc.ontrack = (event) => (audio.srcObject = event.streams[0]); // Play assistant audio
      pc.addTrack(stream.getTracks()[0]); // Add microphone track to peer

      // Create data channel
      const dc = pc.createDataChannel("realtime");
      dataChannel.current = dc;
      dc.onopen = () => {
        // Send initial session configuration
        const session: {
          type: "session.update";
          session: Partial<RealtimeSessionConfig>;
        } = {
          type: "session.update",
          session: {
            instructions: SYSTEM_PROMPT,
            modalities: ["text", "audio"],
            input_audio_transcription: { model: "whisper-1" },
            input_audio_noise_reduction: { type: "near_field" },
            tools: [],
            temperature: 0.6,
          },
        };
        dc.send(JSON.stringify(session));
      };
      dc.onmessage = (e) => serverMessageHandler(JSON.parse(e.data)); // Handle server messages

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const answer = await createSession(ephemeralToken, offer);
      await pc.setRemoteDescription(answer);

      setStatus("connected");
    } catch (error) {
      setStatus("error");
      console.error(error);
    }
  }

  async function disconnect() {
    // Clean up peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clean up data channel
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }

    // Clean up media stream
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }

    // Reset states
    setStatus("idle");
    setEvents([]);
    setConversation([]);
    setMuted(false);
  }

  async function mute() {
    if (mediaStream.current) {
      mediaStream.current
        .getTracks()
        .forEach((track) => (track.enabled = false));
      setMuted(true);
    }
  }

  async function unmute() {
    if (mediaStream.current) {
      mediaStream.current
        .getTracks()
        .forEach((track) => (track.enabled = true));
      setMuted(false);
    }
  }

  async function toggleMute() {
    if (muted) {
      await unmute();
    } else {
      await mute();
    }
  }

  return {
    // WebRTC
    status,
    connect,
    disconnect,

    // Microphone
    mediaStream,
    muted,
    toggleMute,

    // Conversation
    conversation,

    // Events
    events,
  };
}

async function getEphemeralToken() {
  const r = await fetch("/api/realtime/sessions");
  const data = (await r.json()) as RealtimeSession;
  return data.client_secret.value;
}

async function createSession(token: string, offer: RTCSessionDescriptionInit) {
  const url = new URL("https://api.openai.com/v1/realtime");
  url.searchParams.set("model", "gpt-4o-realtime-preview-2024-12-17");
  url.searchParams.set("voice", "alloy");
  const response = await fetch(url, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/sdp",
    },
  });
  const answer = {
    type: "answer" as RTCSdpType,
    sdp: await response.text(),
  };
  return answer;
}
