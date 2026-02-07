import React from 'react';

export default function Button({ className = '', variant = 'primary', size = 'md', ...props }) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...props} />;
}
