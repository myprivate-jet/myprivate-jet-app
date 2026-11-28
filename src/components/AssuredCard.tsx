/** The Assured membership, shown as the object it feels like: a card in the hand. Pure CSS, no image. */
export function AssuredCard({ holder, size = "md" }: { holder?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`acard acard-${size}`} role="img" aria-label={`Assured membership card${holder ? ` for ${holder}` : ""}`}>
      <div className="acard-top"><span className="acard-brand">MyPrivate<b>·</b>Jet</span><span className="acard-chip" aria-hidden="true" /></div>
      <div className="acard-tier">Assured</div>
      <div className="acard-foot"><span>{holder ?? "Your name"}</span><span>Aircraft guaranteed</span></div>
    </div>
  );
}
