// =============================================================================
// AniSave — App Download Links
// =============================================================================
// Single source of truth for the /download page. Update this file every time
// you ship a new build.
// =============================================================================

const SUPABASE_URL = "https://mdtagnihuqecnikuccsg.supabase.co";
const BUCKET = "app-downloads";

// Builds a Supabase Storage public URL that FORCES an automatic file download
// (instead of opening the file in a new browser tab). The `?download=` query
// param tells Supabase to send back a `Content-Disposition: attachment` header.
const buildDownloadUrl = (path, filename) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}?download=${encodeURIComponent(filename)}`;

export const DOWNLOAD_LINKS = {
  android: {
    url: buildDownloadUrl(
      "android/app-arm64-release.apk",
      "AniSave.apk"
    ),
    version: "v0.1.0",
    size: "18.3 MB",
    external: false,
  },
  windows: {
    url: buildDownloadUrl(
      "windows/AniSave_0.1.0_x64-setup.exe",
      "AniSave_0.1.0_x64-setup.exe"
    ),
    version: "v0.1.0",
    size: "13.4 MB",
    external: false,
  },
  mac: {
    // TODO: upload the .dmg, then update this path/filename
    url: buildDownloadUrl("mac/AniSave.dmg", "AniSave.dmg"),
    version: "v0.1.0",
    size: "TBD",
    external: false,
  },
  ios: {
    // Apple requires TestFlight or the App Store — point this at your
    // TestFlight public link once you have one.
    url: "https://testflight.apple.com/join/REPLACE_WITH_YOUR_CODE",
    version: "v0.1.0",
    size: "Via TestFlight",
    external: true,
  },
};