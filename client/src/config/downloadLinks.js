// =============================================================================
// AniSave — App Download Links
// =============================================================================
// Single source of truth for the /download page. Update this file every time
// you ship a new build. See the setup instructions for how to upload files to
// Supabase Storage and get the exact URL to paste below.
//
// IMPORTANT: replace SUPABASE_URL with your actual project URL (the same one
// you use in supabase.jsx), and make sure the bucket name matches exactly
// what you create in the Supabase dashboard.
// =============================================================================

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co"; // <-- replace me
const BUCKET = "app-downloads"; // <-- must match your Supabase Storage bucket name

// Builds a Supabase Storage public URL that FORCES an automatic file download
// (instead of opening the file in a new browser tab). The `?download=` query
// param tells Supabase to send back a `Content-Disposition: attachment` header.
const buildDownloadUrl = (path, filename) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}?download=${encodeURIComponent(filename)}`;

export const DOWNLOAD_LINKS = {
  android: {
    // path = where the file lives INSIDE the bucket, e.g. "android/AniSave.apk"
    url: buildDownloadUrl("android/AniSave.apk", "AniSave.apk"),
    version: "v1.0.0",
    size: "~24 MB",
    external: false,
  },
  windows: {
    url: buildDownloadUrl("windows/AniSave-Setup.msi", "AniSave-Setup.msi"),
    version: "v1.0.0",
    size: "~68 MB",
    external: false,
  },
  mac: {
    url: buildDownloadUrl("mac/AniSave.dmg", "AniSave.dmg"),
    version: "v1.0.0",
    size: "~72 MB",
    external: false,
  },
  ios: {
    // Apple does not allow direct-file "sideloading" the way Android/Windows/
    // Mac do. Point this at your TestFlight public link (or your App Store
    // URL once AniSave is published) instead of a raw .ipa file.
    url: "https://testflight.apple.com/join/REPLACE_WITH_YOUR_CODE",
    version: "v1.0.0",
    size: "Via TestFlight",
    external: true,
  },
};