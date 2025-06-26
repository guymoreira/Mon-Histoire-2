import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Notification from '../components/ui/Notification';

function MainLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 pb-16 px-4">
        <Outlet />
      </main>
      
      <Footer />
      
      <Notification />
    </div>
  );
}

export default MainLayout;