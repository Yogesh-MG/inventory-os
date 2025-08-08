import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, BarChart3, Receipt, Users, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import Tilt from 'react-parallax-tilt';
import { baseUrl } from '@/utils/apiconfig';

const bubbleIcons = [
  { Icon: Package, color: 'text-blue-400', delay: 0 },
  { Icon: ShoppingCart, color: 'text-green-400', delay: 0.2 },
  { Icon: BarChart3, color: 'text-purple-400', delay: 0.4 },
  { Icon: Receipt, color: 'text-orange-400', delay: 0.6 },
  { Icon: Users, color: 'text-pink-400', delay: 0.8 },
  { Icon: Settings, color: 'text-yellow-400', delay: 1.0 },
];

// Updated schema to match Django's expected fields (username, not email)
const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Welcome() {
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const loginResponse = await axios.post<{ access: string; refresh: string }>(
        `${baseUrl}/api/token/`,
        {
          username: data.username,
          password: data.password,
        }
      );

      const { access, refresh } = loginResponse.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async login
      navigate('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      setError(
        error.response?.data?.detail || 'Invalid username or password. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      {/* Animated Particle Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -1000],
              opacity: [0.2, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'loop',
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      {/* Animated Bubbles (Pre-Login Animation) */}
      <AnimatePresence>
        {!showLogin && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {bubbleIcons.map(({ Icon, color, delay }, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.3, 1],
                    opacity: [0, 0.9, 0.7],
                    x: Math.cos((index * 60) * Math.PI / 180) * (120 + index * 60),
                    y: Math.sin((index * 60) * Math.PI / 180) * (120 + index * 60),
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 1.28,
                    delay,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  className="absolute"
                >
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg border border-white/30 flex items-center justify-center ${color} shadow-lg shadow-${color.split('-')[1]}-500/30`}
                  >
                    <Icon size={28} />
                  </div>
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: 360 }}
                transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/50"
              >
                <Package className="w-12 h-12 text-white" />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Screen */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} glareEnable glareMaxOpacity={0.3} glareColor="#ffffff">
              <Card className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden">
                <CardHeader className="text-center py-8">
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/50"
                    >
                      <Package className="w-6 h-6 text-white" />
                    </motion.div>
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-400 font-['Orbitron',sans-serif]">
                      Inventory Pro
                    </CardTitle>
                  </div>
                  <p className="text-white/60 text-sm">Welcome back! Sign in to manage your inventory.</p>
                </CardHeader>
                <CardContent className="px-6 pb-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <Label htmlFor="username" className="text-white/90 text-sm font-medium">
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        {...register('username')}
                        className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-lg transition-all duration-300"
                      />
                      {errors.username && (
                        <p className="text-red-400 text-sm">{errors.username.message}</p>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-3 relative"
                    >
                      <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        {...register('password')}
                        className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-indigo-400 focus:border-transparent rounded-lg transition-all duration-300 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-0 top-6 text-indigo-200/60 hover:text-indigo-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                      {errors.password && (
                        <p className="text-red-400 text-sm">{errors.password.message}</p>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <svg
                            className="animate-spin h-5 w-5 mx-auto text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="text-center"
                    >
                      <button
                        type="button"
                        className="text-white/60 text-sm hover:text-indigo-400 relative group transition-colors duration-300"
                      >
                        Forgot Password?
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-400 group-hover:w-full transition-all duration-300" />
                      </button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </Tilt>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}