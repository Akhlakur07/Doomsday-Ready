import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import BookingPage from './pages/BookingPage';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import RewatchPlanPage from './pages/RewatchPlanPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="rewatch-plan" element={<RewatchPlanPage />} />
        <Route path="booking" element={<BookingPage />} />
      </Route>
    </Routes>
  );
}
