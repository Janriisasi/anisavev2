import React from "react";
import { Link } from "react-router-dom";

// Simple 5-wide bitmap fonts for the two digits we need — each 1 becomes
// a filled block. Scaled up big, this gives the same chunky pixel-art
// feel as the reference without reusing anyone else's exact glyph art.
const FOUR = [
  [0, 0, 0, 1, 0],
  [0, 0, 1, 1, 0],
  [0, 1, 0, 1, 0],
  [1, 0, 0, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 1, 0],
  [0, 0, 0, 1, 0],
];

const ZERO = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

const CELL = 14;
const CELL_GAP = 3;

// Plain inline styles here on purpose — this avoids depending on Tailwind's
// JIT picking up brand-new arbitrary-value classes it hasn't generated
// before, which is what caused the blocks to disappear.
function PixelDigit({ pattern }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${pattern[0].length}, ${CELL}px)`,
        gap: `${CELL_GAP}px`,
      }}
    >
      {pattern.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: CELL,
              height: CELL,
              backgroundColor: cell ? "#064e3b" : "transparent",
            }}
          />
        )),
      )}
    </div>
  );
}

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-white flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Link to="/" className="inline-flex justify-center mb-8 md:mb-10">
          <img
            src="/images/invertedcolor_logo.webp"
            alt="AniSave"
            className="h-16 md:h-20 w-auto"
          />
        </Link>

        <span className="text-xs font-medium tracking-widest uppercase text-green-700 mb-6 md:mb-8">
          Page not found
        </span>

        <div
          style={{ display: "flex", alignItems: "flex-end", gap: 20 }}
          className="mb-10 md:mb-14"
          aria-hidden="true"
        >
          <PixelDigit pattern={FOUR} />
          <PixelDigit pattern={ZERO} />
          <PixelDigit pattern={FOUR} />
        </div>

        <h1 style={visuallyHidden}>Page not found</h1>
        <p className="text-sm md:text-base text-gray-600 mb-10 max-w-sm">
          This page didn't make it to market. If you think this is a mistake, please contact the support team at <a href="https://mail.google.com/" className="font-semibold text-green-800 hover:cursor-pointer">anisave14@gmail.com</a>
        </p>

        <Link
          to="/homepage"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase border border-solid border-green-700 text-white px-6 py-3 rounded-full bg-green-700 cursor-pointer hover:bg-green-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
        >
          Return home
        </Link>
      </main>
    </div>
  );
}