import { createClient } from '@/lib/supabase/server';

/**
 * Server component that fetches active tracking pixels from Supabase
 * and renders the appropriate <script> tags for injection into <head>.
 */

interface Pixel {
  id: string;
  name: string;
  type: string;
  mode: string;
  pixel_id: string | null;
  code: string | null;
  active: boolean;
}

async function getActivePixels(): Promise<Pixel[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pixels')
      .select('*')
      .eq('active', true);

    if (error) {
      // Silently fail — pixels table may not exist yet or query failed
      return [];
    }
    return data ?? [];
  } catch {
    // Fail gracefully during build or if cookies() unavailable
    return [];
  }
}

function generateFacebookPixelScript(pixelId: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
}

function generateTikTokPixelScript(pixelId: string): string {
  return `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${pixelId}');ttq.page();}(window,document,'ttq');`;
}

export async function TrackingPixels() {
  const pixels = await getActivePixels();

  if (pixels.length === 0) return null;

  const scripts: string[] = [];

  for (const pixel of pixels) {
    if (pixel.type === 'facebook' && pixel.mode === 'id' && pixel.pixel_id) {
      scripts.push(generateFacebookPixelScript(pixel.pixel_id));
    } else if (pixel.type === 'tiktok' && pixel.mode === 'id' && pixel.pixel_id) {
      scripts.push(generateTikTokPixelScript(pixel.pixel_id));
    } else if (pixel.code) {
      // For snippet mode or other types, inject the raw code
      // Strip <script> tags for dangerouslySetInnerHTML
      const cleaned = pixel.code
        .replace(/<script[^>]*>/gi, '')
        .replace(/<\/script>/gi, '');
      scripts.push(cleaned);
    }
  }

  if (scripts.length === 0) return null;

  return (
    <>
      {scripts.map((script, i) => (
        <script
          key={i}
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ))}
    </>
  );
}
