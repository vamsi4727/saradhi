import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-6">
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
}
