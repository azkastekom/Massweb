import { useState } from 'react';
import { useNavigate, Link, createFileRoute, redirect } from '@tanstack/react-router';
import { Card, Input, Button } from '@heroui/react';
import { useAuth } from '../contexts/auth-context';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      throw redirect({ to: '/projects' });
    }
  },
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName || undefined,
      });
      navigate({ to: '/projects' });
    } catch (error: any) {
      // Check if registration is disabled
      if (error?.response?.data?.message?.includes('disabled')) {
        setSignupDisabled(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Get started with Massweb</p>
        </div>

        {signupDisabled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Registration Disabled</h3>
              <p className="text-sm text-red-700">
                New user registration is currently disabled by the administrator.
                Please contact support for access.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="Full Name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            fullWidth
          />

          <Input
            type="password"
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            fullWidth
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            fullWidth
          />

          <div className="border-t pt-4">
            <Input
              type="text"
              label="Organization Name (Optional)"
              placeholder="Your company or team name"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              fullWidth
              description="Create your first organization now, or do it later"
            />
          </div>

          <Button
            type="submit"
            color="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            isDisabled={signupDisabled}
          >
            Create Account
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
