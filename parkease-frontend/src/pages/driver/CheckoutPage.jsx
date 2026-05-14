import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCard, Clock, MapPin, Car,
  CheckCircle2, AlertCircle, ArrowLeft,
  Zap, Download,
} from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import Button     from '../../components/ui/Button';
import Alert      from '../../components/ui/Alert';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/ui/Badge';
import { SectionLoader } from '../../components/ui/Spinner';
import { RAZORPAY_KEY }  from '../../utils/constants';
import {
  formatDateTime,
  formatCurrency,
  getErrorMessage,
} from '../../utils/helpers';
import { generateReceipt } from '../../utils/pdfGenerator';

// ── Payment steps ──────────────────────────────────────────────
const STEPS = {
  LOADING:    'LOADING',
  SUMMARY:    'SUMMARY',    // Show booking summary
  PROCESSING: 'PROCESSING', // Checkout API call
  PAYMENT:    'PAYMENT',    // Razorpay modal open
  VERIFYING:  'VERIFYING',  // Verify signature
  SUCCESS:    'SUCCESS',    // Payment done
  FAILED:     'FAILED',     // Payment failed
};

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate      = useNavigate();

  const [step,        setStep]        = useState(STEPS.LOADING);
  const [booking,     setBooking]     = useState(null);
  const [orderData,   setOrderData]   = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [alert,       setAlert]       = useState(null);
  const [fare,        setFare]        = useState(null);

  // ── Load booking on mount ─────────────────────────────────────
  useEffect(() => {
    const loadBooking = async () => {
      try {
        const [bookingRes, fareRes] = await Promise.allSettled([
          bookingApi.getBookingById(bookingId),
          bookingApi.calculateFare(bookingId),
        ]);

        if (bookingRes.status === 'fulfilled') {
          setBooking(bookingRes.value.data);
        }
        if (fareRes.status === 'fulfilled') {
          setFare(fareRes.value.data.fare);
        }
        setStep(STEPS.SUMMARY);
      } catch (err) {
        setAlert({ type: 'error', message: getErrorMessage(err) });
        setStep(STEPS.SUMMARY);
      }
    };
    loadBooking();
  }, [bookingId]);

  // ── Step 1: Checkout booking ──────────────────────────────────
  const handleCheckout = async () => {
    setStep(STEPS.PROCESSING);
    setAlert(null);

    try {
      // Call checkout endpoint — booking becomes COMPLETED
      // and booking-service publishes BOOKING_CHECKED_OUT event
      // which triggers payment-service to auto-create order
      const checkoutRes = await bookingApi.checkOut(bookingId);
      const updatedBooking = checkoutRes.data;
      setBooking(updatedBooking);

      // Wait briefly for payment-service to process the event
      // then create Razorpay order
      await new Promise(r => setTimeout(r, 1500));

      // Create Razorpay order
      const orderRes = await paymentApi.createOrder({
        bookingId: parseInt(bookingId),
        userId:    updatedBooking.userId,
        lotId:     updatedBooking.lotId,
        vehicleId: updatedBooking.vehicleId,
        amount:    updatedBooking.totalFare || fare || 0,
        mode:      'CARD',
        description: `Parking fee — Booking #${bookingId}`,
      });

      setOrderData(orderRes.data);
      setStep(STEPS.PAYMENT);

      // ── Step 2: Open Razorpay modal ───────────────────────────
      openRazorpayModal(orderRes.data, updatedBooking);

    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
      setStep(STEPS.SUMMARY);
    }
  };

  // ── Open Razorpay checkout modal ──────────────────────────────
  const openRazorpayModal = (order, bookingData) => {
    const options = {
      // Use key from order response (comes from backend)
      key: order.razorpayKeyId || RAZORPAY_KEY,

      // Amount in paise
      amount: order.amountInPaise,

      currency: order.currency || 'INR',

      // Order ID from backend
      order_id: order.razorpayOrderId,

      name:        'ParkEase',
      description: `Parking — Booking #${bookingId}`,
      image:       '/parking-icon.svg',

      // Pre-fill if available
      prefill: {
        name:  bookingData?.vehiclePlate || '',
        email: '',
        contact: '',
      },

      theme: { color: '#2563eb' },

      // ── SUCCESS HANDLER ──────────────────────────────────────
      handler: async (razorpayResponse) => {
        setStep(STEPS.VERIFYING);
        await verifyPayment(order, razorpayResponse);
      },

      // ── MODAL CLOSE / FAILURE ─────────────────────────────────
      modal: {
        ondismiss: () => {
          setAlert({
            type: 'warning',
            message: 'Payment was not completed. You can retry below.',
          });
          setStep(STEPS.PAYMENT);
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      setAlert({
        type: 'error',
        message: `Payment failed: ${response.error?.description || 'Unknown error'}`,
      });
      setStep(STEPS.FAILED);
    });

    rzp.open();
  };

  // ── Step 3: Verify signature server-side ──────────────────────
  const verifyPayment = async (order, razorpayResponse) => {
    try {
      const verifyRes = await paymentApi.verifyPayment({
        paymentId:         order.paymentId,
        razorpayOrderId:   razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
      });

      setPaymentData(verifyRes.data);
      setStep(STEPS.SUCCESS);

    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Payment verification failed. Please contact support.',
      });
      setStep(STEPS.FAILED);
    }
  };

  // ── Retry payment ─────────────────────────────────────────────
  const handleRetry = () => {
    if (orderData && booking) {
      setStep(STEPS.PAYMENT);
      openRazorpayModal(orderData, booking);
    }
  };

  // ── Download receipt ──────────────────────────────────────────
  const handleDownloadReceipt = async () => {
    try {
      if (paymentData) {
        const res = await paymentApi.generateReceipt(paymentData.id);
        generateReceipt(res.data);
      }
    } catch (err) {
      setAlert({ type: 'error', message: getErrorMessage(err) });
    }
  };

  // ── Render ────────────────────────────────────────────────────

  if (step === STEPS.LOADING) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <SectionLoader message="Loading booking details..." />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* ── Back button ──────────────────────────────────────── */}
      {step !== STEPS.SUCCESS && (
        <button
          onClick={() => navigate('/driver/bookings')}
          className="flex items-center gap-1.5 text-sm
                     text-slate-500 hover:text-slate-900
                     transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to bookings
        </button>
      )}

      {/* ── Success Screen ────────────────────────────────────── */}
      {step === STEPS.SUCCESS && (
        <div className="card text-center py-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-full
                          flex items-center justify-center
                          mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-slate-500 mb-2">
            Your parking session has been completed.
          </p>

          {paymentData && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6
                            text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount paid</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono text-xs text-slate-700
                                 truncate max-w-[180px]">
                  {paymentData.razorpayPaymentId || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <PaymentStatusBadge status={paymentData.status} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              fullWidth
              onClick={handleDownloadReceipt}
              icon={<Download className="w-4 h-4" />}
            >
              Download Receipt (PDF)
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => navigate('/driver/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* ── Processing / Verifying ─────────────────────────────── */}
      {(step === STEPS.PROCESSING ||
        step === STEPS.VERIFYING) && (
        <div className="card">
          <SectionLoader
            message={
              step === STEPS.PROCESSING
                ? 'Processing checkout...'
                : 'Verifying payment...'
            }
          />
          <p className="text-center text-sm text-slate-400 mt-2">
            Please do not close this page.
          </p>
        </div>
      )}

      {/* ── Summary / Payment screens ─────────────────────────── */}
      {(step === STEPS.SUMMARY ||
        step === STEPS.PAYMENT  ||
        step === STEPS.FAILED)  && booking && (
        <>
          {/* Alert */}
          {alert && (
            <Alert
              variant={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Booking summary card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">
                Booking Summary
              </h2>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="space-y-3 text-sm">
              <SummaryRow
                icon={<MapPin className="w-4 h-4" />}
                label="Spot"
                value={`Spot ${booking.spotId} · Lot ${booking.lotId}`}
              />
              <SummaryRow
                icon={<Car className="w-4 h-4" />}
                label="Vehicle"
                value={`${booking.vehiclePlate} (${booking.vehicleType})`}
              />
              <SummaryRow
                icon={<Clock className="w-4 h-4" />}
                label="Check-in"
                value={formatDateTime(booking.checkInTime)}
              />
              <SummaryRow
                icon={<Clock className="w-4 h-4" />}
                label="Check-out"
                value={
                  booking.checkOutTime
                    ? formatDateTime(booking.checkOutTime)
                    : 'Now'
                }
              />
            </div>

            {/* Fare breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100
                            space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Price per hour</span>
                <span className="text-slate-700">
                  {formatCurrency(booking.pricePerHour)}/hr
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-900">Total Fare</span>
                <span className="text-blue-600 text-lg">
                  {formatCurrency(booking.totalFare || fare || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment method hint */}
          <div className="card bg-blue-50 border border-blue-100">
            <div className="flex gap-3">
              <CreditCard className="w-5 h-5 text-blue-600
                                     flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Secure Payment via Razorpay
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Pay with Card, UPI, Net Banking, or Wallet.
                  Powered by Razorpay's secure checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {step === STEPS.SUMMARY && (
            <Button
              fullWidth
              size="lg"
              onClick={handleCheckout}
              icon={<CreditCard className="w-5 h-5" />}
            >
              Checkout & Pay{' '}
              {formatCurrency(booking.totalFare || fare || 0)}
            </Button>
          )}

          {step === STEPS.PAYMENT && (
            <div className="space-y-3">
              <Button
                fullWidth
                size="lg"
                onClick={handleRetry}
                icon={<Zap className="w-5 h-5" />}
              >
                Open Payment Window
              </Button>
              <p className="text-center text-xs text-slate-400">
                Your order has been created.
                Click above to complete payment.
              </p>
            </div>
          )}

          {step === STEPS.FAILED && (
            <div className="space-y-3">
              <Button
                fullWidth
                size="lg"
                onClick={handleRetry}
              >
                Retry Payment
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate('/driver/bookings')}
              >
                Go Back
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Summary Row helper ─────────────────────────────────────────
const SummaryRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-slate-400 flex-shrink-0">{icon}</span>
    <span className="text-slate-500 w-20 flex-shrink-0">{label}</span>
    <span className="text-slate-900 font-medium flex-1">{value}</span>
  </div>
);

export default CheckoutPage;