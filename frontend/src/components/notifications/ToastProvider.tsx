import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },

        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        },
      }}
    />
  );
};

export default ToastProvider;