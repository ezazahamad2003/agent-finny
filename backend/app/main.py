from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.plaid import router as plaid_router
from app.metrics import router as metrics_router
from app.agent import router as agent_router
from app.waitlist import router as waitlist_router
from app.transactions import router as transactions_router
from app.tasks import router as tasks_router

app = FastAPI(
    title="Agent Finny API",
    description="AI-powered financial assistant backend",
    version="0.1.0"
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(plaid_router)
app.include_router(metrics_router)
app.include_router(agent_router)
app.include_router(waitlist_router)
app.include_router(transactions_router)
app.include_router(tasks_router)

@app.get("/")
def root():
    return {
        "service": "Agent Finny API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"ok": True}

