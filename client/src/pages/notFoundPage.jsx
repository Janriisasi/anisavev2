import React from "react";
import { Link } from "react-router-dom";

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
        <h1 className="text-xl font-bold tracking-wider uppercase text-green-700 mb-6 md:mb-8">
          Page Not Found
        </h1>

        <div className="mb-10 md:mb-14 max-w-[280px] sm:max-w-md w-full" aria-hidden="true">
          <img
            src="/images/404.svg"
            alt="404"
            className="w-full h-auto mx-auto"
          />
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