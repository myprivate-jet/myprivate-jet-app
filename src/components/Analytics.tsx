import Script from "next/script";

/** Loads analytics only when configured. Plausible needs no cookie banner; the Google tag does in the EU/UK. */
export function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <>
      {plausible && <Script defer data-domain={plausible} src="https://plausible.io/js/script.tagged-events.js" strategy="afterInteractive" />}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="gtag" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('config','${ga}',{anonymize_ip:true});`}</Script>
        </>
      )}
    </>
  );
}
