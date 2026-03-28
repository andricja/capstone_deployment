import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import VerifyEmailModal from './auth/VerifyEmailModal';
import {
  Tractor,
  Search,
  ShieldCheck,
  Coins,
  MapPin,
  ArrowRight,
  Star,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'login' | 'register' | 'verify' | null
  const [verifyEmail, setVerifyEmail] = useState('');

  const dashPath = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'owner'
        ? '/owner/dashboard'
        : '/renter/dashboard'
    : null;

  const openLogin = () => setModal('login');
  const openRegister = () => setModal('register');
  const handleClose = () => setModal(null);
  const handleVerifyEmail = (email) => {
    setVerifyEmail(email);
    setModal('verify');
  };

  // Auto-redirect to dashboard when user logs in / registers
  useEffect(() => {
    if (user) {
      const path = user.role === 'admin' ? '/admin/dashboard' : user.role === 'owner' ? '/owner/dashboard' : '/renter/dashboard';
      navigate(path);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* ── Navbar ── */}
      <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-xl">
            <Tractor className="w-7 h-7" />
            <span>FERMs</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-green-700 transition-colors">Features</a>
            <a href="#how" className="hover:text-green-700 transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-green-700 transition-colors">Impact</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashPath} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-green-700 hover:to-emerald-600 transition-colors flex items-center gap-1">
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button onClick={openLogin} className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-700 transition-colors">Login</button>
                <button onClick={openRegister} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-green-700 hover:to-emerald-600 transition-colors">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-gradient-to-br from-green-200 to-emerald-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-100 to-green-50 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-green-200">
            <MapPin className="w-4 h-4" />
            Serving Oriental Mindoro Farmers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight max-w-4xl mx-auto">
            Rent Farm Equipment<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Without the Hassle</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            FERMs connects farmers in Oriental Mindoro with the equipment they need — browse, book, and rent online with our simple farm-size-based system.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openRegister}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-8 py-3.5 rounded-full text-base font-semibold hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg shadow-green-600/25 flex items-center gap-2"
            >
              Start Renting <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={openRegister}
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-3.5 rounded-full text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-green-200 dark:border-green-600 flex items-center gap-2"
            >
              List Your Equipment <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Why Choose FERMs?</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Everything you need to rent or list farm equipment in one platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="w-6 h-6" />}
              title="Browse & Filter"
              desc="Find tractors, harvesters, planters, and more — filter by location and category across Oriental Mindoro municipalities."
            />
            <FeatureCard
              icon={<Coins className="w-6 h-6" />}
              title="Easy Booking"
              desc="Simple and transparent — input your farm size in sqm and the system auto-calculates rental costs instantly."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Admin Verified"
              desc="All equipment listings are reviewed and approved by admins before going live, ensuring quality and trust."
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
              title="Delivery Tracking"
              desc="Specify your delivery address with coordinates — owners can route equipment right to your farm."
            />
            <FeatureCard
              icon={<Tractor className="w-6 h-6" />}
              title="Owner Dashboard"
              desc="Equipment owners get a dedicated dashboard to manage listings, approve requests, and configure GCash."
            />
            <FeatureCard
              icon={<Star className="w-6 h-6" />}
              title="Revenue Reports"
              desc="Admins can generate time-filtered revenue reports and export CSV for auditing and insights."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Get started in just a few steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard step={1} icon={<Users className="w-7 h-7" />} title="Create Account" desc="Sign up as a renter or equipment owner — it's free." />
            <StepCard step={2} icon={<Search className="w-7 h-7" />} title="Enter Farm Size" desc="Input your farm size in sqm to auto-calculate rental duration and costs." />
            <StepCard step={3} icon={<Search className="w-7 h-7" />} title="Browse & Book" desc="Find the equipment you need, then submit a rental request." />
            <StepCard step={4} icon={<CheckCircle className="w-7 h-7" />} title="Get Approved" desc="The owner reviews your request and approves delivery." />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-20 bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Built for Oriental Mindoro</h2>
            <p className="mt-3 text-green-200 max-w-md mx-auto">Empowering local agriculture with accessible equipment rental.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <StatItem value="15+" label="Municipalities Covered" />
            <StatItem value="8" label="Equipment Categories" />
            <StatItem value="₱20" label="Per Point (GCash)" />
            <StatItem value={<Clock className="w-8 h-8 mx-auto" />} label="Quick Approvals" />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Join FERMs today and access the farm equipment you need — or start earning by listing your own.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={openRegister} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-8 py-3.5 rounded-full text-base font-semibold hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg shadow-green-600/25 flex items-center gap-2">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={openLogin} className="text-green-700 font-semibold hover:underline flex items-center gap-1">
              Already have an account? <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-700 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Tractor className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">FERMs</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Farm Equipment Rental &amp; Monitoring System. All rights reserved.</p>
      </footer>

      {/* ── Auth Modals ── */}
      <LoginModal
        open={modal === 'login'}
        onClose={handleClose}
        onSwitchToRegister={() => setModal('register')}
        onVerifyEmail={handleVerifyEmail}
      />
      <RegisterModal
        open={modal === 'register'}
        onClose={handleClose}
        onSwitchToLogin={() => setModal('login')}
        onVerifyEmail={handleVerifyEmail}
      />
      <VerifyEmailModal
        open={modal === 'verify'}
        onClose={handleClose}
        email={verifyEmail}
      />
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-green-200 dark:border-green-700 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ step, icon, title, desc }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 flex items-center justify-center mx-auto mb-4 relative">
        {icon}
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {step}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  );
}

function StatItem({ value, label }) {
  return (
    <div>
      <p className="text-3xl sm:text-4xl font-bold">{value}</p>
      <p className="mt-1 text-green-200 text-sm">{label}</p>
    </div>
  );
}
