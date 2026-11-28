"use client";
import Link from "next/link";
import { openChat } from "../ChatWidget";

export function OfficeHead({ name, stamp }: { name: string; stamp: string }) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="om">
      <div>
        <div className="eyebrow">Private Office</div>
        <h1 className="oh" suppressHydrationWarning>{greet}, {name}</h1>
        <p className="sub" style={{ margin: 0 }}>{stamp}. Your Dedicated Advisor is one message away.</p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn" href="/">Plan a flight</Link>
        <button className="btn ghost" type="button" onClick={() => openChat()}>Chat with your advisor</button>
      </div>
    </div>
  );
}
