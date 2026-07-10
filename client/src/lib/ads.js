// ─── Adsterra master switch ───────────────────────────────────────────
// Single source of truth for every Adsterra placement rendered by React:
//   • NativeBanner          (in-article native banner)
//   • ArticleSideAds        (160x600 side rails)
//   • SponsoredCard/Banner/TextLink (Adsterra Direct Link units)
//
// Set to `true` to re-enable all of them at once.
//
// NOTE: the two site-wide Adsterra scripts (Social Bar + Popunder) live in
// client/index.html and are commented out separately — re-enable them there.
export const ADS_ENABLED = false;
