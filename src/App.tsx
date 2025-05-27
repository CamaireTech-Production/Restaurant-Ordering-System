import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './contexts/CartContext';
import { TableProvider } from './contexts/TableContext';
import Header from './components/layout/Header';
import ClientPage from './pages/ClientPage';
import ReceptionistPage from './pages/ReceptionistPage';

function App() {
  return (
    <Router>
      <TableProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="pb-12">
              <Routes>
                <Route path="/" element={<ClientPage />} />
                <Route path="/receptionist" element={<ReceptionistPage />} />
              </Routes>
            </main>
            <Toaster position="bottom-center" />
          </div>
        </CartProvider>
      </TableProvider>
    </Router>
  );
}

export default App;