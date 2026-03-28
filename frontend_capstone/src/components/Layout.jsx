import { Outlet } from 'react-router-dom';
import Sidebar from './Navbar';
import PageTransition from './PageTransition';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors">
      <Sidebar />
      {/* Main content: offset by header height (56px) + sidebar width (256px on md+) */}
      <main className="md:ml-64 pt-14 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
