import React, { useEffect, useState } from 'react';
import { getProfilePicUrl } from './authSync';

const fallbackImage = '/assets/profiles/default.svg';

export default function ProfileImage({ pic, alt = 'Profile', className, style, ...props }) {
  const filename = pic && String(pic).replace(/\\/g, '/').split('/').pop();
  const [source, setSource] = useState(getProfilePicUrl(pic));
  const [triedAssetPath, setTriedAssetPath] = useState(false);

  useEffect(() => {
    setSource(getProfilePicUrl(pic));
    setTriedAssetPath(false);
  }, [pic]);

  const handleError = () => {
    if (filename && !triedAssetPath) {
      setTriedAssetPath(true);
      setSource(`http://localhost:5000/assets/profiles/${filename}`);
      return;
    }
    setSource(fallbackImage);
  };

  return <img {...props} className={className} style={style} src={source} alt={alt} onError={handleError} />;
}
