export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "requesting-ephemeral-token"
  | "creating-peer-connection"
  | "connected"
  | "error";

export type RealtimeClientEventType =
  | "session.update"
  | "input_audio_buffer.append"
  | "input_audio_buffer.commit"
  | "input_audio_buffer.clear"
  | "conversation.item.create"
  | "conversation.item.retrieve"
  | "conversation.item.truncate"
  | "conversation.item.delete"
  | "response.create"
  | "response.cancel"
  | "transcription_session.update"
  | "output_audio_buffer.clear";

export type RealtimeServerEventType =
  | "error"
  | "session.created"
  | "session.updated"
  | "conversation.created"
  | "conversation.item.created"
  | "conversation.item.retrieved"
  | "conversation.item.input_audio_transcription.completed"
  | "conversation.item.input_audio_transcription.delta"
  | "conversation.item.input_audio_transcription.failed"
  | "conversation.item.truncated"
  | "conversation.item.deleted"
  | "input_audio_buffer.committed"
  | "input_audio_buffer.cleared"
  | "input_audio_buffer.speech_started"
  | "input_audio_buffer.speech_stopped"
  | "response.created"
  | "response.done"
  | "response.output_item.added"
  | "response.output_item.done"
  | "response.content_part.added"
  | "response.content_part.done"
  | "response.text.delta"
  | "response.text.done"
  | "response.audio_transcript.delta"
  | "response.audio_transcript.done"
  | "response.audio.delta"
  | "response.audio.done"
  | "response.function_call_arguments.delta"
  | "response.function_call_arguments.done"
  | "transcription_session.updated"
  | "rate_limits.updated"
  | "output_audio_buffer.started"
  | "output_audio_buffer.stopped"
  | "output_audio_buffer.cleared";

export type RealtimeServerEvent =
  // Generic event
  | {
      event_id: string;
      type: Exclude<
        RealtimeServerEventType,
        | "response.audio_transcript.done"
        | "conversation.item.input_audio_transcription.completed"
      >;
      [key: string]: unknown;
    }
  | {
      event_id: string;
      type: "response.audio_transcript.done";
      response_id: string;
      item_id: string;
      output_index: number;
      content_index: number;
      transcript: string;
    }
  | {
      event_id: string;
      type: "conversation.item.input_audio_transcription.completed";
      item_id: string;
      content_index: number;
      transcript: string;
    };

export type RealtimeClientEvent = {
  event_id: string;
  type: RealtimeClientEventType;
  [key: string]: unknown;
};

export type RealtimeEvent = RealtimeClientEvent | RealtimeServerEvent;

export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  status: "speaking" | "processing" | "final";
};

export type RealtimeSession = {
  id: string;
  object: "realtime.session";
  model: string;
  modalities: ("audio" | "text")[];
  instructions: string;
  voice:
    | "alloy"
    | "ash"
    | "ballad"
    | "coral"
    | "echo sage"
    | "shimmer"
    | "verse";
  input_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  output_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  input_audio_transcription: {
    model: "whisper-1";
  };
  turn_detection: null | {
    type: "server_vad";
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
  tools: {
    type: string;
    name: string;
    description: string;
    parameters: object;
  }[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: number | "inf";
  client_secret: {
    value: string;
    expires_at: number;
  };
};

export type RealtimeSessionConfig = {
  model: string;
  modalities: ("text" | "audio")[];
  instructions: string;
  voice:
    | "alloy"
    | "ash"
    | "ballad"
    | "coral"
    | "echo"
    | "fable"
    | "onyx"
    | "nova"
    | "sage"
    | "shimmer"
    | "verse";
  input_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  output_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  input_audio_noise_reduction: {
    type: "near_field" | "far_field";
  } | null;
  input_audio_transcription: {
    model: string; // e.g., "whisper-1" or "gpt-4o-transcribe"
    prompt?: string;
    language?: string;
  } | null;
  turn_detection: {
    type: "server_vad" | "semantic_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    create_response?: boolean;
    // interrupt_response?: boolean — server will not return this
  } | null;
  tools: RealtimeTool[];
  tool_choice: "auto" | "none" | "required" | string;
  temperature: number; // limited to [0.6, 1.2]
  max_response_output_tokens: number | "inf";
};

export type RealtimeTool = {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string }>;
    required: string[];
  };
};
