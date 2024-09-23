from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from enum import Enum
from decimal import Decimal

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
    "mysql": "mysql+mysqlconnector://root:password@localhost/",
    "postgres": "postgresql+psycopg2://postgres:password@localhost/",
    "sqlite": "sqlite:///",  # Local SQLite file
}


# Request Model for POST request
class RunQuery(BaseModel):
    db_name: str  # The database name we want to connect to
    db_type: DBType  # The type of the database
    query: str  # The actual SQL query to execute


@app.get("/")
def index():
    return {"message": "Welcome to the FastAPI server"}


@app.post("/run_query")
async def run_query(request: RunQuery):
    db_name = request.db_name
    db_type = request.db_type
    query = request.query
    result = execute_query(query, db_type, db_name)
    return {"result": result}


def execute_query(query, db_type, db_name):
    # Create the base URL for the database type
    db_url = creds.get(db_type.value)
    print("db_url here", db_url)

    if not db_url:
        return {"error": "Invalid database type"}

    try:
        # For MySQL and Postgres, dynamically append the database name
        if db_type in {DBType.mysql, DBType.postgres, DBType.sqlite}:
            db_url = db_url + db_name

        # Use SQLAlchemy to connect to the database
        engine = create_engine(db_url)

        with engine.connect() as connection:
            result = connection.execute(text(query))
            print("result here", result)
            rows = result.fetchall()

            # Convert rows into dictionaries if they are more than single values
            column_names = result.keys()
            result_list = []
            for row in rows:
                row_dict = {}
                for col, val in zip(column_names, row):
                    # Convert Decimal to float or str before returning because JSON doesn't support Decimal
                    if isinstance(val, Decimal):
                        row_dict[col] = float(val)
                    else:
                        row_dict[col] = val
                result_list.append(row_dict)
            result.close()
            return result_list
    except SQLAlchemyError as e:
        return {"error": str(e)}
