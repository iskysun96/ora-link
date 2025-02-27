import React, { useState, useEffect } from 'react';

interface LocationRedirectPanelProps {
  locationUrl: string;
}

const LocationRedirectPanel: React.FC<LocationRedirectPanelProps> = ({ locationUrl }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          window.location.href = locationUrl;
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, [locationUrl]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-orange-100 p-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-orange-500">Redirecting...</h2>
        <p className="mb-4">
          You will be redirected to the following URL in {countdown} seconds:
        </p>
        <div className="bg-orange-50 rounded p-3 mb-4 break-words">
          <a
            href={locationUrl}
            className="text-orange-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {locationUrl}
          </a>
        </div>
        <div className="flex justify-center space-x-4">
          <a
            href={locationUrl}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
          >
            Redirect Now
          </a>
        </div>
      </div>
  );
};

export default LocationRedirectPanel;
