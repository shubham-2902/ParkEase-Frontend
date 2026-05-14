import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, Navigation, Filter,
  SlidersHorizontal, Star, Clock,
  ChevronRight, RefreshCw, Zap,
} from 'lucide-react';
import parkingLotApi from '../../api/parkingLotApi';
import Button from '../../components/ui/Button';
import { SectionLoader } from '../../components/ui/Spinner';
import { LotStatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import {
  formatCurrency,
  getErrorMessage,
  isLotCurrentlyOpen,
} from '../../utils/helpers';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query    = searchParams.get('q')      || '';
  const lat      = searchParams.get('lat')    || '';
  const lng      = searchParams.get('lng')    || '';
  const isNearby = searchParams.get('nearby') === 'true';

  const [lots,        setLots]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [searchInput, setSearchInput] = useState(query);
  const [radiusKm,    setRadiusKm]    = useState(10);

  // ── Load results ──────────────────────────────────────────────
  const loadResults = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let response;

      if (isNearby && lat && lng) {
        response = await parkingLotApi.getNearbyLots(
          parseFloat(lat),
          parseFloat(lng),
          radiusKm
        );
      } else if (query) {
        // Try city search first, then keyword search
        try {
          response = await parkingLotApi.getLotsByCity(query);
          if (!response.data?.length) {
            response = await parkingLotApi.searchLots(query);
          }
        } catch {
          response = await parkingLotApi.searchLots(query);
        }
      } else {
        response = await parkingLotApi.getAllApprovedLots();
      }

      setLots(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query, lat, lng, isNearby, radiusKm]);

  useEffect(() => { loadResults(); }, [loadResults]);

  // ── Handle new search ─────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ q: searchInput.trim() });
  };

  // ── Handle nearby refresh ─────────────────────────────────────
  const handleNearbySearch = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setSearchParams({
        lat:    coords.latitude,
        lng:    coords.longitude,
        nearby: 'true',
      });
    });
  };

  const pageTitle = isNearby
    ? 'Parking near you'
    : query
    ? `Results for "${query}"`
    : 'All parking lots';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                    py-6 sm:py-10">

      {/* ── Search bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100
                      shadow-card p-4 mb-6">
        <form onSubmit={handleSearch}>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2
                            px-3 rounded-lg border border-slate-200
                            focus-within:ring-2 focus-within:ring-blue-500
                            bg-white">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search city, area, landmark..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 py-2.5 text-sm text-slate-900
                           placeholder:text-slate-400 outline-none"
              />
            </div>
            <Button type="submit" size="md">
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleNearbySearch}
              icon={<Navigation className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Near me</span>
            </Button>
          </div>
        </form>

        {/* Nearby radius slider */}
        {isNearby && (
          <div className="mt-3 flex items-center gap-3 pt-3
                          border-t border-slate-100">
            <span className="text-xs text-slate-500 flex-shrink-0">
              Radius:
            </span>
            <input
              type="range"
              min="1"
              max="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="text-xs font-medium text-slate-700
                             w-12 text-right flex-shrink-0">
              {radiusKm} km
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={loadResults}
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* ── Title + count ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {pageTitle}
          </h1>
          {!loading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {lots.length} lot{lots.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadResults}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError('')}
          className="mb-5"
        />
      )}

      {/* ── Loading ───────────────────────────────────────────── */}
      {loading && (
        <SectionLoader message="Finding available parking..." />
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!loading && lots.length === 0 && (
        <EmptyState
          icon={<MapPin className="w-8 h-8" />}
          title="No parking lots found"
          message={
            query
              ? `No results for "${query}". Try a different city or keyword.`
              : 'No parking lots available in this area.'
          }
          action={() => navigate('/')}
          actionLabel="Try another search"
        />
      )}

      {/* ── Results grid ──────────────────────────────────────── */}
      {!loading && lots.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Lot Card Component ─────────────────────────────────────────
const LotCard = ({ lot }) => {
  const navigate = useNavigate();
  const isOpen = isLotCurrentlyOpen(lot);

  const occupancyPercent = lot.totalSpots > 0
    ? Math.round(
        ((lot.totalSpots - lot.availableSpots)
          / lot.totalSpots) * 100
      )
    : 0;

  const occupancyColor =
    occupancyPercent >= 90 ? 'text-red-600 bg-red-50' :
    occupancyPercent >= 60 ? 'text-amber-600 bg-amber-50' :
                             'text-emerald-600 bg-emerald-50';

  return (
    <div className={`card hover:shadow-md transition-all duration-200
                    cursor-pointer group border border-slate-100
                    ${!isOpen ? 'grayscale-[0.7] opacity-75 bg-slate-50/50' : ''}`}
         onClick={() => navigate(`/lots/${lot.id}`)}>

      {/* Image placeholder / actual image */}
      <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200
                      rounded-xl mb-4 overflow-hidden relative">
        {lot.imageUrl ? (
          <img
            src={lot.imageUrl}
            alt={lot.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center
                          justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-300 rounded-xl
                              flex items-center justify-center
                              mx-auto mb-2">
                <MapPin className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-xs text-slate-400">
                No image
              </p>
            </div>
          </div>
        )}

        {/* Distance badge for nearby search */}
        {lot.distanceKm != null && (
          <div className="absolute top-2 right-2 bg-white/90
                          backdrop-blur px-2 py-1 rounded-full
                          text-xs font-medium text-slate-700
                          flex items-center gap-1">
            <Navigation className="w-3 h-3 text-blue-500" />
            {lot.distanceKm.toFixed(1)} km
          </div>
        )}

        {/* Open/Closed badge */}
        <div className={`
          absolute top-2 left-2 px-2 py-0.5 rounded-full
          text-[10px] font-semibold
          ${isOpen
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'bg-slate-500 text-white'
          }
        `}>
          {isOpen ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      {/* Content */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-slate-900 text-sm
                         leading-tight group-hover:text-blue-600
                         transition-colors line-clamp-1">
            {lot.name}
          </h3>
          <span className="text-sm font-bold text-blue-600
                           flex-shrink-0">
            ₹{lot.pricePerHour}/hr
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500
                        text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lot.address}, {lot.city}</span>
        </div>

        {/* Availability bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Availability</span>
            <span className={`font-medium px-1.5 py-0.5 rounded
                              text-[10px] ${occupancyColor}`}>
              {lot.availableSpots} / {lot.totalSpots} spots
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                occupancyPercent >= 90 ? 'bg-red-500' :
                occupancyPercent >= 60 ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Operating hours */}
        {(lot.openTime || lot.closeTime) && (
          <div className="flex items-center gap-1 text-xs
                          text-slate-400 mb-3">
            <Clock className="w-3 h-3" />
            {lot.openTime || '00:00'} – {lot.closeTime || '24:00'}
          </div>
        )}

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {lot.hasEV && (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700
                             text-[10px] font-medium rounded-full
                             flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />EV
            </span>
          )}
        </div>

        {/* View details button */}
        <Button
          fullWidth
          size="sm"
          variant={isOpen ? 'primary' : 'secondary'}
          icon={<ChevronRight className="w-4 h-4" />}
        >
          {isOpen ? 'View & Book' : 'View Details (Closed)'}
        </Button>
      </div>
    </div>
  );
};

export default SearchResultsPage;