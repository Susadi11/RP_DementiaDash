import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-secondaryBg flex flex-col">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      
      {/* Main container below navbar */}
      <div className="flex pt-[73px]">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-[73px] bottom-0 z-40">
          <Sidebar />
        </div>
        
        {/* Scrollable main content - offset by sidebar width */}
        <main className="flex-1 ml-64 p-8 min-h-[calc(100vh-73px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
