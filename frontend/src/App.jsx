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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent Background Scroll
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [mobileMenuOpen]);

  // Fetch Data
  useEffect(() => {
    setIsLoading(true);
    const params = { sort_by: 'count' };
    if (jobTitle) params.job_title = jobTitle;
    if (country) params.country = country;

    Promise.all([
      axios.get('https://data-nerd-api.onrender.com/api/top-skills', { params }),
      axios.get('https://data-nerd-api.onrender.com/api/skill-trends')
    ])
    .then(([skillsRes, trendsRes]) => {
      setData(skillsRes.data.results || []);
      setTotalJobs(skillsRes.data.total_jobs || 0);
      setTrendData(trendsRes.data);
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, [jobTitle, country]);

  const topSkillName = data.length > 0 ? data[0].skill_name : 'N/A';
  const highestSalary = data.length > 0 ? Math.max(...data.map(i => i.avg_salary || 0)) : 0;

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const MarketChart = ({ height }) => (
    <div style={{ height: height, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ left: isMobile ? 0 : 40, right: isMobile ? 0 : 20 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="skill_name" type="category" width={isMobile ? 70 : 100} 
            tick={{ fill: '#6c7293', fontSize: isMobile ? 11 : 13 }} interval={0} 
            axisLine={false} tickLine={false} 
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#191c24', border: '1px solid #2c2e33', color: '#fff' }} itemStyle={{ color: '#fff' }} />
          <Bar dataKey="value" barSize={18} radius={[0, 4, 4, 0]}>
             {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0090e7' : '#00d25b'} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* BRANDING: Personalize this to show ownership immediately */}
        <div className="brand-logo" style={{ marginBottom: '3rem', paddingLeft: '15px' }}>
          Data Nerd <span style={{ fontSize: '0.6rem', color: '#00d25b', verticalAlign: 'super' }}>BY PARTH</span>
        </div>
        
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavClick('dashboard')}>
          <div className="nav-icon">📊</div><span>Dashboard</span>
        </div>
        <div className={`nav-item ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => handleNavClick('skills')}>
          <div className="nav-icon">🔥</div><span>Top Skills</span>
        </div>
        <div className={`nav-item ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => handleNavClick('trends')}>
          <div className="nav-icon">📈</div><span>Market Trends</span>
        </div>
        <div className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => handleNavClick('about')}>
          <div className="nav-icon">ℹ️</div><span>About Project</span>
        </div>
      </nav>

      <div className="main-panel">
        <header className="navbar">
           <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
           <div style={{ color: '#6c7293', fontSize: '0.9rem', marginLeft: 'auto' }}>Data updated: Live</div>
        </header>

        <div className="content-wrapper">
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Waking up the server... (this may take 10s)</p>
            </div>
          ) : (
            <>
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
                        <div style={{display:'flex', gap:'5px', marginTop:'10px', justifyContent: 'center'}}>
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

              {activeTab === 'skills' && (
                <div className="card" style={{ height: 'auto', minHeight: '80vh', paddingBottom: '2rem' }}>
                    <div className="card-title"><h2>Detailed Skill Analysis</h2></div>
                    <MarketChart height={600} />
                </div>
              )}

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

              {/* --- NEW ABOUT / IDENTITY SECTION --- */}
              {activeTab === 'about' && (
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="row">
                        
                        {/* COLUMN 1: PROJECT DOCUMENTATION */}
                        <div className="col-8 card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                            <h2 style={{ color: 'white', marginBottom: '1rem' }}>About Data Nerd</h2>
                            <p style={{ color: '#b0b8c4', lineHeight: '1.6' }}>
                                <strong>Data Nerd</strong> is a specialized market intelligence platform designed for data professionals. 
                                In an industry flooded with noise, this dashboard provides clear signals on which skills are actually in demand.
                            </p>
                            
                            <h3 style={{ color: '#0090e7', marginTop: '1.5rem', fontSize: '1.1rem' }}>How it Works</h3>
                            <ul style={{ color: '#b0b8c4', paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                                <li><strong>Data Aggregation:</strong> The system continuously scans job postings from major platforms.</li>
                                <li><strong>NLP Analysis:</strong> Text descriptions are parsed to extract technical keywords (e.g., "Python", "AWS").</li>
                                <li><strong>Live Visualization:</strong> Data is served via a FastAPI backend to this React dashboard in real-time.</li>
                            </ul>

                            <h3 style={{ color: '#00d25b', marginTop: '1.5rem', fontSize: '1.1rem' }}>Purpose</h3>
                            <p style={{ color: '#b0b8c4', lineHeight: '1.6' }}>
                                Built to assist students and professionals in prioritizing their learning path based on actual market volume and salary data, rather than hype.
                            </p>
                        </div>

                        {/* COLUMN 2: DEVELOPER IDENTITY (PROOF OF WORK) */}
                        <div className="col-4 card">
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#191c24', border: '2px solid #00d25b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto' }}>
                                👨‍💻
                            </div>
                            <h2 style={{ color: 'white', marginTop: '1rem' }}>Parth</h2>
                            <p style={{ color: '#6c7293', fontSize: '0.9rem' }}><br/>Data Science Aspirant</p>
                            
                            <div style={{ width: '100%', height: '1px', background: '#2c2e33', margin: '1.5rem 0' }}></div>

                            <h4 style={{ color: '#fff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Verify Ownership</h4>
                            <p style={{ color: '#6c7293', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                This project is open-source. Verify the commit history to confirm authorship.
                            </p>

                            <a href="https://github.com/Parthraj1905/data-nerd" target="_blank" rel="noopener noreferrer" 
                               style={{ background: '#24292e', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'block', marginBottom: '10px', fontWeight: '500' }}>
                                <span style={{ marginRight: '8px' }}>🐙</span> View Source Code
                            </a>

                            <a href="https://www.linkedin.com/in/parthrajsinh-parmar-a86463373" target="_blank" rel="noopener noreferrer" 
                               style={{ background: '#0077b5', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'block', fontWeight: '500' }}>
                                <span style={{ marginRight: '8px' }}>🔗</span> Connect on LinkedIn
                            </a>
                        </div>

                    </div>

                    {/* TECH STACK FOOTER */}
                    <div className="card" style={{ marginTop: '1rem' }}>
                        <h4 style={{ color: '#6c7293', marginBottom: '1rem' }}>Technology Stack</h4>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span style={{ border: '1px solid #0090e7', color: '#0090e7', padding: '5px 15px', borderRadius: '15px', fontSize: '0.85rem' }}>React.js</span>
                            <span style={{ border: '1px solid #00d25b', color: '#00d25b', padding: '5px 15px', borderRadius: '15px', fontSize: '0.85rem' }}>FastAPI</span>
                            <span style={{ border: '1px solid #fc424a', color: '#fc424a', padding: '5px 15px', borderRadius: '15px', fontSize: '0.85rem' }}>PostgreSQL</span>
                            <span style={{ border: '1px solid #8f5fe8', color: '#8f5fe8', padding: '5px 15px', borderRadius: '15px', fontSize: '0.85rem' }}>Render Cloud</span>
                            <span style={{ border: '1px solid #ffffff', color: '#ffffff', padding: '5px 15px', borderRadius: '15px', fontSize: '0.85rem' }}>Vercel</span>
                        </div>
                    </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;