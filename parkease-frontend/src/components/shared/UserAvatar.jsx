import React from 'react';

const UserAvatar = ({
  name,
  imageUrl,
  size = 'md',
  className = '',
}) => {

  const sizes = {
    sm:  'w-7 h-7 text-xs',
    md:  'w-9 h-9 text-sm',
    lg:  'w-12 h-12 text-base',
    xl:  'w-16 h-16 text-xl',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`rounded-full object-cover flex-shrink-0
                    ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full bg-blue-600 text-white
        flex items-center justify-center
        font-semibold flex-shrink-0
        ${sizes[size]} ${className}
      `}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;