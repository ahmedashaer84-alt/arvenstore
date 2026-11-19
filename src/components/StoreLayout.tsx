import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function StoreLayout() {
  return (
    <div className="store-shell">
      <Navbar />
      <main className="store-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
