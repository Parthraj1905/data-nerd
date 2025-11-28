from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONFIG ---
# 1. Try to get the URL from the Cloud Environment (Render)
DATABASE_URL = os.environ.get("DATABASE_URL")

# 2. If running locally (MacBook), fallback to this string
if not DATABASE_URL:
    # PASTE YOUR NEON CONNECTION STRING HERE INSIDE THE QUOTES
    DATABASE_URL = "postgresql://neondb_owner:npg_n9wz2rYqOgbX@ep-summer-surf-a1ihu7bo-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set.")
        
    # Ensure SSL is enabled
    if "sslmode" not in DATABASE_URL:
        conn_url = f"{DATABASE_URL}?sslmode=require"
    else:
        conn_url = DATABASE_URL
        
    return psycopg2.connect(conn_url)

# --- ENDPOINT 1: TOP SKILLS (DATA + COUNT) ---
@app.get("/api/top-skills")
def get_top_skills(
    job_title: str = Query(None),
    country: str = Query(None),
    skill_type: str = Query(None),
    sort_by: str = Query("count")
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Get Total Count of matching jobs
        count_query = """
        SELECT COUNT(DISTINCT jpf.job_id) as total_jobs
        FROM job_postings_fact as jpf
        INNER JOIN skills_job_dim as sjd ON jpf.job_id = sjd.job_id
        INNER JOIN skills_dim as s ON sjd.skill_id = s.skill_id
        WHERE
            (%(job_title)s IS NULL OR jpf.job_title_short = %(job_title)s)
            AND
            (%(country)s IS NULL OR jpf.job_country = %(country)s)
        """
        # Note: We intentionally exclude 'skill_type' from total count 
        # so the "Total Jobs" number doesn't shrink when you click "Tools"
        
        params = {'job_title': job_title, 'country': country}
        cursor.execute(count_query, params)
        total_analyzed = cursor.fetchone()['total_jobs']

        # 2. Get Skill Data
        query = """
        SELECT
            s.skills as skill_name,
            COUNT(sjd.job_id) as job_count,
            ROUND(AVG(jpf.salary_year_avg)) as avg_salary
        FROM job_postings_fact as jpf
        INNER JOIN skills_job_dim as sjd ON jpf.job_id = sjd.job_id
        INNER JOIN skills_dim as s ON sjd.skill_id = s.skill_id
        WHERE
            (%(job_title)s IS NULL OR jpf.job_title_short = %(job_title)s)
            AND
            (%(country)s IS NULL OR jpf.job_country = %(country)s)
            AND
            (%(skill_type)s IS NULL OR s.type = %(skill_type)s) 
        """
        
        # Add filtering params including skill_type for the chart data
        chart_params = params.copy()
        chart_params['skill_type'] = skill_type

        if sort_by == 'salary':
            query += " AND jpf.salary_year_avg IS NOT NULL "

        query += " GROUP BY s.skills "

        if sort_by == 'salary':
            query += " HAVING COUNT(sjd.job_id) > 10 "
            query += " ORDER BY avg_salary DESC "
        else:
            query += " ORDER BY job_count DESC "

        query += " LIMIT 20;"
        
        cursor.execute(query, chart_params)
        results = cursor.fetchall()
        conn.close()

        # 3. Format Data
        if results:
            for item in results:
                # Ensure avg_salary is a number, not None
                if item['avg_salary'] is None:
                    item['avg_salary'] = 0
                else:
                    item['avg_salary'] = float(item['avg_salary'])

                if sort_by == 'count':
                    # Calculate percentage relative to total filtered jobs
                    # If total is 0, avoid division by zero
                    item['value'] = round((item['job_count'] / total_analyzed * 100), 1) if total_analyzed > 0 else 0
                else:
                    item['value'] = item['avg_salary']

        return {
            "results": results,
            "total_jobs": total_analyzed
        }
        
    except Exception as e:
        print(f"Error in Top Skills: {e}")
        return {"results": [], "total_jobs": 0}

# --- ENDPOINT 2: TRENDS ---
@app.get("/api/skill-trends")
def get_skill_trends():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
        WITH TopSkills AS (
            SELECT skill_id
            FROM skills_job_dim
            GROUP BY skill_id
            ORDER BY COUNT(job_id) DESC
            LIMIT 5
        )
        SELECT 
            TO_CHAR(jpf.job_posted_date, 'YYYY-MM') as month,
            s.skills as skill_name,
            COUNT(sjd.job_id) as job_count
        FROM job_postings_fact as jpf
        INNER JOIN skills_job_dim as sjd ON jpf.job_id = sjd.job_id
        INNER JOIN skills_dim as s ON sjd.skill_id = s.skill_id
        WHERE sjd.skill_id IN (SELECT skill_id FROM TopSkills)
        AND jpf.job_posted_date IS NOT NULL
        GROUP BY month, s.skills
        ORDER BY month ASC;
        """

        cursor.execute(query)
        results = cursor.fetchall()
        conn.close()

        formatted_data = {}
        for row in results:
            month = row['month']
            if month not in formatted_data:
                formatted_data[month] = {'month': month}
            formatted_data[month][row['skill_name']] = row['job_count']

        return list(formatted_data.values())
    
    except Exception as e:
        print(f"Error in Trends: {e}")
        return []
    
# --- ENDPOINT 3: MARKET MOMENTUM (Gainers/Losers) ---
@app.get("/api/momentum")
def get_momentum():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Identify the latest 2 distinct months in the dataset
        date_query = """
        SELECT DISTINCT TO_CHAR(job_posted_date, 'YYYY-MM') as month_str
        FROM job_postings_fact
        WHERE job_posted_date IS NOT NULL
        ORDER BY month_str DESC
        LIMIT 2;
        """
        cursor.execute(date_query)
        dates = cursor.fetchall()

        # If we don't have at least 2 months of data, we can't calculate momentum
        if len(dates) < 2:
            return []

        latest_month = dates[0]['month_str']
        prev_month = dates[1]['month_str']

        # 2. Compare Counts between these two specific months
        query = """
        WITH CurrentMonth AS (
            SELECT 
                s.skills as skill_name,
                COUNT(jpf.job_id) as cnt
            FROM job_postings_fact as jpf
            INNER JOIN skills_job_dim as sjd ON jpf.job_id = sjd.job_id
            INNER JOIN skills_dim as s ON sjd.skill_id = s.skill_id
            WHERE TO_CHAR(jpf.job_posted_date, 'YYYY-MM') = %(latest)s
            GROUP BY skill_name
        ),
        PreviousMonth AS (
            SELECT 
                s.skills as skill_name,
                COUNT(jpf.job_id) as cnt
            FROM job_postings_fact as jpf
            INNER JOIN skills_job_dim as sjd ON jpf.job_id = sjd.job_id
            INNER JOIN skills_dim as s ON sjd.skill_id = s.skill_id
            WHERE TO_CHAR(jpf.job_posted_date, 'YYYY-MM') = %(prev)s
            GROUP BY skill_name
        )
        SELECT 
            curr.skill_name,
            curr.cnt as current_count,
            prev.cnt as previous_count,
            ROUND(((curr.cnt - prev.cnt)::numeric / prev.cnt) * 100, 1) as change_percent
        FROM CurrentMonth as curr
        INNER JOIN PreviousMonth as prev ON curr.skill_name = prev.skill_name
        WHERE prev.cnt > 50 -- Filter out low-volume noise
        ORDER BY ABS(change_percent) DESC
        LIMIT 5;
        """
        
        params = {'latest': latest_month, 'prev': prev_month}
        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()

        return results
    
    except Exception as e:
        print(f"Error in Momentum: {e}")
        return []