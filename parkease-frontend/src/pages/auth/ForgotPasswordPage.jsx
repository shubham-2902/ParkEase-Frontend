import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('http://localhost:8080/api/v1/auth/forgot-password', { email });
            alert('OTP sent to your email!');
            setStep(2);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        
        setIsLoading(true);
        try {
            await axios.post('http://localhost:8080/api/v1/auth/reset-password', {
                token: otp, // OTP is sent as the token
                newPassword
            });
            alert('Password reset successfully!');
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {step === 1 ? <Mail className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>
                    <h1 className="text-2xl font-bold">
                        {step === 1 ? 'Forgot Password?' : 'Verify OTP'}
                    </h1>
                    <p className="text-blue-100 text-sm mt-2">
                        {step === 1 
                            ? 'Enter your email to receive a 6-digit verification code.' 
                            : `We've sent a code to ${email}`}
                    </p>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <Input
                                label="Email Address"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                leftIcon={<Mail className="w-4 h-4" />}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                loading={isLoading}
                                icon={<ArrowRight className="w-4 h-4" />}
                            >
                                Send OTP
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <Input
                                label="6-Digit OTP"
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                className="text-center text-2xl tracking-[1em] font-bold"
                            />
                            <Input
                                label="New Password"
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                leftIcon={<Lock className="w-4 h-4" />}
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                leftIcon={<Lock className="w-4 h-4" />}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                loading={isLoading}
                            >
                                Reset Password
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-sm text-slate-500 hover:text-blue-600 font-medium"
                            >
                                ← Change email
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center pt-6 border-t border-slate-100">
                        <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-blue-600">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
