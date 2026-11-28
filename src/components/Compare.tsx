import Link from "next/link";
import { COMPARE } from "@/lib/membership";

/**
 * Private and Assured in one glance. On the price screen it tells a newcomer there is nothing to decide;
 * on the membership page it opens the comparison before the detail.
 */
export function Compare({ onPrice = false }: { onPrice?: boolean }) {
  return (
    <div className="vs" role="table" aria-label="Private and Assured compared">
      <div className="vs-hd" role="row">
        <span role="columnheader" />
        <span role="columnheader"><b>Private</b><small>{onPrice ? "This booking" : "Everyone"}</small></span>
        <span role="columnheader" className="as"><b>Assured</b><small>For frequent flyers</small></span>
      </div>
      {COMPARE.map(([k, a, b]) => (
        <div className="vs-rw" role="row" key={k}>
          <span role="rowheader" className="k">{k}</span><span role="cell">{a}</span><span role="cell" className="as">{b}</span>
        </div>
      ))}
      <p className="vs-you">
        {onPrice
          ? <><b>You need to decide nothing.</b> Every first booking is Private, and free. Assured is there if you fly often. <Link href="/membership">More</Link></>
          : <><b>Both:</b> a firm price at once, one tap to book, nothing to pay until confirmed, and your Dedicated Advisor.</>}
      </p>
    </div>
  );
}
