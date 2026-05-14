import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Navigation, Zap,
  Shield, Clock, Star, ChevronRight,
  ParkingSquare, Smartphone,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { SectionLoader } from '../../components/ui/Spinner';
import parkingLotApi from '../../api/parkingLotApi';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';

const HomePage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]   = useState('');
  const [searching, setSearching]       = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [error, setError]               = useState('');

  // ── Search by city / keyword ──────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      navigate(
        `/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  // ── Search by GPS location ────────────────────────────────────
  const handleNearbySearch = () => {
    setNearbyLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setNearbyLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        navigate(
          `/search?lat=${coords.latitude}&lng=${coords.longitude}&nearby=true`
        );
        setNearbyLoading(false);
      },
      () => {
        setError('Unable to get location. Please allow location access.');
        setNearbyLoading(false);
      }
    );
  };

  return (
    <div>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br
                           from-blue-600 via-blue-700 to-blue-800
                           overflow-hidden">

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px]
                          bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80
                          bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64
                          bg-white/3 rounded-full
                          transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto
                        px-4 sm:px-6 lg:px-8
                        py-20 sm:py-28 lg:py-32">

          <div className="max-w-2xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5
                            bg-white/10 rounded-full text-white/90
                            text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Smart Parking Platform — India
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl
                           font-bold text-white leading-tight mb-6">
              Park smarter,<br />
              <span className="text-blue-200">
                stress less.
              </span>
            </h1>

            <p className="text-blue-100 text-lg sm:text-xl
                          leading-relaxed mb-10 max-w-lg">
              Find available parking spots near you, reserve in
              seconds, and pay online. No more circling the block.
            </p>

            {/* Search box */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl
                            max-w-xl">
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2
                                  px-3">
                    <Search className="w-5 h-5 text-slate-400
                                       flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by city, area or landmark..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 text-slate-900 text-sm
                                 placeholder:text-slate-400
                                 outline-none py-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={searching}
                    size="md"
                    className="flex-shrink-0"
                  >
                    Search
                  </Button>
                </div>
              </form>

              {/* Separator */}
              <div className="flex items-center gap-2 px-3 mt-2 mb-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Nearby button */}
              <button
                onClick={handleNearbySearch}
                disabled={nearbyLoading}
                className="w-full flex items-center justify-center
                           gap-2 py-2.5 px-3 text-sm text-blue-600
                           hover:bg-blue-50 rounded-xl font-medium
                           transition-colors disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
                {nearbyLoading
                  ? 'Getting location...'
                  : 'Find parking near me'
                }
              </button>
            </div>

            {error && (
              <p className="mt-3 text-red-200 text-sm flex
                            items-center gap-1">
                {error}
              </p>
            )}

            {/* Popular cities */}
            <div className="flex items-center gap-2 mt-6 flex-wrap">
              <span className="text-blue-200 text-sm">Popular:</span>
              {[
                'Mumbai', 'Delhi', 'Bangalore',
                'Pune', 'Hyderabad', 'Chennai',
              ].map((city) => (
                <button
                  key={city}
                  onClick={() => navigate(
                    `/search?q=${city}`
                  )}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20
                             text-white text-xs rounded-full
                             transition-colors font-medium"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <section className="bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+',  label: 'Parking lots'     },
              { value: '50K+',  label: 'Happy drivers'    },
              { value: '10+',   label: 'Cities covered'   },
              { value: '99.9%', label: 'Uptime guarantee' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">
                  {value}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              How ParkEase works
            </h2>
            <p className="text-slate-500 mt-3 max-w-md mx-auto">
              Reserve your spot in minutes — no calls, no hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step:  '01',
                icon:  Search,
                title: 'Search',
                desc:  'Search parking by city, area, or use GPS to find nearby lots.',
                color: 'blue',
              },
              {
                step:  '02',
                icon:  MapPin,
                title: 'Choose Spot',
                desc:  'View real-time availability, spot types, and pricing.',
                color: 'emerald',
              },
              {
                step:  '03',
                icon:  ParkingSquare,
                title: 'Reserve',
                desc:  'Book in advance or walk in. Your spot is held instantly.',
                color: 'amber',
              },
              {
                step:  '04',
                icon:  Smartphone,
                title: 'Park & Pay',
                desc:  'Check in digitally, check out, and pay online via Razorpay.',
                color: 'violet',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => {
              const colors = {
                blue:    'bg-blue-50 text-blue-600',
                emerald: 'bg-emerald-50 text-emerald-600',
                amber:   'bg-amber-50 text-amber-600',
                violet:  'bg-violet-50 text-violet-600',
              };
              return (
                <div key={step} className="relative text-center">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center
                    justify-center mx-auto mb-4
                    ${colors[color]}
                  `}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="absolute -top-2 left-1/2
                                  -translate-x-1/2 text-[10px]
                                  font-bold text-slate-300
                                  tracking-widest">
                    {step}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything you need
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon:  Zap,
                title: 'Real-time availability',
                desc:  'See live spot counts before you go. No surprises.',
                color: 'amber',
              },
              {
                icon:  Shield,
                title: 'Secure payments',
                desc:  'Pay via card, UPI, or wallet — all through Razorpay.',
                color: 'emerald',
              },
              {
                icon:  Clock,
                title: 'Flexible booking',
                desc:  'Pre-book or walk in. Extend your stay anytime.',
                color: 'blue',
              },
              {
                icon:  Navigation,
                title: 'GPS discovery',
                desc:  'Find the nearest available parking using your location.',
                color: 'violet',
              },
              {
                icon:  Star,
                title: 'EV charging',
                desc:  'Filter for EV charging spots at supported locations.',
                color: 'emerald',
              },
              {
                icon:  Smartphone,
                title: 'Digital check-in',
                desc:  'Check in and out via the app — no tickets, no queues.',
                color: 'blue',
              },
            ].map(({ icon: Icon, title, desc, color }) => {
              const colors = {
                blue:    { bg: 'bg-blue-50',   icon: 'text-blue-600'   },
                emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600'},
                amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600'  },
                violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600' },
              };
              const c = colors[color];
              return (
                <div key={title} className="card hover:shadow-md
                                            transition-shadow">
                  <div className={`w-10 h-10 rounded-xl
                                   flex items-center justify-center
                                   mb-4 ${c.bg}`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to park smarter?
          </h2>
          <p className="text-blue-100 mb-8">
            Join 50,000+ drivers already using ParkEase.
            Create your free account in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3
                          justify-center">
            <Button
              variant="ghost"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/register')}
              size="lg"
            >
              Get started free
            </Button>
            <Button
              variant="ghost"
              className="border border-white/40 text-white
                         hover:bg-white/10"
              onClick={() => navigate('/')}
              size="lg"
            >
              Browse parking
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;