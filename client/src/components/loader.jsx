import React from 'react';
import aniLogo from '../assets/ani_logo.svg';
import anisave from '../assets/anisave_logo.png';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-28 h-28 border-8 text-green-800 animate-spin border-gray-300 border-t-green-800 rounded-full" />
        <img 
          src={aniLogo}
          alt="AniSave"
          className="w-16 h-16 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
}

export default Loader;
