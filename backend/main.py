from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from enum import Enum

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enum for Database Types
class DBType(str, Enum):
    postgres = "postgres"
    mysql = "mysql"
    sqlite = "sqlite"
    tsql = "tsql"

# Database connection strings without a pre-defined database
creds = {
    "mysql": "mysql+mysqlconnector://root:password@localhost/derm_treatment",
    "postgres": "postgresql+psycopg2://postgres:password@localhost/",
    "sqlite": "sqlite:///your_sqlite_db.db"  # Local SQLite file
}

# Request Model for POST request
class RunQuery(BaseModel):
    db_name: str  # The database name we want to connect to
    db_type: DBType  # The type of the database
    query: str  # The actual SQL query to execute

@app.get("/")
def index():
    return {"message": "Welcome to the FastAPI server"}

# POST Endpoint to Run Query
@app.post("/run_query")
def run_query(request: RunQuery):
    db_name = request.db_name
    db_type = request.db_type
    query = request.query
    result = execute_query(query, db_type, db_name)
    return {"result": result}

def execute_query(query, db_type, db_name):
    # Create the base URL for the database type
    db_url = creds.get(db_type.value)
    
    if not db_url:
        return {"error": "Invalid database type"}

    try:
        # For MySQL and Postgres, dynamically append the database name
        # if db_type in {DBType.mysql, DBType.postgres}:
        #     db_url = db_url + db_name
        #     print(f"Connecting to database: {db_url}")

        # Use SQLAlchemy to connect to the database
        print(f"Connecting to database: {db_url}")
        engine = create_engine(db_url)

        with engine.connect() as connection:
            print(f"Executing query: {query}")
            result = connection.execute(text(query))  # Wrap query with `text()`
            print(f"Query executed successfully")
            
            # Fetch all rows and return them as a list of dictionaries
            rows = [dict(row) for row in result.fetchall()]
            return rows
    except SQLAlchemyError as e:
        print(f"SQLAlchemy error: {str(e)}")  # Log the error
        return {"error": str(e)}
