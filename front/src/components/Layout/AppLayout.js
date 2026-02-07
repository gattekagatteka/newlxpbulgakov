import React from 'react';
import { Outlet } from 'react-router-dom';

import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

export default function AppLayout() {
  return (
    <div className="appRoot">
      <AppHeader />
      <main className="appMain">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
