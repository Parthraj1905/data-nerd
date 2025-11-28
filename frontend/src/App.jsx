import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  LineChart, Line, Legend 
} from 'recharts';

function App() {
  const [data, setData] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [trendData, setTrendData] = useState([]); 
  const [jobTitle, setJobTitle] = useState('');
  const [country, setCountry] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FETCH TOP SKILLS
  useEffect(() => {
    const params = { sort_by: 'count' };
    if (jobTitle) params.job_title = jobTitle;
    if (country) params.country = country;

    axios.get('https://data-nerd-api.onrender.com/api/top-skills', { params })
      .then(res => {
        setData(res.data.results || []);
        setTotalJobs(res.data.total_jobs || 0);
      })
      .catch(err => console.error(err));
  }, [jobTitle, country]);

  // FETCH TRENDS
  useEffect(() => {
    axios.get('https://data-nerd-api.onrender.com/api/skill-trends')
      .then(res => setTrendData(res.data))
      .catch(err => console.error(err));
  }, []);

  const topSkillName = data.length > 0 ? data[0].skill_name : 'N/A';
  const highestSalary = data.length > 0 
    ? Math.max(...data.map(i => i.avg_salary || 0)) 
    : 0;

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const MarketChart = ({ height }) => (
    <div style={{ height: height, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="skill_name" type="category" width={100} tick={{ fill: '#6c7293', fontSize: 13 }} 
            interval={0} axisLine={false} tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#191c24', border: '1px solid #2c2e33', color: '#fff' }} 
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="value" barSize={18} radius={[0, 4, 4, 0]}>
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0090e7' : '#00d25b'} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="app-container">
      
      {/* MOBILE OVERLAY */}
      <div 
        className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* SIDEBAR */}
      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="brand-logo" style={{ marginBottom: '3rem' }}>Data nerd</div>
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavClick('dashboard')}>
          <div className="nav-icon">📊</div><span>Dashboard</span>
        </div>
        <div className={`nav-item ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => handleNavClick('skills')}>
          <div className="nav-icon">🔥</div><span>Top Skills</span>
        </div>
        <div className={`nav-item ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => handleNavClick('trends')}>
          <div className="nav-icon">📈</div><span>Market Trends</span>
        </div>
        
        {/* NEW ABOUT BUTTON */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #2c2e33', paddingTop: '10px' }}>
            <div className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => handleNavClick('about')}>
            <div className="nav-icon">ℹ️</div><span>About</span>
            </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-panel">
        
        <header className="navbar">
           <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
           <div style={{ color: '#6c7293', fontSize: '0.9rem', marginLeft: 'auto' }}>Data updated: Live</div>
        </header>

        <div className="content-wrapper">
          
          {/* --- VIEW 1: DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            <>
              <div className="row">
                <div className="col-3 card">
                  <div className="stat-value">{totalJobs.toLocaleString()}</div>
                  <div className="stat-label">Total Jobs Analyzed</div>
                </div>
                <div className="col-3 card">
                  <div className="stat-value">{topSkillName}</div>
                  <div className="stat-label">Most Demanded Skill</div>
                </div>
                <div className="col-3 card">
                  <div className="stat-value">${(highestSalary/1000).toFixed(0)}k</div>
                  <div className="stat-label">Peak Salary (Year)</div>
                </div>
              </div>
              <div className="row">
                <div className="col-8 card">
                  <div className="card-title">
                    <span>Market Demand (Volume)</span>
                    <div style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                       <select onChange={e => setJobTitle(e.target.value)} value={jobTitle}>
                          <option value="">All Roles</option>
                          <option value="Data Analyst">Data Analyst</option>
                          <option value="Data Scientist">Data Scientist</option>
                       </select>
                       <select onChange={e => setCountry(e.target.value)} value={country}>
                          <option value="">Global</option>
                          <option value="India">India</option>
                          <option value="United States">USA</option>
                       </select>
                    </div>
                  </div>
                  <MarketChart height={400} />
                </div>
                <div className="col-4 card">
                  <div className="card-title">Trend History</div>
                  <div style={{ height: 400, width: '100%' }}>
                    <ResponsiveContainer>
                      <LineChart data={trendData}>
                        <XAxis dataKey="month" hide />
                        <Tooltip contentStyle={{backgroundColor:'#191c24', border:'none'}} itemStyle={{color:'white'}} />
                        <Legend />
                        <Line type="monotone" dataKey="python" stroke="#00d25b" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="sql" stroke="#0090e7" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="aws" stroke="#fc424a" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- VIEW 2: TOP SKILLS --- */}
          {activeTab === 'skills' && (
             <div className="card" style={{ height: 'auto', minHeight: '80vh', paddingBottom: '2rem' }}>
                <div className="card-title"><h2>Detailed Skill Analysis</h2></div>
                <MarketChart height={600} />
             </div>
          )}

          {/* --- VIEW 3: TRENDS --- */}
          {activeTab === 'trends' && (
            <div className="card" style={{ height: '80vh' }}>
               <div className="card-title"><h2>Historical Market Trends</h2></div>
               <div style={{ height: '90%', width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="month" stroke="#6c7293" />
                    <YAxis stroke="#6c7293" />
                    <Tooltip contentStyle={{backgroundColor:'#191c24', border:'1px solid #2c2e33'}} itemStyle={{color:'white'}} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="python" stroke="#00d25b" strokeWidth={3} dot={{r:4}} />
                    <Line type="monotone" dataKey="sql" stroke="#0090e7" strokeWidth={3} dot={{r:4}} />
                    <Line type="monotone" dataKey="aws" stroke="#fc424a" strokeWidth={3} dot={{r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* --- VIEW 4: ABOUT SECTION --- */}
          {activeTab === 'about' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                
                {/* Profile Card */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, #00d25b, #0090e7)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' 
                        }}>
                            👨‍💻
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: 'white' }}>Data Science Aspirant</h2>
                            <p style={{ color: '#00d25b', margin: '5px 0 0 0', fontWeight: '500' }}>Computer Engineering Student</p>
                        </div>
                    </div>
                    <p style={{ marginTop: '20px', lineHeight: '1.7', color: '#b0b8c4' }}>
                        Welcome to <strong>Data Nerd</strong>. I built this project to bridge the gap between job market noise and actionable data. 
                        My goal is to leverage <strong>Data Science & AI</strong> to solve real-world problems.
                    </p>
                </div>

                {/* Tech Stack Card */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: 'white', borderBottom: '1px solid #2c2e33', paddingBottom: '10px' }}>Built With</h3>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(0, 144, 231, 0.2)', color: '#0090e7', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>React.js</span>
                        <span style={{ background: 'rgba(0, 210, 91, 0.2)', color: '#00d25b', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>FastAPI (Python)</span>
                        <span style={{ background: 'rgba(252, 66, 74, 0.2)', color: '#fc424a', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>PostgreSQL</span>
                        <span style={{ background: 'rgba(143, 95, 232, 0.2)', color: '#8f5fe8', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>Recharts</span>
                    </div>
                </div>

                {/* --- NEW: CONTACT CARD --- */}
                <div className="card">
                    <h3 style={{ color: 'white', borderBottom: '1px solid #2c2e33', paddingBottom: '10px' }}>Connect</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        
                        {/* Email */}
                        <a href="mailto:parthrajsinhparmar19@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#b0b8c4', textDecoration: 'none' }}>
                            <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>📧</span>
                            <span style={{ transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='#b0b8c4'}>
                                parthrajsinhparmar19@gmail.com
                            </span>
                        </a>

                        {/* GitHub */}
                        <a href="https://github.com/Parthraj1905" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#b0b8c4', textDecoration: 'none' }}>
                             <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>🐙</span>
                             <span style={{ transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='#b0b8c4'}>
                                github.com/Parthraj1905
                             </span>
                        </a>

                        {/* LinkedIn (Optional) */}
                        <a href="https://www.linkedin.com/in/parthrajsinh-parmar-a86463373/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#b0b8c4', textDecoration: 'none' }}>
                             <span style={{ fontSize: '1.2rem', width: '30px', textAlign: 'center' }}>🔗</span>
                             <span style={{ transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='#b0b8c4'}>
                                linkedin.com/in/parthrajsinh-parmar-a86463373/
                             </span>
                        </a>

                    </div>
                </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;