import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
  const ephemeralUserMessageId = useRef<string | null>(null); // Ephemeral message ID for user audio transcript delta
  const ephemeralAssistantMessageId = useRef<string | null>(null); // Ephemeral message ID for assistant audio transcript delta

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
      case "conversation.item.input_audio_transcription.completed":
      case "conversation.item.input_audio_transcription.failed":
      case "conversation.item.truncated":
      case "conversation.item.deleted":
      case "input_audio_buffer.committed":
      case "input_audio_buffer.cleared":
      case "input_audio_buffer.speech_stopped":
      case "response.created":
      case "response.done":
      case "response.output_item.added":
      case "response.output_item.done":
      case "response.content_part.added":
      case "response.content_part.done":
      case "response.text.delta":
      case "response.text.done":
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

      // Transcribing assistant audio
      case "response.audio_transcript.delta": {
        const ephemeral = ephemeralAssistantMessageId.current;
        if (!ephemeral) {
          createEphemeralMessage("assistant", e.delta);
        } else {
          updateEphemeralMessage("assistant", e.delta);
        }
        break;
      }

      // Assistant audio transcribed
      case "response.audio_transcript.done":
        deleteEphemeralMessage("assistant", e.transcript);
        break;

      // User audio started
      case "input_audio_buffer.speech_started":
        createEphemeralMessage("user", "");
        break;

      // User audio transcribing
      case "conversation.item.input_audio_transcription.delta":
        updateEphemeralMessage("user", e.delta);
        break;

      // User audio transcribed
      case "conversation.item.input_audio_transcription.completed":
        deleteEphemeralMessage("user", e.transcript);
        break;

      default:
        e satisfies never;
        console.log(e);
    }

    // Update event history
    setEvents((prev) => [...prev, e]);
  }

  async function createEphemeralMessage(
    role: UIMessage["role"],
    text: UIMessage["text"]
  ) {
    const id = uuidv4();
    if (role === "user") {
      ephemeralUserMessageId.current = id;
    } else {
      ephemeralAssistantMessageId.current = id;
    }
    const message: UIMessage = {
      id,
      role,
      status: role === "user" ? "speaking" : "processing",
      text,
      timestamp: new Date().toISOString(),
    };
    setConversation((prev) => [
      ...prev.filter((m) => m.role !== role || m.text !== ""), // Remove empty messages of same role
      message,
    ]);
  }

  async function updateEphemeralMessage(
    role: UIMessage["role"],
    text: UIMessage["text"]
  ) {
    const ephemeral =
      role === "user"
        ? ephemeralUserMessageId.current
        : ephemeralAssistantMessageId.current;
    if (ephemeral) {
      setConversation((prev) =>
        prev.map((message) =>
          message.id === ephemeral
            ? { ...message, text: message.text + text }
            : message
        )
      );
    }
  }

  async function deleteEphemeralMessage(
    role: UIMessage["role"],
    text: UIMessage["text"]
  ) {
    const ephemeral =
      role === "user"
        ? ephemeralUserMessageId.current
        : ephemeralAssistantMessageId.current;
    if (ephemeral) {
      setConversation((prev) =>
        prev.map((message) =>
          message.id === ephemeral
            ? { ...message, status: "final", text }
            : message
        )
      );
      if (role === "user") {
        ephemeralUserMessageId.current = null;
      } else {
        ephemeralAssistantMessageId.current = null;
      }
    }
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
            input_audio_transcription: {
              model: "gpt-4o-transcribe",
              prompt:
                "Expect the user to not be a native English speaker. They may have a heavy accent.",
            },
            input_audio_noise_reduction: { type: "near_field" },
            tools: [],
            temperature: 0.6,
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 100,
              silence_duration_ms: 1000,
              create_response: true,
            },
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
