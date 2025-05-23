"use client";

import { cn } from "./lib/utils";
import { PRODUCTS, useBasket } from "./mocks";
import { useRealtime } from "./realtime/useRealtime";

export default function Home() {
  const { addProduct, removeProduct, basket, clearBasket } = useBasket();
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
    <div className="h-screen flex flex-col gap-4 p-4">
      {/* HEADER */}
      <div className="flex gap-2 justify-between">
        <h1 className="text-2xl font-bold">Realtime Test</h1>
        <p className="p-2 px-4 rounded-md bg-white/10">{status}</p>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        {status !== "connected" && (
          <button
            className="bg-blue-900 text-white px-4 py-2 rounded-md disabled:bg-gray-900"
            onClick={connect}
            disabled={status !== "idle"}
          >
            Connect
          </button>
        )}
        {status === "connected" && (
          <>
            <button
              className="bg-red-700 text-white px-4 py-2 rounded-md disabled:bg-gray-900"
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
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 overflow-hidden">
        {/* PRODUCTS */}
        <div className="flex flex-col gap-2 flex-1 border p-6 border-white/20 rounded-xl">
          <h2 className="text-lg font-semibold">Products</h2>
          <hr className="border-white/20" />
          <div className="grid gap-2 grid-cols-3">
            {PRODUCTS.map((product) => (
              <div
                onClick={() => addProduct(product)}
                className="bg-zinc-900  text-3xl flex-1 justify-center items-center text-center border border-white/20 p-2 rounded-md cursor-pointer"
                key={product.name}
              >
                {product.emoji}
              </div>
            ))}
          </div>
        </div>
        {/* BASKET */}
        <div className="flex flex-col gap-2 flex-1 border p-6 border-white/20 rounded-xl">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Basket</h2>
            {basket.length > 0 && (
              <button
                className="bg-red-900 text-white rounded-md py-1 px-2 text-xs cursor-pointer"
                onClick={clearBasket}
              >
                Clear
              </button>
            )}
          </div>
          <hr className="border-white/20" />
          {basket.length > 0 ? (
            <div className="grid gap-2 grid-cols-3">
              {basket.map((product) => (
                <div
                  onClick={() => removeProduct(product)}
                  className="bg-zinc-900 relative text-3xl flex-1 justify-center items-center text-center border border-white/20 p-2 rounded-md cursor-pointer"
                  key={product.name}
                >
                  <span className="absolute top-0 right-0 p-1 text-xs">
                    {product.quantity}
                  </span>
                  {product.emoji}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full text-center text-white/50 flex-1 justify-center items-center">
              No products in basket
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Conversation */}
        <div className="flex flex-col gap-2 flex-1 border p-6 border-white/20 rounded-xl overflow-hidden">
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
        <div className="overflow-hidden flex flex-col gap-2 flex-1 border p-6 border-white/20 rounded-xl">
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
