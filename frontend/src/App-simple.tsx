import { useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const mockUser = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe'
      };
      handleLogin(mockUser);
    };

    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '400px', 
          width: '100%', 
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#1E40AF',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}>
              ❤️
            </div>
            <h1 style={{ color: '#1E293B', margin: '0 0 10px 0', fontSize: '24px' }}>
              AI Health Assistant00
            </h1>
            <p style={{ color: '#64748B', margin: 0 }}>
              Sign in to access your virtual healthcare companion
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="medical-input"
                placeholder="Enter your email"
                required
                style={{ marginBottom: 0 }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="medical-input"
                placeholder="Enter your password"
                required
                style={{ marginBottom: 0 }}
              />
            </div>

            <button
              type="submit"
              className="medical-button"
              style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            >
              Sign In
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              Demo: Use any email and password to login
            </p>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 0'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#1E40AF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                ❤️
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#1F2937' }}>
                  AI Health Assistant
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                  Your Virtual Healthcare Companion
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="medical-button"
              style={{ backgroundColor: '#6B7280' }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          {/* Welcome Section */}
          <div style={{
            background: 'linear-gradient(to right, #1E40AF, #0D9488)',
            borderRadius: '8px',
            padding: '40px',
            color: 'white',
            marginBottom: '30px'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
              Welcome back, {currentUser?.firstName || 'Patient'}!
            </h2>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Your AI Health Assistant is here to help you manage your healthcare journey.
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[
              { title: 'Upcoming Appointments', value: '2', color: '#1E40AF' },
              { title: 'Active Medications', value: '4', color: '#0D9488' },
              { title: 'Chat Sessions', value: '12', color: '#F97316' },
              { title: 'Health Records', value: '8', color: '#059669' }
            ].map((stat, index) => (
              <div key={index} className="medical-card" style={{ padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '14px' }}>
                      {stat.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: stat.color,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px'
                  }}>
                    📊
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Section */}
          <div className="medical-card" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1F2937' }}>
              💬 AI Health Assistant Chat
            </h3>
            <div style={{ 
              backgroundColor: '#F9FAFB', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>AI Assistant:</p>
              <p style={{ margin: 0, color: '#4B5563' }}>
                Hello {currentUser?.firstName}! I'm your AI Health Assistant. I can help you with:
              </p>
              <ul style={{ margin: '10px 0 0 20px', color: '#4B5563' }}>
                <li>Booking and managing appointments</li>
                <li>Medication questions and information</li>
                <li>General hospital policies and FAQs</li>
                <li>Emotional support and coping strategies</li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                'Book Appointment',
                'Medication Info', 
                'Visiting Hours',
                'Emergency Contact'
              ].map(action => (
                <button 
                  key={action}
                  className="medical-button"
                  style={{ backgroundColor: '#0D9488' }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Health Tips */}
          <div className="medical-card" style={{ padding: '30px', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1F2937' }}>
              💡 Today's Health Tips
            </h3>
            <div style={{ color: '#4B5563' }}>
              <p>✅ Remember to take your morning medications with breakfast</p>
              <p>✅ Stay hydrated - aim for at least 8 glasses of water today</p>
              <p>✅ Your next appointment is in 2 days - prepare any questions you have</p>
            </div>
          </div>
        </main>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <Dashboard />;
}

export default App;