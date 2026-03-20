import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import './mobile.css';

const ALL_SKILLS = [
  {skill_name:"sql",job_count:385750,avg_salary:124935,value:57.5,skill_type:"programming"},
  {skill_name:"python",job_count:381863,avg_salary:132440,value:57.0,skill_type:"programming"},
  {skill_name:"aws",job_count:145718,avg_salary:136481,value:21.7,skill_type:"cloud"},
  {skill_name:"azure",job_count:132851,avg_salary:130433,value:19.8,skill_type:"cloud"},
  {skill_name:"r",job_count:131285,avg_salary:127115,value:19.6,skill_type:"programming"},
  {skill_name:"tableau",job_count:127500,avg_salary:116796,value:19.0,skill_type:"analyst_tools"},
  {skill_name:"excel",job_count:127341,avg_salary:99751,value:19.0,skill_type:"analyst_tools"},
  {skill_name:"spark",job_count:114928,avg_salary:141734,value:17.1,skill_type:"analyst_tools"},
  {skill_name:"power bi",job_count:98363,avg_salary:106738,value:14.7,skill_type:"analyst_tools"},
  {skill_name:"java",job_count:85854,avg_salary:136210,value:12.8,skill_type:"programming"},
  {skill_name:"sas",job_count:83652,avg_salary:112788,value:12.5,skill_type:"programming"},
  {skill_name:"hadoop",job_count:65041,avg_salary:138574,value:9.7,skill_type:"analyst_tools"},
  {skill_name:"scala",job_count:57058,avg_salary:145120,value:8.5,skill_type:"programming"},
  {skill_name:"snowflake",job_count:55150,avg_salary:137960,value:8.2,skill_type:"cloud"},
  {skill_name:"databricks",job_count:53282,avg_salary:131525,value:7.9,skill_type:"cloud"},
  {skill_name:"gcp",job_count:50824,avg_salary:131738,value:7.6,skill_type:"cloud"},
  {skill_name:"git",job_count:50358,avg_salary:128316,value:7.5,skill_type:"analyst_tools"},
  {skill_name:"kafka",job_count:50092,avg_salary:144754,value:7.5,skill_type:"analyst_tools"},
  {skill_name:"airflow",job_count:45363,avg_salary:142386,value:6.8,skill_type:"analyst_tools"},
  {skill_name:"oracle",job_count:45318,avg_salary:115125,value:6.8,skill_type:"analyst_tools"},
];

const TRENDS = [
  {month:"Jan",sql:46034,python:45143,aws:16938,azure:15481,r:16490},
  {month:"Feb",sql:32661,python:31939,aws:12242,azure:11099,r:11236},
  {month:"Mar",sql:32330,python:31950,aws:12350,azure:11096,r:11344},
  {month:"Apr",sql:31064,python:30457,aws:11680,azure:10574,r:10642},
  {month:"May",sql:27203,python:27082,aws:10416,azure:9136,r:9385},
  {month:"Jun",sql:31675,python:31188,aws:11760,azure:10805,r:10822},
  {month:"Jul",sql:31849,python:31285,aws:12097,azure:11000,r:10754},
  {month:"Aug",sql:36725,python:36208,aws:13775,azure:12198,r:13036},
  {month:"Sep",sql:28960,python:28647,aws:10933,azure:10231,r:9306},
  {month:"Oct",sql:30733,python:30550,aws:11600,azure:10923,r:9987},
  {month:"Nov",sql:29819,python:30098,aws:11466,azure:10683,r:9659},
  {month:"Dec",sql:25837,python:26415,aws:10126,azure:9312,r:8265},
];

const TYPE_COLORS = { programming:"#6c63ff", cloud:"#00d4aa", analyst_tools:"#ffa94d" };
const TREND_COLORS = { sql:"#6c63ff", python:"#00d4aa", aws:"#ff6b6b", azure:"#ffa94d", r:"#a78bfa" };
const ROLE_FILTERS = {
  "Data Analyst": ["sql","excel","tableau","power bi","python","r","sas","oracle"],
  "Data Engineer": ["sql","python","aws","azure","spark","hadoop","scala","snowflake","databricks","gcp","kafka","airflow","git"],
  "Data Scientist": ["python","r","sql","aws","spark","scala","databricks","git","java","sas"],
};

const fmtK = (v) => v >= 1000 ? Math.round(v / 1000) + "K" : v;
const fmtSalary = (v) => "$" + (v / 1000).toFixed(0) + "K";
const gc = (type) => TYPE_COLORS[type] || "#7a7a9a";

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#1a1a24",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px"}}>
      <p style={{color:"#f0f0f8",fontSize:12,marginBottom:6,fontWeight:600}}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{color:"#7a7a9a",fontSize:11,margin:"2px 0"}}>
          <span style={{color:p.color||p.fill}}>■ </span>
          {p.name}: <span style={{color:"#f0f0f8"}}>{formatter ? formatter(p.value) : p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return width;
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [role, setRole] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useWindowWidth() <= 900;

  const filtered = (() => {
    let data = [...ALL_SKILLS];
    if (typeFilter) data = data.filter(s => s.skill_type === typeFilter);
    if (role && ROLE_FILTERS[role]) data = data.filter(s => ROLE_FILTERS[role].includes(s.skill_name));
    return data;
  })();

  const bySalary = [...filtered].sort((a, b) => b.avg_salary - a.avg_salary);
  const top10 = filtered.slice(0, 10);
  const trendSums = { SQL: 0, Python: 0, AWS: 0, Azure: 0, R: 0 };
  TRENDS.forEach(t => { trendSums.SQL += t.sql; trendSums.Python += t.python; trendSums.AWS += t.aws; trendSums.Azure += t.azure; trendSums.R += t.r; });
  const donutData = Object.entries(trendSums).map(([name, value]) => ({ name, value }));
  const peakData = ["sql","python","aws","azure","r"].map((s, i) => ({
    name: s.toUpperCase(),
    peak: Math.max(...TRENDS.map(t => t[s] || 0)),
    fill: Object.values(TREND_COLORS)[i]
  }));
  const bubbleData = filtered.filter(s => s.avg_salary).slice(0, 12).map(s => ({
    x: +s.value.toFixed(1), y: Math.round(s.avg_salary / 1000),
    z: Math.max(200, s.job_count / 800),
    name: s.skill_name.toUpperCase(), fill: gc(s.skill_type)
  }));

  const NAV = [
    { id:"dashboard", icon:"▦", label:"Dashboard" },
    { id:"skills",    icon:"◈", label:"Top Skills" },
    { id:"trends",    icon:"◉", label:"Market Trends" },
    { id:"salary",    icon:"◎", label:"Salary Insights" },
    { id:"about",     icon:"◌", label:"About" },
  ];

  const viewMeta = {
    dashboard:"Overview of the data job market",
    skills:"All tracked skills ranked by demand",
    trends:"How skill demand changes month to month",
    salary:"Compensation data by skill",
    about:"Project info and tech stack",
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f8",fontFamily:"'Syne', sans-serif"}}>

      {/* Overlay — mobile only */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:90,backdropFilter:"blur(2px)"}} />
      )}

      {/* Sidebar */}
      <nav style={{
        width:220, minHeight:"100vh", background:"#111118",
        borderRight:"1px solid rgba(255,255,255,0.07)",
        display:"flex", flexDirection:"column",
        position:"fixed", top:0, left:0, zIndex:100,
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
        transition:"transform 0.3s ease",
      }}>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.5px"}}>
            Data<span style={{color:"#6c63ff"}}>Nerd</span>
          </div>
          <div style={{fontSize:10,color:"#7a7a9a",fontFamily:"'DM Mono',monospace",marginTop:3,letterSpacing:1,textTransform:"uppercase"}}>
            Job Market Intelligence
          </div>
        </div>
        <div style={{padding:"16px 12px",flex:1}}>
          {NAV.map(n => (
            <div key={n.id} onClick={() => { setView(n.id); setSidebarOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 12px", borderRadius:8, cursor:"pointer",
                fontSize:13, fontWeight:500, marginBottom:2,
                background: view===n.id ? "rgba(108,99,255,0.12)" : "transparent",
                color: view===n.id ? "#6c63ff" : "#7a7a9a",
                border: view===n.id ? "1px solid rgba(108,99,255,0.2)" : "1px solid transparent",
              }}>
              <span style={{fontSize:15,width:18,textAlign:"center"}}>{n.icon}</span>
              {n.label}
            </div>
          ))}
        </div>
        <div style={{padding:"16px 24px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <p style={{fontSize:11,color:"#7a7a9a",fontFamily:"'DM Mono',monospace"}}>by Parth · 2025</p>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6,fontSize:10,fontFamily:"'DM Mono',monospace",color:"#00d4aa"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#00d4aa",boxShadow:"0 0 6px #00d4aa"}} />
            670K jobs · real data
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{marginLeft: isMobile ? 0 : 220, flex:1, minHeight:"100vh", minWidth:0}}>

        {/* Topbar */}
        <div style={{
          padding: isMobile ? "14px 16px" : "20px 32px",
          borderBottom:"1px solid rgba(255,255,255,0.07)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"#0a0a0f", position:"sticky", top:0, zIndex:50, flexWrap:"wrap", gap:12
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)}
                style={{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#f0f0f8",fontSize:16,lineHeight:1}}>
                ☰
              </button>
            )}
            <div>
              <div style={{fontSize:15,fontWeight:600}}>{NAV.find(n=>n.id===view)?.label}</div>
              <div style={{fontSize:11,color:"#7a7a9a",fontFamily:"'DM Mono',monospace",marginTop:2}}>{viewMeta[view]}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            {[
              {id:"filter-role", val:role, set:setRole, opts:[["","All Roles"],["Data Analyst","Data Analyst"],["Data Engineer","Data Engineer"],["Data Scientist","Data Scientist"]]},
              {id:"filter-type", val:typeFilter, set:setTypeFilter, opts:[["","All Skill Types"],["programming","Languages"],["cloud","Cloud"],["analyst_tools","Tools"]]},
            ].map(f => (
              <select key={f.id} value={f.val} onChange={e=>f.set(e.target.value)}
                style={{background:"#111118",border:"1px solid rgba(255,255,255,0.12)",color:"#f0f0f8",padding:"7px 12px",borderRadius:8,fontSize:12,fontFamily:"'Syne',sans-serif",cursor:"pointer",outline:"none"}}>
                {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
        </div>

        <div style={{padding: isMobile ? "16px" : "28px 32px"}}>

          {/* DASHBOARD */}
          {view === "dashboard" && (
            <>
              <div style={{display:"grid",gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",gap:isMobile?12:16,marginBottom:28}}>
                {[
                  {label:"Total Jobs Analyzed",value:"670K",sub:"real job postings",c:"#6c63ff"},
                  {label:"Top Skill",value:filtered[0]?.skill_name.toUpperCase()||"SQL",sub:(filtered[0]?.value||57.5).toFixed(1)+"% of postings",c:"#00d4aa"},
                  {label:"Highest Paying",value:fmtSalary(bySalary[0]?.avg_salary||145120),sub:(bySalary[0]?.skill_name||"scala")+" skill",c:"#ff6b6b"},
                  {label:"Skills Tracked",value:filtered.length,sub:"in current filter",c:"#ffa94d"},
                ].map((s,i) => (
                  <div key={i} style={{background:"#111118",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding: isMobile ? 14 : 20,position:"relative",overflow:"hidden",minWidth:0}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.c}} />
                    <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"1.2px",color:"#7a7a9a",fontFamily:"'DM Mono',monospace",marginBottom:8,lineHeight:1.4}}>{s.label}</div>
                    <div style={{fontSize: isMobile ? 20 : 26,fontWeight:700,lineHeight:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.value}</div>
                    <div style={{fontSize:10,color:"#7a7a9a",marginTop:6,fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",gap:20}}>
                <ChartCard title="Top 10 Skills by Demand" sub="% of job postings mentioning each skill">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={top10.map(s=>({name:s.skill_name.toUpperCase(),value:+s.value.toFixed(1),fill:gc(s.skill_type)}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{fill:"#7a7a9a",fontSize:10}} />
                      <YAxis tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={v=>v+"%"} />
                      <Tooltip content={<CustomTooltip formatter={v=>v+"%"} />} />
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {top10.map((s,i) => <Cell key={i} fill={gc(s.skill_type)} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Monthly Trend Overview" sub="Job postings per skill · Jan–Dec 2023"
                  legend={[["SQL","#6c63ff"],["Python","#00d4aa"],["AWS","#ff6b6b"],["Azure","#ffa94d"],["R","#a78bfa"]]}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={TRENDS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{fill:"#7a7a9a",fontSize:10}} />
                      <YAxis tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={fmtK} />
                      <Tooltip content={<CustomTooltip formatter={v=>v.toLocaleString()} />} />
                      {Object.entries(TREND_COLORS).map(([k,c]) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={false} name={k.toUpperCase()} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          )}

          {/* TOP SKILLS */}
          {view === "skills" && (
            <ChartCard title="All Skills — Demand Ranking" sub={`Showing ${filtered.length} skills · sorted by job count`}
              extra={
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[["","All","#7a7a9a"],["programming","Language","#6c63ff"],["cloud","Cloud","#00d4aa"],["analyst_tools","Tools","#ffa94d"]].map(([v,l,c])=>(
                    <span key={v} onClick={()=>setTypeFilter(v)}
                      style={{display:"inline-flex",alignItems:"center",gap:6,background:typeFilter===v?"rgba(108,99,255,0.08)":"#1a1a24",border:typeFilter===v?"1px solid #6c63ff":"1px solid rgba(255,255,255,0.07)",borderRadius:6,padding:"5px 10px",fontSize:11,fontFamily:"'DM Mono',monospace",color:typeFilter===v?"#6c63ff":"#7a7a9a",cursor:"pointer"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:c,display:"inline-block"}} />{l}
                    </span>
                  ))}
                </div>
              }>
              <ResponsiveContainer width="100%" height={Math.max(400, filtered.length * 36 + 60)}>
                <BarChart data={filtered.map(s=>({name:s.skill_name.toUpperCase(),value:s.job_count}))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{fill:"#7a7a9a",fontSize:10}} width={80} />
                  <Tooltip content={<CustomTooltip formatter={v=>v.toLocaleString()+" postings"} />} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {filtered.map((s,i) => <Cell key={i} fill={gc(s.skill_type)} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* TRENDS */}
          {view === "trends" && (
            <>
              <ChartCard title="Skill Demand Over Time" sub="Monthly job postings · Jan–Dec 2023"
                legend={[["SQL","#6c63ff"],["Python","#00d4aa"],["AWS","#ff6b6b"],["Azure","#ffa94d"],["R","#a78bfa"]]}>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{fill:"#7a7a9a",fontSize:10}} />
                    <YAxis tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={fmtK} />
                    <Tooltip content={<CustomTooltip formatter={v=>v.toLocaleString()} />} />
                    {Object.entries(TREND_COLORS).map(([k,c]) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={{r:3}} name={k.toUpperCase()} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",gap:20,marginTop:20}}>
                <ChartCard title="Skill Share Distribution" sub="Proportion of all tracked skill mentions">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                        {donutData.map((_, i) => <Cell key={i} fill={Object.values(TREND_COLORS)[i]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip formatter={v=>v.toLocaleString()} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Peak Month by Skill" sub="Highest single-month posting count">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={peakData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{fill:"#7a7a9a",fontSize:10}} />
                      <YAxis tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={fmtK} />
                      <Tooltip content={<CustomTooltip formatter={v=>v.toLocaleString()} />} />
                      <Bar dataKey="peak" radius={[4,4,0,0]}>
                        {peakData.map((d,i) => <Cell key={i} fill={d.fill} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          )}

          {/* SALARY */}
          {view === "salary" && (
            <>
              <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",gap:20,marginBottom:20}}>
                <ChartCard title="Avg Salary by Skill" sub="USD annual · sorted highest to lowest">
                  <ResponsiveContainer width="100%" height={440}>
                    <BarChart data={bySalary.map(s=>({name:s.skill_name.toUpperCase(),value:s.avg_salary}))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"K"} />
                      <YAxis type="category" dataKey="name" tick={{fill:"#7a7a9a",fontSize:10}} width={80} />
                      <Tooltip content={<CustomTooltip formatter={v=>"$"+v.toLocaleString()} />} />
                      <Bar dataKey="value" radius={[0,4,4,0]}>
                        {bySalary.map((s,i) => <Cell key={i} fill={gc(s.skill_type)} fillOpacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Demand vs Salary Matrix" sub="Bubble size = job count · top-right = best ROI">
                  <ResponsiveContainer width="100%" height={440}>
                    <ScatterChart margin={{top:20,right:20,bottom:20,left:20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" dataKey="x" name="Demand" tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={v=>v+"%"} label={{value:"Demand (%)",fill:"#7a7a9a",fontSize:11,position:"insideBottom",offset:-10}} />
                      <YAxis type="number" dataKey="y" name="Salary" tick={{fill:"#7a7a9a",fontSize:10}} tickFormatter={v=>"$"+v+"K"} label={{value:"Salary ($K)",fill:"#7a7a9a",fontSize:11,angle:-90,position:"insideLeft"}} />
                      <Tooltip content={({active,payload})=>{
                        if(!active||!payload?.length) return null;
                        const d=payload[0]?.payload;
                        return <div style={{background:"#1a1a24",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",fontSize:11,color:"#7a7a9a"}}><p style={{color:"#f0f0f8",fontWeight:600,marginBottom:4}}>{d?.name}</p><p>Demand: {d?.x}%</p><p>Salary: ${d?.y}K</p></div>;
                      }} />
                      <Scatter data={bubbleData} shape={(props)=>{
                        const {cx,cy,payload}=props;
                        const r=Math.sqrt(payload.z);
                        return <circle cx={cx} cy={cy} r={Math.max(6,r)} fill={payload.fill} fillOpacity={0.6} stroke={payload.fill} strokeWidth={1} />;
                      }} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <ChartCard title="Full Skill Salary Breakdown" sub="All skills ranked by average annual salary">
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>{["#","Skill","Avg Salary","Job Count","Demand %","Scale"].map(h=>(
                      <th key={h} style={{textAlign:"left",color:"#7a7a9a",fontFamily:"'DM Mono',monospace",fontSize:10,textTransform:"uppercase",letterSpacing:1,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.07)",fontWeight:500}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {bySalary.map((s,i)=>(
                      <tr key={s.skill_name}>
                        <td style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)",color:"#7a7a9a",fontFamily:"'DM Mono',monospace",fontSize:10}}>{String(i+1).padStart(2,"0")}</td>
                        <td style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)",fontWeight:500,color:gc(s.skill_type)}}>{s.skill_name.toUpperCase()}</td>
                        <td style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)",fontFamily:"'DM Mono',monospace",color:"#00d4aa"}}>${s.avg_salary.toLocaleString()}</td>
                        <td style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)",fontFamily:"'DM Mono',monospace"}}>{s.job_count.toLocaleString()}</td>
                        <td style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)",fontFamily:"'DM Mono',monospace"}}>{s.value.toFixed(1)}%</td>
                        <td style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                          <div style={{width:100,background:"#1a1a24",borderRadius:3,height:4}}>
                            <div style={{width:(s.avg_salary/bySalary[0].avg_salary*100).toFixed(0)+"%",height:4,borderRadius:3,background:"#00d4aa"}} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ChartCard>
            </>
          )}

          {/* ABOUT */}
          {view === "about" && (
            <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",gap:20}}>
              {[
                {title:"About This Project",text:"DataNerd is a full-stack analytics dashboard processing 670K+ real job postings to surface demand signals, salary data, and market trends for data professionals.",tags:["React","FastAPI","PostgreSQL","Recharts"]},
                {title:"API Endpoints",text:"Powered by a FastAPI backend on Render, querying a Neon serverless Postgres database with a star schema — fact + dimension tables for skills and job postings.",tags:["/api/top-skills","/api/skill-trends","/api/momentum"]},
                {title:"Architecture",text:"Star schema on Neon (serverless Postgres) · FastAPI on Render · React + Vite frontend on Vercel · CI/CD pipeline via GitHub",tags:["Neon DB","Render","Vercel","GitHub CI/CD"]},
                {title:"Built by Parth",text:"End-to-end data engineering project covering ETL pipeline, database design, REST API development, frontend engineering, and full cloud deployment from scratch.",tags:["ETL Pipeline","SQL","Python","Cloud Deploy"]},
              ].map((c,i)=>(
                <div key={i} style={{background:"#111118",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:24}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>{c.title}</div>
                  <div style={{fontSize:12,color:"#7a7a9a",lineHeight:1.7,fontFamily:"'DM Mono',monospace"}}>{c.text}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
                    {c.tags.map(t=><span key={t} style={{background:"#1a1a24",border:"1px solid rgba(255,255,255,0.07)",borderRadius:6,padding:"5px 10px",fontSize:11,fontFamily:"'DM Mono',monospace",color:"#7a7a9a"}}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ChartCard({ title, sub, children, legend, extra }) {
  return (
    <div style={{background:"#111118",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:24,marginBottom:0}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:600}}>{title}</div>
          {sub && <div style={{fontSize:11,color:"#7a7a9a",fontFamily:"'DM Mono',monospace",marginTop:3}}>{sub}</div>}
        </div>
        {legend && (
          <div style={{display:"flex",flexWrap:"wrap",gap:12,fontSize:11,color:"#7a7a9a"}}>
            {legend.map(([l,c])=>(
              <span key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}} />{l}
              </span>
            ))}
          </div>
        )}
        {extra}
      </div>
      {children}
    </div>
  );
}
