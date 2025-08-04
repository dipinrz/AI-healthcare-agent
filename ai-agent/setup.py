from setuptools import setup, find_packages

setup(
    name="appointment-booking-mcp",
    version="1.0.0",
    description="Healthcare Appointment Booking MCP Server",
    packages=find_packages(),
    install_requires=[
        "mcp>=1.0.0",
        "psycopg2-binary>=2.9.0", 
        "python-dateutil>=2.8.0",
        "pydantic>=2.0.0",
        "asyncpg>=0.28.0",
        "sqlalchemy>=2.0.0"
    ],
    entry_points={
        "console_scripts": [
            "appointment-mcp=appointment_mcp_server:main",
        ],
    },
    python_requires=">=3.8",
)